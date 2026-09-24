// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package dataplane

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/thunder-id/thunderid/internal/system/constants"
)

// Every call presents the management token, which is what the data plane accepts on these routes.
func TestEveryCallPresentsTheManagementToken(t *testing.T) {
	var seen []string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = append(seen, r.Header.Get(constants.APIKeyHeaderName))
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"value":"held"}`))
	}))
	defer srv.Close()

	c, err := New(srv.URL, "the-management-token", "")
	if err != nil {
		t.Fatalf("building the client failed: %v", err)
	}

	if err := c.Put(context.Background(), CollectionSecret, "A_SECRET", "v", ""); err != nil {
		t.Fatalf("put failed: %v", err)
	}
	if _, err := c.GetVariable(context.Background(), "A_VARIABLE"); err != nil {
		t.Fatalf("get failed: %v", err)
	}

	if len(seen) != 2 {
		t.Fatalf("expected two calls, got %d", len(seen))
	}
	for i, token := range seen {
		if token != "the-management-token" {
			t.Fatalf("call %d presented %q", i, token)
		}
	}
}

// A secret and a variable of the same name are different values, so each goes to its own collection.
func TestEachCollectionHasItsOwnPath(t *testing.T) {
	var paths []string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		paths = append(paths, r.Method+" "+r.URL.Path)
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	c, _ := New(srv.URL, "t", "")
	_ = c.Put(context.Background(), CollectionSecret, "SHARED", "s", "")
	_ = c.Put(context.Background(), CollectionVariable, "SHARED", "v", "")

	want := []string{"PUT /secrets/SHARED", "PUT /variables/SHARED"}
	for i, w := range want {
		if i >= len(paths) || paths[i] != w {
			t.Fatalf("expected %v, got %v", want, paths)
		}
	}
}

// The body a write sends is what the data plane's update request expects.
func TestAWriteSendsTheValueAndDescription(t *testing.T) {
	var body map[string]string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		raw, _ := io.ReadAll(r.Body)
		_ = json.Unmarshal(raw, &body)
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	c, _ := New(srv.URL, "t", "")
	if err := c.Put(context.Background(), CollectionVariable, "DB_HOST", "db.internal", "the database"); err != nil {
		t.Fatalf("put failed: %v", err)
	}

	if body["value"] != "db.internal" || body["description"] != "the database" {
		t.Fatalf("unexpected body: %v", body)
	}
}

// A refused token is a configuration fault, not a transient one, and is reported as its own error so
// a caller does not retry a token that cannot work.
func TestARefusedTokenIsReportedAsSuch(t *testing.T) {
	for _, status := range []int{http.StatusUnauthorized, http.StatusForbidden} {
		srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(status)
		}))

		c, _ := New(srv.URL, "wrong", "")
		err := c.Put(context.Background(), CollectionSecret, "A", "v", "")
		srv.Close()

		if !errors.Is(err, ErrUnauthorized) {
			t.Fatalf("status %d gave %v, want ErrUnauthorized", status, err)
		}
	}
}

// A name the data plane does not hold is reported as not found, so a caller can tell it apart from a
// failure to reach the data plane at all.
func TestAnAbsentNameIsNotFound(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer srv.Close()

	c, _ := New(srv.URL, "t", "")
	if _, err := c.GetVariable(context.Background(), "ABSENT"); !errors.Is(err, ErrNotFound) {
		t.Fatalf("got %v, want ErrNotFound", err)
	}
}

// Removing something already gone is the state the caller wanted, so it is not an error.
func TestDeletingSomethingAbsentSucceeds(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer srv.Close()

	c, _ := New(srv.URL, "t", "")
	if err := c.Delete(context.Background(), CollectionSecret, "ABSENT"); err != nil {
		t.Fatalf("deleting an absent value failed: %v", err)
	}
}

// A data plane that cannot be reached is an error, which is what fails the create that called it.
func TestAnUnreachableDataPlaneIsAnError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {}))
	addr := srv.URL
	srv.Close()

	c, _ := New(addr, "t", "")
	if err := c.Put(context.Background(), CollectionSecret, "A", "v", ""); err == nil {
		t.Fatal("expected an unreachable data plane to fail")
	}
}

// A name is escaped as one path segment, so one carrying a slash cannot address another route.
func TestANameCannotEscapeItsPathSegment(t *testing.T) {
	var paths []string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		paths = append(paths, r.URL.EscapedPath())
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	c, _ := New(srv.URL, "t", "")
	if err := c.Put(context.Background(), CollectionSecret, "a/../../import", "v", ""); err != nil {
		t.Fatalf("put failed: %v", err)
	}

	if len(paths) != 1 || paths[0] != "/secrets/a%2F..%2F..%2Fimport" {
		t.Fatalf("the name was not confined to one segment: %v", paths)
	}
}

// An address that names no host is refused when the client is built, not on the first call.
func TestAnUnusableAddressIsRefused(t *testing.T) {
	for _, address := range []string{"", "   ", "not-a-url"} {
		if _, err := New(address, "t", ""); err == nil {
			t.Fatalf("%q was accepted as a data plane address", address)
		}
	}
}

// A certificate that cannot be read is refused rather than silently falling back to the system roots,
// which would leave a deployment trusting less than it configured.
func TestAnUnreadableCertificateAuthorityIsRefused(t *testing.T) {
	if _, err := New("https://dp.test", "t", "not a certificate"); err == nil {
		t.Fatal("an unreadable certificate authority was accepted")
	}
}
