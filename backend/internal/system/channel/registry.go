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

package channel

import (
	"sync"
	"time"
)

// ConnEntry is a registered Data Plane connection tracked by the registry.
type ConnEntry interface {
	ID() string
	LastSeen() time.Time
	Close(reason string)
	// CloseNow closes the connection immediately, without the close handshake. It is used to evict a
	// superseded connection so that eviction cannot block on an unresponsive peer.
	CloseNow()
}

// ConnInfo is a point-in-time snapshot of a registered connection, used for observability.
type ConnInfo struct {
	ID       string
	LastSeen time.Time
}

// Registry tracks active Data Plane connections on the Control Plane, keyed by Data Plane id, with a
// single-active-socket-per-id policy.
type Registry[T ConnEntry] struct {
	mu    sync.RWMutex
	conns map[string]T
}

// NewRegistry creates an empty registry.
func NewRegistry[T ConnEntry]() *Registry[T] {
	return &Registry[T]{conns: make(map[string]T)}
}

// Register stores c under its id, evicting any existing connection for that id. Eviction uses
// CloseNow rather than the graceful Close: the old connection is a zombie that does not deserve a
// close handshake, and a slow or unresponsive peer must not be allowed to block the caller (Register
// runs on the new connection's handshake path, before its read loop has started).
func (r *Registry[T]) Register(c T) {
	r.mu.Lock()
	old, existed := r.conns[c.ID()]
	r.conns[c.ID()] = c
	r.mu.Unlock()
	if existed {
		old.CloseNow()
	}
}

// Unregister removes the entry for id only if it is still c, avoiding a race where a newer
// connection replaced c between its read loop ending and this call.
func (r *Registry[T]) Unregister(id string, c T) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if cur, ok := r.conns[id]; ok && any(cur) == any(c) {
		delete(r.conns, id)
	}
}

// Get returns the active connection for id, if any.
func (r *Registry[T]) Get(id string) (T, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	c, ok := r.conns[id]
	return c, ok
}

// List returns a snapshot of all active connections.
func (r *Registry[T]) List() []ConnInfo {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]ConnInfo, 0, len(r.conns))
	for _, c := range r.conns {
		out = append(out, ConnInfo{ID: c.ID(), LastSeen: c.LastSeen()})
	}
	return out
}

// entries returns a snapshot of all active connections for internal fan-out (for example, closing
// every connection during shutdown).
func (r *Registry[T]) entries() []T {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]T, 0, len(r.conns))
	for _, c := range r.conns {
		out = append(out, c)
	}
	return out
}
