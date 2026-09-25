// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package gateway

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/thunder-id/thunderid/internal/system/valueref"
	tidcommon "github.com/thunder-id/thunderid/pkg/thunderidengine/common"
)

// managedStub answers with one registration, and records how often it was asked for it.
type managedStub struct {
	ServiceInterface
	gateway *Gateway
	svcErr  *tidcommon.ServiceError
	calls   int
}

func (m *managedStub) Managed(_ context.Context) (*Gateway, *tidcommon.ServiceError) {
	m.calls++
	if m.svcErr != nil {
		return nil, m.svcErr
	}
	return m.gateway, nil
}

// newValuesAgainst builds a placer pointed at a gateway that answers with the given handler.
func newValuesAgainst(t *testing.T, handler http.HandlerFunc) (ValuesInterface, *managedStub) {
	t.Helper()
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)

	stub := &managedStub{gateway: &Gateway{BaseURL: server.URL, Key: testGatewayKey}}
	return NewValues(stub), stub
}

// A placed value is written to the gateway, and what the control plane stores is the reference to
// it rather than the value.
func TestPlaceStoresAReferenceNotTheValue(t *testing.T) {
	for _, tc := range []struct {
		name       string
		collection valueref.Collection
		wantPath   string
		wantRef    string
	}{
		{"secret", valueref.CollectionSecret,
			"/secrets/CONNECTION_GITHUB_CLIENT_SECRET", "sec:CONNECTION_GITHUB_CLIENT_SECRET"},
		{"variable", valueref.CollectionVariable,
			"/variables/CONNECTION_GITHUB_CLIENT_SECRET", "var:CONNECTION_GITHUB_CLIENT_SECRET"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var gotPath string
			values, _ := newValuesAgainst(t, func(w http.ResponseWriter, r *http.Request) {
				gotPath = r.URL.EscapedPath()
				w.WriteHeader(http.StatusOK)
			})

			ref, svcErr := values.Place(context.Background(), tc.collection,
				"connection", "github", "clientSecret", testGatewaySecret)
			if svcErr != nil {
				t.Fatalf("Place failed: %v", svcErr)
			}

			if ref != tc.wantRef {
				t.Errorf("expected %q, got %q", tc.wantRef, ref)
			}
			if gotPath != tc.wantPath {
				t.Errorf("expected %s, got %s", tc.wantPath, gotPath)
			}
			if ref == testGatewaySecret {
				t.Error("the value itself was returned to be stored")
			}
		})
	}
}

// Nothing is stored when the gateway cannot be reached. A resource referring to a value that was
// never placed would fail when it was used rather than when it was created.
func TestPlaceFailsWhenTheGatewayRefuses(t *testing.T) {
	for _, tc := range []struct {
		name   string
		status int
		want   string
	}{
		{"key refused", http.StatusUnauthorized, ErrorGatewayRefusedTheKey.Code},
		{"gateway down", http.StatusInternalServerError, ErrorGatewayUnreachable.Code},
	} {
		t.Run(tc.name, func(t *testing.T) {
			values, _ := newValuesAgainst(t, func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(tc.status)
			})

			ref, svcErr := values.Place(context.Background(), valueref.CollectionSecret,
				"connection", "github", "clientSecret", testGatewaySecret)
			if svcErr == nil {
				t.Fatal("expected an error")
			}
			if svcErr.Code != tc.want {
				t.Errorf("expected %s, got %s", tc.want, svcErr.Code)
			}
			if ref != "" {
				t.Errorf("expected nothing to store, got %q", ref)
			}
		})
	}
}

// With no gateway marked as the one this control plane administers, there is nowhere to place a
// value, and the refusal comes from the gateway service rather than from a failed call.
func TestPlaceFailsWithNoManagedGateway(t *testing.T) {
	stub := &managedStub{svcErr: &ErrorNoManagedGateway}
	values := NewValues(stub)

	if _, svcErr := values.Place(context.Background(), valueref.CollectionSecret,
		"connection", "github", "clientSecret", testGatewaySecret); svcErr == nil ||
		svcErr.Code != ErrorNoManagedGateway.Code {
		t.Errorf("expected %s, got %v", ErrorNoManagedGateway.Code, svcErr)
	}
}

// A variable reference is resolved to what the gateway holds.
func TestResolveReturnsTheValueAReferenceNames(t *testing.T) {
	values, _ := newValuesAgainst(t, func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"value":"https://app.example.com"}`))
	})

	got, svcErr := values.Resolve(context.Background(), "var:APPLICATION_WEB_URL")
	if svcErr != nil {
		t.Fatalf("Resolve failed: %v", svcErr)
	}
	if got != "https://app.example.com" {
		t.Errorf("expected the value, got %q", got)
	}
}

// A secret is never read back, so resolving one is not a call: the reference is what a caller sees.
func TestResolveNeverAsksForASecret(t *testing.T) {
	called := false
	values, stub := newValuesAgainst(t, func(w http.ResponseWriter, _ *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	})

	got, svcErr := values.Resolve(context.Background(), "sec:CONNECTION_GITHUB_CLIENT_SECRET")
	if svcErr != nil {
		t.Fatalf("Resolve failed: %v", svcErr)
	}
	if got != "sec:CONNECTION_GITHUB_CLIENT_SECRET" {
		t.Errorf("expected the reference unchanged, got %q", got)
	}
	if called {
		t.Error("the gateway was asked for a secret's value")
	}
	if stub.calls != 0 {
		t.Error("a secret reference reached for the managed gateway")
	}
}

// A value that is not a reference is what a deployment holding its own configuration stored, and it
// is returned as it stands without reaching for a gateway at all.
func TestResolveLeavesAPlainValueAlone(t *testing.T) {
	values, stub := newValuesAgainst(t, func(w http.ResponseWriter, _ *http.Request) {
		t.Error("a plain value reached the gateway")
		w.WriteHeader(http.StatusOK)
	})

	got, svcErr := values.Resolve(context.Background(), "a plain value")
	if svcErr != nil {
		t.Fatalf("Resolve failed: %v", svcErr)
	}
	if got != "a plain value" {
		t.Errorf("expected the value unchanged, got %q", got)
	}
	if stub.calls != 0 {
		t.Error("a plain value reached for the managed gateway")
	}
}

// One value removed on the gateway must not make every read of that resource fail. The reference is
// what the control plane holds, so it is what a read returns.
func TestResolveKeepsTheReferenceWhenTheGatewayHasNoSuchValue(t *testing.T) {
	values, _ := newValuesAgainst(t, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	})

	got, svcErr := values.Resolve(context.Background(), "var:APPLICATION_WEB_URL")
	if svcErr != nil {
		t.Fatalf("expected a missing value to be readable, got %v", svcErr)
	}
	if got != "var:APPLICATION_WEB_URL" {
		t.Errorf("expected the reference unchanged, got %q", got)
	}
}

// A gateway that is reachable but refuses the key is a fault worth reporting, not one to swallow
// the way a missing value is.
func TestResolveReportsARefusedKey(t *testing.T) {
	values, _ := newValuesAgainst(t, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	})

	if _, svcErr := values.Resolve(context.Background(), "var:APPLICATION_WEB_URL"); svcErr == nil ||
		svcErr.Code != ErrorGatewayRefusedTheKey.Code {
		t.Errorf("expected %s, got %v", ErrorGatewayRefusedTheKey.Code, svcErr)
	}
}

// The client is built once and reused, rather than rebuilt for every value placed.
func TestTheClientIsReusedAcrossCalls(t *testing.T) {
	values, stub := newValuesAgainst(t, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	for i := 0; i < 3; i++ {
		if _, svcErr := values.Place(context.Background(), valueref.CollectionSecret,
			"connection", "github", "clientSecret", testGatewaySecret); svcErr != nil {
			t.Fatalf("Place failed: %v", svcErr)
		}
	}

	if stub.calls != 3 {
		t.Errorf("expected the registration to be read on every call, got %d", stub.calls)
	}
}

// A rotated key must take effect without a restart: the memoized client is rebuilt when the
// registration it was built from no longer matches.
func TestTheClientIsRebuiltWhenTheRegistrationChanges(t *testing.T) {
	var presented []string
	values, stub := newValuesAgainst(t, func(w http.ResponseWriter, r *http.Request) {
		presented = append(presented, r.Header.Get("API-Key"))
		w.WriteHeader(http.StatusOK)
	})

	place := func() {
		t.Helper()
		if _, svcErr := values.Place(context.Background(), valueref.CollectionSecret,
			"connection", "github", "clientSecret", testGatewaySecret); svcErr != nil {
			t.Fatalf("Place failed: %v", svcErr)
		}
	}

	place()
	stub.gateway = &Gateway{BaseURL: stub.gateway.BaseURL, Key: "the-rotated-key"}
	place()

	if len(presented) != 2 {
		t.Fatalf("expected two calls, got %d", len(presented))
	}
	if presented[0] != testGatewayKey || presented[1] != "the-rotated-key" {
		t.Errorf("the rotated key did not take effect: %v", presented)
	}
}

// A registration recording an address nothing can be built from is reported rather than retried.
func TestAnUnusableRegistrationIsReported(t *testing.T) {
	stub := &managedStub{gateway: &Gateway{BaseURL: "   ", Key: testGatewayKey}}
	values := NewValues(stub)

	if _, svcErr := values.Place(context.Background(), valueref.CollectionSecret,
		"connection", "github", "clientSecret", testGatewaySecret); svcErr == nil ||
		svcErr.Code != ErrorGatewayUnusable.Code {
		t.Errorf("expected %s, got %v", ErrorGatewayUnusable.Code, svcErr)
	}
}
