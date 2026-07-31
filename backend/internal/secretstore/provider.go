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

// Package provider holds the secret sources this service can serve from.
//
// The interface exists so the eventual key vault backing can replace the current file and environment
// sources without changing the API or its consumers.
package secretstore

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"sort"
	"strings"
	"sync"
)

// Provider resolves secrets by name.
type Provider interface {
	// All returns every secret the provider can serve, keyed by name.
	All(ctx context.Context) (map[string]string, error)
	// Get returns one secret. The boolean reports whether it exists.
	Get(ctx context.Context, name string) (string, bool, error)
	// Name identifies the provider in logs and in the health response.
	Name() string
}

// staticProvider serves secrets held in memory. It is the stand-in for a key vault: the names and
// values are fixed at startup, which is enough for a data plane to resolve its configuration while the
// vault integration does not exist yet.
type staticProvider struct {
	name string

	mu      sync.RWMutex
	secrets map[string]string
}

// NewStatic builds a provider over a fixed set of secrets.
func NewStatic(name string, secrets map[string]string) Provider {
	copied := make(map[string]string, len(secrets))
	for k, v := range secrets {
		copied[k] = v
	}
	return &staticProvider{name: name, secrets: copied}
}

// NewFromFile builds a provider from a JSON object of name to value.
func NewFromFile(path string) (Provider, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read secret file %s: %w", path, err)
	}
	var secrets map[string]string
	if err := json.Unmarshal(raw, &secrets); err != nil {
		return nil, fmt.Errorf("failed to parse secret file %s: %w", path, err)
	}
	return NewStatic("file:"+path, secrets), nil
}

// EnvSecrets reads secrets from environment variables carrying a given prefix. The prefix is stripped,
// so THUNDERID_SECRET_MY_APP_CLIENT_SECRET is read as MY_APP_CLIENT_SECRET.
func EnvSecrets(prefix string) map[string]string {
	secrets := map[string]string{}
	for _, entry := range os.Environ() {
		eq := strings.IndexByte(entry, '=')
		if eq < 0 {
			continue
		}
		key, value := entry[:eq], entry[eq+1:]
		if !strings.HasPrefix(key, prefix) || len(key) == len(prefix) {
			continue
		}
		secrets[strings.TrimPrefix(key, prefix)] = value
	}
	return secrets
}

func (p *staticProvider) Name() string { return p.name }

func (p *staticProvider) All(context.Context) (map[string]string, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	out := make(map[string]string, len(p.secrets))
	for k, v := range p.secrets {
		out[k] = v
	}
	return out, nil
}

func (p *staticProvider) Get(_ context.Context, name string) (string, bool, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	value, ok := p.secrets[name]
	return value, ok, nil
}

// Chain serves from several providers in order, the first match winning. It lets a deployment layer a
// file of defaults under environment overrides without either source knowing about the other.
type Chain struct {
	providers []Provider
}

// NewChain builds a Chain over the given providers, highest precedence first.
func NewChain(providers ...Provider) *Chain {
	return &Chain{providers: providers}
}

// Name lists the chained providers in precedence order.
func (c *Chain) Name() string {
	names := make([]string, 0, len(c.providers))
	for _, p := range c.providers {
		names = append(names, p.Name())
	}
	return strings.Join(names, ",")
}

// All merges every provider's secrets, with earlier providers winning.
func (c *Chain) All(ctx context.Context) (map[string]string, error) {
	out := map[string]string{}
	// Walk in reverse so that earlier providers overwrite later ones.
	for i := len(c.providers) - 1; i >= 0; i-- {
		secrets, err := c.providers[i].All(ctx)
		if err != nil {
			return nil, err
		}
		for k, v := range secrets {
			out[k] = v
		}
	}
	return out, nil
}

// Get returns the first provider's value for name.
func (c *Chain) Get(ctx context.Context, name string) (string, bool, error) {
	for _, p := range c.providers {
		value, ok, err := p.Get(ctx, name)
		if err != nil {
			return "", false, err
		}
		if ok {
			return value, true, nil
		}
	}
	return "", false, nil
}

// SortedNames returns a provider's secret names, for diagnostics that must not expose values.
func SortedNames(secrets map[string]string) []string {
	names := make([]string, 0, len(secrets))
	for name := range secrets {
		names = append(names, name)
	}
	sort.Strings(names)
	return names
}
