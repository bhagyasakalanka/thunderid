/*
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Package store persists environments and their version history to the local filesystem. Version
// history is bounded: each environment retains its current version plus up to KeepPrevious older
// versions (and always the currently-applied version, even if it falls outside that window).
package store

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"sync"

	"github.com/thunder-id/thunderid/internal/envmgr/model"
)

// KeepPrevious is how many previous versions to retain in addition to the current one.
const KeepPrevious = 3

// ErrNotFound is returned when an environment or version does not exist.
var ErrNotFound = errors.New("not found")

// Store is a filesystem-backed repository for environments and versions.
type Store struct {
	root string
	mu   sync.RWMutex
	envs map[string]model.Environment
}

// New opens (or initializes) a store rooted at dir.
func New(dir string) (*Store, error) {
	if err := os.MkdirAll(filepath.Join(dir, "versions"), 0o755); err != nil {
		return nil, fmt.Errorf("failed to create store directory: %w", err)
	}
	s := &Store{root: dir, envs: map[string]model.Environment{}}
	if err := s.loadEnvironments(); err != nil {
		return nil, err
	}
	return s, nil
}

// ---- environments ----

// SaveEnvironment inserts or updates an environment.
func (s *Store) SaveEnvironment(env model.Environment) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.envs[env.ID] = env
	return s.persistEnvironments()
}

// GetEnvironment returns an environment by id.
func (s *Store) GetEnvironment(id string) (model.Environment, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	env, ok := s.envs[id]
	if !ok {
		return model.Environment{}, ErrNotFound
	}
	return env, nil
}

// ListEnvironments returns all environments ordered by rank then name.
func (s *Store) ListEnvironments() []model.Environment {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]model.Environment, 0, len(s.envs))
	for _, env := range s.envs {
		out = append(out, env)
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Rank != out[j].Rank {
			return out[i].Rank < out[j].Rank
		}
		return out[i].Name < out[j].Name
	})
	return out
}

// DeleteEnvironment removes an environment and all of its versions.
func (s *Store) DeleteEnvironment(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.envs[id]; !ok {
		return ErrNotFound
	}
	delete(s.envs, id)
	if err := os.RemoveAll(s.envVersionsDir(id)); err != nil {
		return fmt.Errorf("failed to remove versions: %w", err)
	}
	return s.persistEnvironments()
}

// NextRank returns a rank one above the current maximum, for placing a new environment at the top of
// the chain by default.
func (s *Store) NextRank() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	max := 0
	for _, env := range s.envs {
		if env.Rank > max {
			max = env.Rank
		}
	}
	return max + 1
}

// ---- versions ----

// AddVersion assigns the next sequence to v, persists it, and prunes old versions. The stored version
// (with its assigned Seq) is returned.
func (s *Store) AddVersion(v model.Version) (model.Version, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	env, ok := s.envs[v.EnvID]
	if !ok {
		return model.Version{}, ErrNotFound
	}

	seqs, err := s.versionSeqs(v.EnvID)
	if err != nil {
		return model.Version{}, err
	}
	next := 1
	if len(seqs) > 0 {
		next = seqs[len(seqs)-1] + 1
	}
	v.Seq = next
	if err := s.writeVersion(v); err != nil {
		return model.Version{}, err
	}
	if err := s.prune(v.EnvID, env.AppliedSeq); err != nil {
		return model.Version{}, err
	}
	return v, nil
}

// GetVersion returns a full version (including resources and variables).
func (s *Store) GetVersion(envID string, seq int) (model.Version, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.readVersion(envID, seq)
}

// ListVersions returns version metadata (payload stripped) newest first.
func (s *Store) ListVersions(envID string) ([]model.Version, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	seqs, err := s.versionSeqs(envID)
	if err != nil {
		return nil, err
	}
	out := make([]model.Version, 0, len(seqs))
	for i := len(seqs) - 1; i >= 0; i-- {
		v, err := s.readVersion(envID, seqs[i])
		if err != nil {
			return nil, err
		}
		v.Resources = ""
		v.Variables = nil
		out = append(out, v)
	}
	return out, nil
}

// LatestSeq returns the highest version sequence for an environment, or 0 if none exist.
func (s *Store) LatestSeq(envID string) (int, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	seqs, err := s.versionSeqs(envID)
	if err != nil {
		return 0, err
	}
	if len(seqs) == 0 {
		return 0, nil
	}
	return seqs[len(seqs)-1], nil
}

// ---- internals ----

func (s *Store) environmentsFile() string { return filepath.Join(s.root, "environments.json") }
func (s *Store) envVersionsDir(id string) string {
	return filepath.Join(s.root, "versions", id)
}
func (s *Store) versionFile(envID string, seq int) string {
	return filepath.Join(s.envVersionsDir(envID), fmt.Sprintf("%d.json", seq))
}

func (s *Store) loadEnvironments() error {
	raw, err := os.ReadFile(s.environmentsFile())
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("failed to read environments: %w", err)
	}
	var list []model.Environment
	if err := json.Unmarshal(raw, &list); err != nil {
		return fmt.Errorf("failed to parse environments: %w", err)
	}
	for _, env := range list {
		s.envs[env.ID] = env
	}
	return nil
}

func (s *Store) persistEnvironments() error {
	list := make([]model.Environment, 0, len(s.envs))
	for _, env := range s.envs {
		list = append(list, env)
	}
	sort.Slice(list, func(i, j int) bool { return list[i].ID < list[j].ID })
	return writeJSONAtomic(s.environmentsFile(), list)
}

// versionSeqs returns the existing version sequences for an environment in ascending order.
func (s *Store) versionSeqs(envID string) ([]int, error) {
	entries, err := os.ReadDir(s.envVersionsDir(envID))
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to list versions: %w", err)
	}
	var seqs []int
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		var seq int
		if _, err := fmt.Sscanf(e.Name(), "%d.json", &seq); err == nil {
			seqs = append(seqs, seq)
		}
	}
	sort.Ints(seqs)
	return seqs, nil
}

func (s *Store) writeVersion(v model.Version) error {
	if err := os.MkdirAll(s.envVersionsDir(v.EnvID), 0o755); err != nil {
		return fmt.Errorf("failed to create versions directory: %w", err)
	}
	return writeJSONAtomic(s.versionFile(v.EnvID, v.Seq), v)
}

func (s *Store) readVersion(envID string, seq int) (model.Version, error) {
	raw, err := os.ReadFile(s.versionFile(envID, seq))
	if err != nil {
		if os.IsNotExist(err) {
			return model.Version{}, ErrNotFound
		}
		return model.Version{}, fmt.Errorf("failed to read version: %w", err)
	}
	var v model.Version
	if err := json.Unmarshal(raw, &v); err != nil {
		return model.Version{}, fmt.Errorf("failed to parse version: %w", err)
	}
	return v, nil
}

// prune keeps the newest KeepPrevious+1 versions plus the applied version, removing the rest.
func (s *Store) prune(envID string, appliedSeq int) error {
	seqs, err := s.versionSeqs(envID)
	if err != nil {
		return err
	}
	keep := map[int]bool{}
	for i := len(seqs) - 1; i >= 0 && len(keep) < KeepPrevious+1; i-- {
		keep[seqs[i]] = true
	}
	if appliedSeq > 0 {
		keep[appliedSeq] = true
	}
	for _, seq := range seqs {
		if keep[seq] {
			continue
		}
		if err := os.Remove(s.versionFile(envID, seq)); err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("failed to prune version %d: %w", seq, err)
		}
	}
	return nil
}

func writeJSONAtomic(path string, v interface{}) error {
	raw, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to encode: %w", err)
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, raw, 0o600); err != nil {
		return fmt.Errorf("failed to write: %w", err)
	}
	if err := os.Rename(tmp, path); err != nil {
		return fmt.Errorf("failed to commit write: %w", err)
	}
	return nil
}
