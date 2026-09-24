// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package dataplane

import (
	"context"
	"sync"

	"github.com/thunder-id/thunderid/internal/system/valueref"
	tidcommon "github.com/thunder-id/thunderid/pkg/thunderidengine/common"
)

// The process-wide value placer.
//
// A service reaches it here rather than being handed one, because whether values are placed
// elsewhere is a property of the plane the process is, not of the resource being stored. A control
// plane installs one at startup; a data plane installs nothing and keeps the inline default, which
// is why the same service code stores a value on one plane and a reference on the other.
var (
	defaultMu     sync.RWMutex
	defaultValues ValuesInterface = inline{}
)

// SetDefault installs the value placer this process uses. Only a control plane calls it.
func SetDefault(values ValuesInterface) {
	defaultMu.Lock()
	defer defaultMu.Unlock()
	if values == nil {
		defaultValues = inline{}
		return
	}
	defaultValues = values
}

// Default returns the value placer this process uses.
func Default() ValuesInterface {
	defaultMu.RLock()
	defer defaultMu.RUnlock()
	return defaultValues
}

// inline keeps values where they are, which is what a deployment that holds its own configuration
// does. Place stores the value itself rather than a reference, and Resolve has nothing to resolve.
type inline struct{}

func (inline) Place(_ context.Context, _ valueref.Collection,
	_, _, _, value string) (string, *tidcommon.ServiceError) {
	return value, nil
}

func (inline) Resolve(_ context.Context, stored string) (string, *tidcommon.ServiceError) {
	return stored, nil
}
