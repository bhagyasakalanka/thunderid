// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package connection

import (
	"context"
	"errors"
	"testing"

	"github.com/thunder-id/thunderid/internal/system/managedresource"
)

// fakeManagedStore reports a fixed set of owned ids, or a failure.
type fakeManagedStore struct {
	ids map[string]bool
	err error
}

func (f *fakeManagedStore) Mark(_ context.Context, _, _ string) error   { return nil }
func (f *fakeManagedStore) Unmark(_ context.Context, _, _ string) error { return nil }

func (f *fakeManagedStore) IsManaged(_ context.Context, _, id string) (bool, error) {
	return f.ids[id], f.err
}

func (f *fakeManagedStore) ManagedIDs(_ context.Context, _ string) (map[string]bool, error) {
	if f.err != nil {
		return nil, f.err
	}
	return f.ids, nil
}

func useRegistry(t *testing.T, store managedresource.StoreInterface) {
	t.Helper()
	managedresource.SetDefault(managedresource.NewWithStore(store))
	t.Cleanup(func() { managedresource.SetDefault(nil) })
}

func TestFlatListingMarksTheConnectionsTheControlPlaneOwns(t *testing.T) {
	useRegistry(t, &fakeManagedStore{ids: map[string]bool{"conn-managed": true}})

	instances := []connectionInstance{{ID: "conn-managed"}, {ID: "conn-local"}}
	markManagedConnections(context.Background(), instances)

	if !instances[0].IsReadOnly {
		t.Error("expected the owned connection to be reported as read only")
	}
	if instances[1].IsReadOnly {
		t.Error("expected the locally created connection to stay editable")
	}
}

func TestPerTypeListingMarksTheConnectionsTheControlPlaneOwns(t *testing.T) {
	useRegistry(t, &fakeManagedStore{ids: map[string]bool{"sender-managed": true}})

	summaries := []connectionInstanceSummary{{ID: "sender-managed"}, {ID: "sender-local"}}
	markManagedSummaries(context.Background(), summaries)

	if !summaries[0].IsReadOnly {
		t.Error("expected the owned sender to be reported as read only")
	}
	if summaries[1].IsReadOnly {
		t.Error("expected the locally created sender to stay editable")
	}
}

func TestListingLeavesConnectionsEditableWhenOwnershipCannotBeRead(t *testing.T) {
	useRegistry(t, &fakeManagedStore{err: errors.New("database is down")})

	// The write path refuses the change regardless, so an unreadable registry degrades the control
	// a client renders rather than failing the listing outright.
	instances := []connectionInstance{{ID: "conn-managed"}}
	markManagedConnections(context.Background(), instances)

	if instances[0].IsReadOnly {
		t.Error("expected no entry to be marked when ownership cannot be read")
	}
}
