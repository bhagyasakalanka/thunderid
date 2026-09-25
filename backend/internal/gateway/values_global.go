// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package gateway

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
// plane installs one at startup; a deployment that holds its own configuration installs nothing and
// keeps the inline default. That is why the same service code stores a value on one and a reference
// on the other.
var (
	valuesMu       sync.RWMutex
	installedValue ValuesInterface = inlineValues{}
)

// SetValues installs the value placer this process uses. Only a control plane calls it.
func SetValues(values ValuesInterface) {
	valuesMu.Lock()
	defer valuesMu.Unlock()
	if values == nil {
		installedValue = inlineValues{}
		return
	}
	installedValue = values
}

// Values returns the value placer this process uses.
func Values() ValuesInterface {
	valuesMu.RLock()
	defer valuesMu.RUnlock()
	return installedValue
}

// inlineValues keeps values where they are, which is what a deployment that holds its own
// configuration does. Place stores the value itself rather than a reference, and Resolve has
// nothing to resolve.
type inlineValues struct{}

func (inlineValues) Place(_ context.Context, _ valueref.Collection,
	_, _, _, value string) (string, *tidcommon.ServiceError) {
	return value, nil
}

func (inlineValues) Resolve(_ context.Context, stored string) (string, *tidcommon.ServiceError) {
	return stored, nil
}
