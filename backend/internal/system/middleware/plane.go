// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package middleware

import (
	"net/http"

	"github.com/thunder-id/thunderid/internal/system/config"
	"github.com/thunder-id/thunderid/internal/system/plane"
)

// PlaneMiddleware refuses a request for a surface this plane does not run.
//
// The services are wired the same way on every plane, so without this a control plane would answer
// /oauth2/token with a handler for a runtime it does not have. Refusing at the edge means the caller
// is told plainly that this server does not serve that path, rather than discovering it from
// whatever a half-configured runtime returns.
//
// It is a not-found rather than a forbidden: on this plane the path genuinely does not exist, and
// saying "forbidden" would suggest the right credentials would reach it.
func PlaneMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if current().Serves(r.URL.Path) {
			next.ServeHTTP(w, r)
			return
		}
		http.NotFound(w, r)
	})
}

// current reads the plane this server runs as. An unset or unreadable configuration is the hybrid
// product, which is what a server that was never told otherwise has always been.
func current() plane.Plane {
	if !config.IsServerRuntimeInitialized() {
		return plane.Hybrid
	}
	p, _ := plane.Parse(config.GetServerRuntime().Config.Server.Mode)
	return p
}
