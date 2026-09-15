// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

// Package plane says which of the product's planes a server is running as, and what that plane
// serves.
//
// The product is not forked per plane. It is one codebase with one set of services, run three ways:
// a control plane that designs configuration, a data plane that runs it, and a hybrid that does
// both. What separates them is what each answers to, which is stated here and nowhere else so that
// the answer cannot differ between two places that both think they know it.
package plane

import "strings"

// Plane is the role a running server has.
type Plane string

const (
	// Hybrid designs configuration and runs it. This is the single-server product, and the default.
	Hybrid Plane = "hybrid"
	// Control designs configuration that is applied to data planes. It runs no authentication of
	// its own: nobody logs in to a control plane to reach an application, they log in to administer
	// one.
	Control Plane = "cp"
	// Data runs configuration a control plane applied to it, and administers itself.
	Data Plane = "dp"
)

// Parse reads a configured mode, falling back to Hybrid when none is set. An unrecognized value is
// reported rather than guessed at, because guessing would silently serve the wrong surface.
func Parse(mode string) (Plane, bool) {
	switch Plane(strings.ToLower(strings.TrimSpace(mode))) {
	case "":
		return Hybrid, true
	case Hybrid:
		return Hybrid, true
	case Control:
		return Control, true
	case Data:
		return Data, true
	default:
		return Hybrid, false
	}
}

// ServesRuntime reports whether this plane runs identity for end users: authentication, flows,
// tokens and the login gate. A control plane does not.
func (p Plane) ServesRuntime() bool { return p != Control }

// ServesAuthoring reports whether this plane designs configuration to be applied elsewhere: the
// captured versions, the gateways they are applied to, and the values each gateway supplies. A data
// plane does not, because configuration arrives at it rather than being written there.
func (p Plane) ServesAuthoring() bool { return p != Data }

// String returns the configured form of the plane.
func (p Plane) String() string { return string(p) }
