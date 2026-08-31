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
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

type fakeConn struct {
	id     string
	seen   time.Time
	closed bool

	closeMsg string
	// closeDelay simulates a slow graceful-close handshake, so tests can prove that eviction never
	// takes this path.
	closeDelay time.Duration
	closedNow  bool
}

func (f *fakeConn) ID() string          { return f.id }
func (f *fakeConn) LastSeen() time.Time { return f.seen }
func (f *fakeConn) Close(reason string) {
	time.Sleep(f.closeDelay)
	f.closed = true
	f.closeMsg = reason
}
func (f *fakeConn) CloseNow() { f.closedNow = true }

func TestRegistryRegisterGetUnregister(t *testing.T) {
	r := NewRegistry[*fakeConn]()
	c := &fakeConn{id: "dp-1"}
	r.Register(c)

	got, ok := r.Get("dp-1")
	assert.True(t, ok)
	assert.Same(t, c, got)

	r.Unregister("dp-1", c)
	_, ok = r.Get("dp-1")
	assert.False(t, ok)
}

func TestRegistryEvictsDuplicateID(t *testing.T) {
	r := NewRegistry[*fakeConn]()
	old := &fakeConn{id: "dp-1"}
	r.Register(old)
	fresh := &fakeConn{id: "dp-1"}
	r.Register(fresh)

	assert.True(t, old.closedNow, "old connection should be closed immediately on duplicate register")
	got, _ := r.Get("dp-1")
	assert.Same(t, fresh, got)
}

func TestRegistryEvictionDoesNotBlockOnSlowGracefulClose(t *testing.T) {
	r := NewRegistry[*fakeConn]()
	old := &fakeConn{id: "dp-1", closeDelay: 200 * time.Millisecond}
	r.Register(old)

	start := time.Now()
	fresh := &fakeConn{id: "dp-1"}
	r.Register(fresh)
	elapsed := time.Since(start)

	assert.Less(t, elapsed, 100*time.Millisecond,
		"Register must evict with CloseNow, not the slow graceful Close, so it never blocks")
	assert.True(t, old.closedNow, "evicted connection should be closed immediately")
	assert.False(t, old.closed, "eviction must not invoke the graceful Close handshake")

	got, _ := r.Get("dp-1")
	assert.Same(t, fresh, got)
}

func TestRegistryUnregisterOnlyRemovesMatchingEntry(t *testing.T) {
	r := NewRegistry[*fakeConn]()
	fresh := &fakeConn{id: "dp-1"}
	r.Register(fresh)
	stale := &fakeConn{id: "dp-1"}

	r.Unregister("dp-1", stale) // stale is not the current entry; must be a no-op
	got, ok := r.Get("dp-1")
	assert.True(t, ok)
	assert.Same(t, fresh, got)
}

func TestRegistryListSnapshots(t *testing.T) {
	r := NewRegistry[*fakeConn]()
	r.Register(&fakeConn{id: "dp-1", seen: time.Unix(10, 0)})
	r.Register(&fakeConn{id: "dp-2", seen: time.Unix(20, 0)})
	assert.Len(t, r.List(), 2)
}
