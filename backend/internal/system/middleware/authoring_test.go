// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/thunder-id/thunderid/internal/system/config"
	"github.com/thunder-id/thunderid/internal/system/parameterise"
	engineconfig "github.com/thunder-id/thunderid/pkg/thunderidengine/config"
)

// modeSeenBy reports whether the request reaching a handler is in parameterised mode.
func modeSeenBy(t *testing.T, authoring bool) bool {
	t.Helper()
	config.ResetServerRuntime()
	if err := config.InitializeServerRuntime("/tmp/test", &config.Config{
		Server: engineconfig.ServerConfig{Authoring: authoring},
	}); err != nil {
		t.Fatal(err)
	}
	defer config.ResetServerRuntime()

	var seen bool
	handler := AuthoringMiddleware(http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
		seen = parameterise.Enabled(r.Context())
	}))
	handler.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/applications", nil))
	return seen
}

// An authoring plane serves the parameterised contract, and a gateway serves the full one. The two
// are selected here and nowhere else.
func TestAuthoringMiddleware_SelectsTheContract(t *testing.T) {
	if !modeSeenBy(t, true) {
		t.Error("an authoring plane should mark its requests as parameterised")
	}
	if modeSeenBy(t, false) {
		t.Error("a gateway must never be in parameterised mode")
	}
}
