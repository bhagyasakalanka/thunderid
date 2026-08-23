// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package ou

import (
	"context"
	"testing"

	"github.com/thunder-id/thunderid/internal/system/managedresource"
	"github.com/thunder-id/thunderid/pkg/thunderidengine/providers"
)

// fakeManagedStore reports a fixed set of owned ids.
type fakeManagedStore struct{ ids map[string]bool }

func (f *fakeManagedStore) Mark(_ context.Context, _, _ string) error   { return nil }
func (f *fakeManagedStore) Unmark(_ context.Context, _, _ string) error { return nil }

func (f *fakeManagedStore) IsManaged(_ context.Context, _, id string) (bool, error) {
	return f.ids[id], nil
}

func (f *fakeManagedStore) ManagedIDs(_ context.Context, _ string) (map[string]bool, error) {
	return f.ids, nil
}

func useOwnedOUs(t *testing.T, ids ...string) {
	t.Helper()
	owned := map[string]bool{}
	for _, id := range ids {
		owned[id] = true
	}
	managedresource.SetDefault(managedresource.NewWithStore(&fakeManagedStore{ids: owned}))
	t.Cleanup(func() { managedresource.SetDefault(nil) })
}

// A child listing reaches the client through the shared builder, so the marking has to happen there
// rather than in the one caller that remembered it.
func TestChildListingMarksTheOrganizationUnitsTheControlPlaneOwns(t *testing.T) {
	useOwnedOUs(t, "ou-managed")

	children := []providers.OrganizationUnitBasic{{ID: "ou-managed"}, {ID: "ou-local"}}
	response, svcErr := buildOrganizationUnitListResponse(
		context.Background(), "/organization-units", children, 2, 10, 0)
	if svcErr != nil {
		t.Fatalf("failed to build the listing: %v", svcErr)
	}

	if !response.OrganizationUnits[0].IsReadOnly {
		t.Error("expected the owned organization unit to be reported as read only")
	}
	if response.OrganizationUnits[1].IsReadOnly {
		t.Error("expected the locally created organization unit to stay editable")
	}
}

func TestMarkManagedOUsLeavesLocallyCreatedUnitsEditable(t *testing.T) {
	useOwnedOUs(t, "ou-managed")

	ous := []providers.OrganizationUnitBasic{{ID: "ou-managed"}, {ID: "ou-local"}}
	markManagedOUs(context.Background(), ous)

	if !ous[0].IsReadOnly || ous[1].IsReadOnly {
		t.Errorf("expected only the owned unit to be read only, got %v and %v",
			ous[0].IsReadOnly, ous[1].IsReadOnly)
	}
}
