// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/thunder-id/thunderid/internal/system/config"
	engineconfig "github.com/thunder-id/thunderid/pkg/thunderidengine/config"
)

// servedBy reports whether a request for the path reaches the handler on a server in this mode.
func servedBy(t *testing.T, mode, path string) bool {
	t.Helper()
	config.ResetServerRuntime()
	if err := config.InitializeServerRuntime("/tmp/test", &config.Config{
		Server: engineconfig.ServerConfig{Mode: mode},
	}); err != nil {
		t.Fatal(err)
	}
	defer config.ResetServerRuntime()

	var reached bool
	handler := PlaneMiddleware(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		reached = true
		w.WriteHeader(http.StatusOK)
	}))
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, path, nil))
	return reached
}

// A control plane runs no identity for end users, and a data plane has configuration applied to it
// rather than written there. Each refuses the other's surface.
func TestPlaneMiddleware_RefusesWhatThisPlaneDoesNotServe(t *testing.T) {
	for _, tc := range []struct {
		mode   string
		path   string
		served bool
	}{
		{"cp", "/oauth2/token", false},
		{"cp", "/flow/execute", false},
		{"cp", "/gate/signin", false},
		{"cp", "/versions", true},
		{"cp", "/applications", true},

		{"dp", "/oauth2/token", true},
		{"dp", "/flow/execute", true},
		{"dp", "/versions", false},
		{"dp", "/gateways", false},
		{"dp", "/applications", true},

		{"", "/oauth2/token", true},
		{"", "/versions", true},
		{"hybrid", "/gateways", true},
	} {
		if got := servedBy(t, tc.mode, tc.path); got != tc.served {
			t.Errorf("mode %q, %s: served = %v, want %v", tc.mode, tc.path, got, tc.served)
		}
	}
}

// A refused path is reported as not found, because on this plane it genuinely is not there. Saying
// forbidden would suggest the right credentials would reach it.
func TestPlaneMiddleware_RefusesAsNotFound(t *testing.T) {
	config.ResetServerRuntime()
	if err := config.InitializeServerRuntime("/tmp/test", &config.Config{
		Server: engineconfig.ServerConfig{Mode: "cp"},
	}); err != nil {
		t.Fatal(err)
	}
	defer config.ResetServerRuntime()

	handler := PlaneMiddleware(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		t.Error("the handler must not be reached")
	}))
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodPost, "/oauth2/token", nil))

	if recorder.Code != http.StatusNotFound {
		t.Errorf("status = %d, want %d", recorder.Code, http.StatusNotFound)
	}
}
