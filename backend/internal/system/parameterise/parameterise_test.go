// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package parameterise

import (
	"context"
	"testing"
)

func TestEnabled_DefaultsToOff(t *testing.T) {
	if Enabled(context.Background()) {
		t.Fatal("a context that never passed a control plane edge must validate strictly")
	}
}

func TestEnabled_OnWhenMarked(t *testing.T) {
	if !Enabled(WithMode(context.Background())) {
		t.Fatal("expected the authoring mode to be carried on the context")
	}
}

func TestIsPlaceholder(t *testing.T) {
	for _, tc := range []struct {
		value string
		want  bool
	}{
		{"var:CALLBACK_URL", true},
		{"sec:APP_SECRET", true},
		{"{{CALLBACK_URL}}", true},
		{"sec:APP_X_SECRET", true},
		{"  sec:APP_X_SECRET  ", true},
		{"https://example.com/callback", false},
		{"", false},
		{"{{}}", false},
		{"{{.}}", false},
		{"not a placeholder", false},
	} {
		if got := IsPlaceholder(tc.value); got != tc.want {
			t.Errorf("IsPlaceholder(%q) = %v, want %v", tc.value, got, tc.want)
		}
	}
}

// Skip needs both halves: outside authoring a placeholder is simply an invalid value, so a gateway
// cannot be handed one and store it.
func TestSkip_RequiresBothTheModeAndAPlaceholder(t *testing.T) {
	authoring := WithMode(context.Background())
	strict := context.Background()

	if !Skip(authoring, "var:CALLBACK_URL") {
		t.Error("authoring a placeholder should be skipped")
	}
	if Skip(authoring, "https://example.com") {
		t.Error("a real value must still be validated while authoring")
	}
	if Skip(strict, "var:CALLBACK_URL") {
		t.Error("a placeholder outside authoring must be rejected, not skipped")
	}
}

func TestContainsPlaceholder(t *testing.T) {
	if !ContainsPlaceholder([]string{"https://example.com", "var:CALLBACK_URL"}) {
		t.Error("expected a list holding a placeholder to be reported")
	}
	if ContainsPlaceholder([]string{"https://example.com"}) {
		t.Error("expected a list of real values to be reported as such")
	}
}
