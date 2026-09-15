// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

// Package controlplane designs configuration for gateways to run. It authors documents, versions
// them, and applies them to the data planes it knows about; it never authenticates an end user.
//
// It links none of the runtime: no authorization endpoint, no token issuance, no flow execution.
// Those paths are not guarded on a control plane, they are absent, because nothing here registers
// them.
package controlplane

import (
	"context"

	"github.com/thunder-id/thunderid/internal/authored"
	"github.com/thunder-id/thunderid/internal/server"
)

// Plane describes the control plane to the server that runs it.
//
// It serves the Console and not the Gate: the Gate is where an end user signs in, and end users do
// not sign in to a control plane. Its own operators authenticate against a trusted issuer.
func Plane() server.Plane {
	return server.Plane{
		Name:       "control plane",
		StaticApps: []string{"console"},
		Wire:       wire,
	}
}

// wire mounts the authoring surface on top of the services every plane builds.
func wire(_ context.Context, svcs *server.Services) error {
	_ = authored.Initialize(svcs.Mux)
	return nil
}
