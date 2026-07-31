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

package secretstore

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"sync"
)

// Store holds the secrets this service serves and accepts writes for.
//
// Writes arrive from a control plane the moment a secret is created or updated, so they must take
// effect immediately rather than waiting for a configuration promotion. Persistence is a JSON file
// when one is configured, which keeps secrets across a restart until a real key vault backs this.
type Store struct {
	path string

	mu      sync.RWMutex
	secrets map[string]Secret
}

// NewStore opens a store, loading any secrets already persisted at path. An empty path keeps the store
// in memory only.
func NewStore(path string) (*Store, error) {
	s := &Store{path: path, secrets: map[string]Secret{}}
	if path == "" {
		return s, nil
	}

	raw, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return s, nil
		}
		return nil, fmt.Errorf("failed to read secret store %s: %w", path, err)
	}
	if err := json.Unmarshal(raw, &s.secrets); err != nil {
		// A plain name to value object is also accepted, so an operator can hand-write a simple file.
		var plain map[string]string
		if plainErr := json.Unmarshal(raw, &plain); plainErr != nil {
			return nil, fmt.Errorf("failed to parse secret store %s: %w", path, err)
		}
		s.secrets = map[string]Secret{}
		for name, value := range plain {
			s.secrets[name] = Secret{Name: name, Kind: KindValue, Value: value}
		}
	}
	for name, secret := range s.secrets {
		secret.Name = name
		s.secrets[name] = secret
	}
	return s, nil
}

// Put stores a secret, replacing any entry of the same name.
func (s *Store) Put(secret Secret) error {
	if err := secret.Validate(); err != nil {
		return err
	}
	s.mu.Lock()
	s.secrets[secret.Name] = secret
	s.mu.Unlock()
	return s.persist()
}

// Get returns a secret by name.
func (s *Store) Get(name string) (Secret, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	secret, ok := s.secrets[name]
	return secret, ok
}

// Delete removes a secret. Removing an absent name is not an error, so a repeated delete is safe.
func (s *Store) Delete(name string) error {
	s.mu.Lock()
	delete(s.secrets, name)
	s.mu.Unlock()
	return s.persist()
}

// All returns every secret, keyed by name. This is what a data plane loads at startup.
func (s *Store) All() map[string]Secret {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make(map[string]Secret, len(s.secrets))
	for name, secret := range s.secrets {
		out[name] = secret
	}
	return out
}

// Names returns the stored names in order, for diagnostics that must not expose values.
func (s *Store) Names() []string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	names := make([]string, 0, len(s.secrets))
	for name := range s.secrets {
		names = append(names, name)
	}
	sort.Strings(names)
	return names
}

// persist writes the store to disk when a path is configured.
func (s *Store) persist() error {
	if s.path == "" {
		return nil
	}

	s.mu.RLock()
	raw, err := json.MarshalIndent(s.secrets, "", "  ")
	s.mu.RUnlock()
	if err != nil {
		return fmt.Errorf("failed to encode secrets: %w", err)
	}

	if dir := filepath.Dir(s.path); dir != "" {
		if err := os.MkdirAll(dir, 0o700); err != nil {
			return fmt.Errorf("failed to create secret store directory: %w", err)
		}
	}
	tmp := s.path + ".tmp"
	// Secrets are readable by their owner only.
	if err := os.WriteFile(tmp, raw, 0o600); err != nil {
		return fmt.Errorf("failed to write secret store: %w", err)
	}
	if err := os.Rename(tmp, s.path); err != nil {
		return fmt.Errorf("failed to commit secret store: %w", err)
	}
	return nil
}
