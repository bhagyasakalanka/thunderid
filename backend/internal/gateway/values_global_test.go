// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package gateway

import (
	"context"
	"testing"

	"github.com/thunder-id/thunderid/internal/system/valueref"
	tidcommon "github.com/thunder-id/thunderid/pkg/thunderidengine/common"
)

// restoreValues puts the process-wide placer back after a test has replaced it.
func restoreValues(t *testing.T) {
	t.Helper()
	previous := Values()
	t.Cleanup(func() { SetValues(previous) })
}

// A deployment that holds its own configuration installs nothing, and the default keeps values
// where they are. This is what makes the same service code store a value on one plane and a
// reference on the other.
func TestTheDefaultKeepsValuesWhereTheyAre(t *testing.T) {
	restoreValues(t)
	SetValues(nil)

	stored, svcErr := Values().Place(context.Background(), valueref.CollectionSecret,
		"connection", "github", "clientSecret", testGatewaySecret)
	if svcErr != nil {
		t.Fatalf("Place failed: %v", svcErr)
	}
	if stored != testGatewaySecret {
		t.Errorf("expected the value itself, got %q", stored)
	}

	read, svcErr := Values().Resolve(context.Background(), testGatewaySecret)
	if svcErr != nil {
		t.Fatalf("Resolve failed: %v", svcErr)
	}
	if read != testGatewaySecret {
		t.Errorf("expected the value unchanged, got %q", read)
	}
}

// recordingValues stands in for a control plane's placer.
type recordingValues struct {
	placed string
}

func (r *recordingValues) Place(_ context.Context, _ valueref.Collection,
	_, _, _, value string) (string, *tidcommon.ServiceError) {
	r.placed = value
	return "sec:PLACED", nil
}

func (r *recordingValues) Resolve(_ context.Context, _ string) (string, *tidcommon.ServiceError) {
	return "resolved", nil
}

// A control plane installs one at startup, and every service then places values through it.
func TestAnInstalledPlacerIsWhatServicesUse(t *testing.T) {
	restoreValues(t)
	installed := &recordingValues{}
	SetValues(installed)

	stored, svcErr := Values().Place(context.Background(), valueref.CollectionSecret,
		"connection", "github", "clientSecret", testGatewaySecret)
	if svcErr != nil {
		t.Fatalf("Place failed: %v", svcErr)
	}
	if stored != "sec:PLACED" {
		t.Errorf("expected the installed placer's reference, got %q", stored)
	}
	if installed.placed != testGatewaySecret {
		t.Errorf("the value did not reach the installed placer, got %q", installed.placed)
	}
}

// Installing nothing returns to keeping values where they are, rather than leaving a placer that
// would reach for a gateway this process does not administer.
func TestInstallingNothingRestoresTheDefault(t *testing.T) {
	restoreValues(t)
	SetValues(&recordingValues{})
	SetValues(nil)

	stored, svcErr := Values().Place(context.Background(), valueref.CollectionVariable,
		"application", "web", "url", "https://app.example.com")
	if svcErr != nil {
		t.Fatalf("Place failed: %v", svcErr)
	}
	if stored != "https://app.example.com" {
		t.Errorf("expected the value itself, got %q", stored)
	}
}
