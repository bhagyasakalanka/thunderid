// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package dataplane

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/thunder-id/thunderid/internal/gateway"
	"github.com/thunder-id/thunderid/internal/system/valueref"
	tidcommon "github.com/thunder-id/thunderid/pkg/thunderidengine/common"
)

// stubGateways stands in for the gateway service, holding one managed registration.
type stubGateways struct {
	gateway.ServiceInterface
	managed *gateway.Gateway
	err     *tidcommon.ServiceError
}

func (s *stubGateways) Managed(context.Context) (*gateway.Gateway, *tidcommon.ServiceError) {
	return s.managed, s.err
}

func managedAt(url string) *stubGateways {
	return &stubGateways{managed: &gateway.Gateway{
		ID: "gw-1", Name: "production", BaseURL: url, Key: "the-token",
		ManagedByControlPlane: true,
	}}
}

// A credential goes to the secret collection and what is stored in its place is a reference naming
// it. The control plane keeps the name, never the value.
func TestPlacingACredentialStoresAReference(t *testing.T) {
	var path, body string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path = r.URL.Path
		buf := make([]byte, r.ContentLength)
		_, _ = r.Body.Read(buf)
		body = string(buf)
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	v := NewValues(managedAt(srv.URL))
	stored, svcErr := v.Place(context.Background(), valueref.CollectionSecret,
		"application", "My App", "ClientSecret", "the-secret")

	if svcErr != nil {
		t.Fatalf("placing failed: %v", svcErr)
	}
	if stored != "sec:APPLICATION_MY_APP_CLIENT_SECRET" {
		t.Fatalf("stored %q", stored)
	}
	if path != "/secrets/APPLICATION_MY_APP_CLIENT_SECRET" {
		t.Fatalf("went to %q", path)
	}
	if !contains(body, "the-secret") {
		t.Fatalf("the value did not reach the data plane: %s", body)
	}
}

// An ordinary value goes to the variable collection, and its reference says so.
func TestPlacingAValueStoresAVariableReference(t *testing.T) {
	var path string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path = r.URL.Path
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	v := NewValues(managedAt(srv.URL))
	stored, svcErr := v.Place(context.Background(), valueref.CollectionVariable,
		"application", "My App", "ClientId", "the-id")

	if svcErr != nil {
		t.Fatalf("placing failed: %v", svcErr)
	}
	if stored != "var:APPLICATION_MY_APP_CLIENT_ID" {
		t.Fatalf("stored %q", stored)
	}
	if path != "/variables/APPLICATION_MY_APP_CLIENT_ID" {
		t.Fatalf("went to %q", path)
	}
}

// Nothing is stored when the data plane cannot be reached. A resource kept with a reference to a
// value that was never placed would fail when it was used rather than when it was created.
func TestPlacingFailsWhenTheDataPlaneIsUnreachable(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {}))
	addr := srv.URL
	srv.Close()

	v := NewValues(managedAt(addr))
	stored, svcErr := v.Place(context.Background(), valueref.CollectionSecret,
		"application", "My App", "ClientSecret", "the-secret")

	if svcErr == nil {
		t.Fatal("placing succeeded against an unreachable data plane")
	}
	if svcErr.Code != ErrorDataPlaneUnreachable.Code {
		t.Fatalf("reported %s, want %s", svcErr.Code, ErrorDataPlaneUnreachable.Code)
	}
	if stored != "" {
		t.Fatalf("a reference was returned for a value that was never placed: %q", stored)
	}
}

// A refused token is reported apart from a data plane that is down, because retrying cannot fix it.
func TestARefusedTokenIsReportedApart(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	}))
	defer srv.Close()

	v := NewValues(managedAt(srv.URL))
	_, svcErr := v.Place(context.Background(), valueref.CollectionSecret,
		"application", "My App", "ClientSecret", "s")

	if svcErr == nil || svcErr.Code != ErrorDataPlaneRefusedTheToken.Code {
		t.Fatalf("reported %v, want %s", svcErr, ErrorDataPlaneRefusedTheToken.Code)
	}
}

// Reading back a variable reference returns the value the data plane holds.
func TestResolvingAVariableReturnsItsValue(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"name":"APPLICATION_MY_APP_CLIENT_ID","value":"the-id"}`))
	}))
	defer srv.Close()

	v := NewValues(managedAt(srv.URL))
	got, svcErr := v.Resolve(context.Background(), "var:APPLICATION_MY_APP_CLIENT_ID")

	if svcErr != nil {
		t.Fatalf("resolving failed: %v", svcErr)
	}
	if got != "the-id" {
		t.Fatalf("resolved to %q", got)
	}
}

// A secret reference is returned as it stands and the data plane is not called: it would not give
// the value back, so there is nothing to ask for.
func TestResolvingASecretAsksTheDataPlaneNothing(t *testing.T) {
	var called bool
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	v := NewValues(managedAt(srv.URL))
	got, svcErr := v.Resolve(context.Background(), "sec:APPLICATION_MY_APP_CLIENT_SECRET")

	if svcErr != nil {
		t.Fatalf("resolving failed: %v", svcErr)
	}
	if got != "sec:APPLICATION_MY_APP_CLIENT_SECRET" {
		t.Fatalf("a secret reference was rewritten to %q", got)
	}
	if called {
		t.Fatal("the data plane was asked for a secret's value")
	}
}

// A value that is not a reference is its own value, and passes through untouched.
func TestResolvingAPlainValueLeavesItAlone(t *testing.T) {
	v := NewValues(managedAt("https://unused.invalid"))

	for _, plain := range []string{"a-literal-value", "", "https://app.test/callback"} {
		got, svcErr := v.Resolve(context.Background(), plain)
		if svcErr != nil {
			t.Fatalf("%q was treated as a reference: %v", plain, svcErr)
		}
		if got != plain {
			t.Fatalf("%q was rewritten to %q", plain, got)
		}
	}
}

// A reference the data plane no longer holds leaves the resource readable. Failing every read
// because one value was removed there would make the resource impossible to look at or repair.
func TestResolvingAValueTheDataPlaneLostKeepsTheReference(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer srv.Close()

	v := NewValues(managedAt(srv.URL))
	got, svcErr := v.Resolve(context.Background(), "var:APPLICATION_MY_APP_CLIENT_ID")

	if svcErr != nil {
		t.Fatalf("resolving failed: %v", svcErr)
	}
	if got != "var:APPLICATION_MY_APP_CLIENT_ID" {
		t.Fatalf("resolved to %q, want the reference unchanged", got)
	}
}

// Nothing is placed when no data plane is marked as the one this control plane administers.
func TestPlacingFailsWithNoManagedDataPlane(t *testing.T) {
	v := NewValues(&stubGateways{err: &gateway.ErrorNoManagedGateway})

	_, svcErr := v.Place(context.Background(), valueref.CollectionSecret,
		"application", "My App", "ClientSecret", "s")

	if svcErr == nil || svcErr.Code != gateway.ErrorNoManagedGateway.Code {
		t.Fatalf("reported %v, want %s", svcErr, gateway.ErrorNoManagedGateway.Code)
	}
}

func contains(haystack, needle string) bool {
	return len(haystack) >= len(needle) && (haystack == needle ||
		len(needle) == 0 || indexOf(haystack, needle) >= 0)
}

func indexOf(haystack, needle string) int {
	for i := 0; i+len(needle) <= len(haystack); i++ {
		if haystack[i:i+len(needle)] == needle {
			return i
		}
	}
	return -1
}
