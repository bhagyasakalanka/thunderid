// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package middleware

import (
	"net/http"

	"github.com/thunder-id/thunderid/internal/system/config"
	"github.com/thunder-id/thunderid/internal/system/parameterise"
)

// AuthoringMiddleware marks every request on an authoring plane as authoring a parameterised payload.
//
// This is the one place the mode is set. Putting it at the server edge rather than in each handler is
// what keeps a single implementation of every validator serving both contracts: a gateway never
// passes through this, so its behavior is exactly what it was, and an authoring plane sets the flag
// once for everything it serves.
func AuthoringMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !config.IsServerRuntimeInitialized() ||
			!config.GetServerRuntime().Config.Server.Authoring {
			next.ServeHTTP(w, r)
			return
		}
		next.ServeHTTP(w, r.WithContext(parameterise.WithMode(r.Context())))
	})
}
