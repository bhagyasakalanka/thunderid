// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package dataplane

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/thunder-id/thunderid/internal/system/valueref"
)

const (
	// clientSecretReference is what an application's client secret is stored as once placed.
	clientSecretReference = "sec:APPLICATION_MY_APP_CLIENT_SECRET"
	// clientIDValue stands in for an ordinary value, which is read back as it is.
	clientIDValue = "the-id"
)

// A deployment that installs nothing keeps its values. This is what a data plane is, and it is why
// the same service code stores a value there and a reference on a control plane.
func TestByDefaultAValueIsKeptAsItIs(t *testing.T) {
	values := Default()

	stored, svcErr := values.Place(context.Background(), valueref.CollectionSecret,
		"application", "My App", "ClientSecret", "the-secret")

	if svcErr != nil {
		t.Fatalf("placing failed: %v", svcErr)
	}
	if stored != "the-secret" {
		t.Fatalf("stored %q, want the value itself", stored)
	}
}

// Installing a placer is what makes a create store a reference instead, and the value it stands for
// reaches the data plane as it is: whatever holds a credential hashes it, not the side sending it.
func TestInstallingAPlacerStoresAReferenceAndSendsThePlaintext(t *testing.T) {
	var body string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		buf := make([]byte, r.ContentLength)
		_, _ = r.Body.Read(buf)
		body = string(buf)
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	SetDefault(NewValues(managedAt(srv.URL)))
	defer SetDefault(nil)

	stored, svcErr := Default().Place(context.Background(), valueref.CollectionSecret,
		"application", "My App", "ClientSecret", "the-secret")

	if svcErr != nil {
		t.Fatalf("placing failed: %v", svcErr)
	}
	if stored != clientSecretReference {
		t.Fatalf("stored %q, want a reference", stored)
	}
	if !contains(body, "the-secret") {
		t.Fatalf("the data plane did not receive the value as it stands: %s", body)
	}
	if contains(stored, "the-secret") {
		t.Fatal("the value was stored alongside its reference")
	}
}

// Clearing the placer puts the process back to keeping its own values, so a test or a plane that
// installs nothing is never left calling somewhere.
func TestClearingThePlacerKeepsValuesAgain(t *testing.T) {
	SetDefault(NewValues(managedAt("https://unused.invalid")))
	SetDefault(nil)

	stored, svcErr := Default().Place(context.Background(), valueref.CollectionVariable,
		"application", "My App", "ClientId", clientIDValue)

	if svcErr != nil {
		t.Fatalf("placing failed: %v", svcErr)
	}
	if stored != clientIDValue {
		t.Fatalf("stored %q, want the value itself", stored)
	}
}
