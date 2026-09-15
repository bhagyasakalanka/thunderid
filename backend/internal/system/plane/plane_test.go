// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package plane

import "testing"

// A mode that is not one of the three is reported rather than guessed at: guessing would serve the
// wrong surface silently, which is worse than refusing to start.
func TestParse(t *testing.T) {
	for _, tc := range []struct {
		mode  string
		want  Plane
		valid bool
	}{
		{"", Hybrid, true},
		{"hybrid", Hybrid, true},
		{"cp", Control, true},
		{"dp", Data, true},
		{"  CP  ", Control, true},
		{"control", Hybrid, false},
		{"anything", Hybrid, false},
	} {
		got, ok := Parse(tc.mode)
		if got != tc.want || ok != tc.valid {
			t.Errorf("Parse(%q) = (%s, %v), want (%s, %v)", tc.mode, got, ok, tc.want, tc.valid)
		}
	}
}

// What each plane serves, stated once so the two halves cannot disagree.
func TestWhatEachPlaneServes(t *testing.T) {
	for _, tc := range []struct {
		plane     Plane
		runtime   bool
		authoring bool
	}{
		{Hybrid, true, true},
		{Control, false, true},
		{Data, true, false},
	} {
		if tc.plane.ServesRuntime() != tc.runtime {
			t.Errorf("%s: ServesRuntime = %v, want %v", tc.plane, tc.plane.ServesRuntime(), tc.runtime)
		}
		if tc.plane.ServesAuthoring() != tc.authoring {
			t.Errorf("%s: ServesAuthoring = %v, want %v", tc.plane, tc.plane.ServesAuthoring(), tc.authoring)
		}
	}
}

// A request for a surface this plane does not run is refused, and everything else is served.
func TestServes(t *testing.T) {
	for _, tc := range []struct {
		path   string
		hybrid bool
		cp     bool
		dp     bool
	}{
		// Runtime: a control plane runs no identity for end users.
		{"/oauth2/token", true, false, true},
		{"/oauth2/authorize", true, false, true},
		{"/flow/execute", true, false, true},
		{"/gate/signin", true, false, true},
		{"/.well-known/openid-configuration", true, false, true},

		// Authoring: configuration arrives at a data plane rather than being written there.
		{"/authored", true, true, false},
		{"/authored/application/Storefront", true, true, false},
		{"/versions", true, true, false},
		{"/versions/3/variables", true, true, false},
		{"/gateways", true, true, false},
		{"/gateways/abc/apply", true, true, false},

		// Configuration management: every plane holds the configuration it works with.
		{"/applications", true, true, true},
		{"/users", true, true, true},
		{"/roles", true, true, true},
		{"/health/liveness", true, true, true},

		// A path that merely begins with the same letters is not the route.
		{"/versionsomething", true, true, true},
		{"/gatewaysx", true, true, true},
	} {
		for plane, want := range map[Plane]bool{Hybrid: tc.hybrid, Control: tc.cp, Data: tc.dp} {
			if got := plane.Serves(tc.path); got != want {
				t.Errorf("%s.Serves(%q) = %v, want %v", plane, tc.path, got, want)
			}
		}
	}
}
