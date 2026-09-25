// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package gateway

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/thunder-id/thunderid/internal/system/constants"
	"github.com/thunder-id/thunderid/internal/system/valueref"
)

// Values the gateway tests present and expect back.
const (
	testGatewayKey    = "the-key"
	testGatewaySecret = "the-secret"
)

// recordingGateway stands in for a gateway's value store and records what it was asked.
type recordingGateway struct {
	method string
	path   string
	key    string
	body   map[string]string

	status int
	reply  string
}

func (r *recordingGateway) handler() http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		// EscapedPath, not Path: routing matches on the escaped form, so that is what decides
		// which collection a name reaches. Path has already decoded any escaping away.
		r.method, r.path = req.Method, req.URL.EscapedPath()
		r.key = req.Header.Get(constants.APIKeyHeaderName)
		if raw, _ := io.ReadAll(req.Body); len(raw) > 0 {
			_ = json.Unmarshal(raw, &r.body)
		}
		if r.status == 0 {
			r.status = http.StatusOK
		}
		w.WriteHeader(r.status)
		_, _ = io.WriteString(w, r.reply)
	}
}

func newTestClient(t *testing.T, gw *recordingGateway) *Client {
	t.Helper()
	server := httptest.NewServer(gw.handler())
	t.Cleanup(server.Close)

	client, err := NewClient(server.URL, testGatewayKey, "")
	if err != nil {
		t.Fatalf("failed to build the client: %v", err)
	}
	return client
}

// A written value reaches the collection it belongs to, carrying the registered key.
func TestPutWritesToTheNamedCollection(t *testing.T) {
	for _, tc := range []struct {
		collection valueref.Collection
		wantPath   string
	}{
		{valueref.CollectionSecret, "/secrets/APP_NAME_SECRET"},
		{valueref.CollectionVariable, "/variables/APP_NAME_SECRET"},
	} {
		t.Run(string(tc.collection), func(t *testing.T) {
			gw := &recordingGateway{}
			client := newTestClient(t, gw)

			if err := client.Put(context.Background(), tc.collection,
				"APP_NAME_SECRET", "the-value", "a description"); err != nil {
				t.Fatalf("Put failed: %v", err)
			}

			if gw.method != http.MethodPut {
				t.Errorf("expected PUT, got %s", gw.method)
			}
			if gw.path != tc.wantPath {
				t.Errorf("expected path %s, got %s", tc.wantPath, gw.path)
			}
			if gw.key != testGatewayKey {
				t.Errorf("the registered key was not presented, got %q", gw.key)
			}
			if gw.body["value"] != "the-value" || gw.body["description"] != "a description" {
				t.Errorf("unexpected body: %v", gw.body)
			}
		})
	}
}

// A variable is read back as it stands.
func TestGetVariableReturnsTheValue(t *testing.T) {
	gw := &recordingGateway{reply: `{"value":"the-value"}`}
	client := newTestClient(t, gw)

	value, err := client.GetVariable(context.Background(), "APP_NAME_URL")
	if err != nil {
		t.Fatalf("GetVariable failed: %v", err)
	}
	if value != "the-value" {
		t.Errorf("expected the-value, got %q", value)
	}
	if gw.path != "/variables/APP_NAME_URL" {
		t.Errorf("expected the variables collection, got %s", gw.path)
	}
}

// The two answers a caller acts on differently: a name that is not held, and a key that is refused.
func TestResponsesAreMappedToErrorsACallerCanActOn(t *testing.T) {
	for _, tc := range []struct {
		name   string
		status int
		want   error
	}{
		{"not found", http.StatusNotFound, ErrNotFound},
		{"unauthorized", http.StatusUnauthorized, ErrUnauthorized},
		{"forbidden", http.StatusForbidden, ErrUnauthorized},
	} {
		t.Run(tc.name, func(t *testing.T) {
			client := newTestClient(t, &recordingGateway{status: tc.status})

			_, err := client.GetVariable(context.Background(), "APP_NAME_URL")
			if !errors.Is(err, tc.want) {
				t.Errorf("expected %v, got %v", tc.want, err)
			}
		})
	}
}

// Any other refusal is an error, but not one of the two a caller treats specially.
func TestAnUnexpectedStatusIsAnError(t *testing.T) {
	client := newTestClient(t, &recordingGateway{status: http.StatusInternalServerError})

	_, err := client.GetVariable(context.Background(), "APP_NAME_URL")
	if err == nil {
		t.Fatal("expected an error")
	}
	if errors.Is(err, ErrNotFound) || errors.Is(err, ErrUnauthorized) {
		t.Errorf("a 500 was mapped to a specific error: %v", err)
	}
}

// Removing a value the gateway does not hold is not a failure: it is already in the state asked for.
func TestDeleteTreatsAMissingValueAsDone(t *testing.T) {
	client := newTestClient(t, &recordingGateway{status: http.StatusNotFound})

	if err := client.Delete(context.Background(), valueref.CollectionSecret, "APP_NAME_SECRET"); err != nil {
		t.Errorf("expected a missing value to be no error, got %v", err)
	}
}

// A name is derived from a resource's own fields, so it is not necessarily well formed. It must
// address the value it names and nothing else.
func TestANameCannotEscapeItsCollection(t *testing.T) {
	gw := &recordingGateway{reply: `{"value":""}`}
	client := newTestClient(t, gw)

	if _, err := client.GetVariable(context.Background(), "../secrets/STOLEN"); err != nil {
		t.Fatalf("GetVariable failed: %v", err)
	}

	if strings.Contains(gw.path, "/secrets/") {
		t.Errorf("a name reached out of its collection: %s", gw.path)
	}
	// Three segments and no more: the name stayed one segment instead of becoming a path.
	if got := strings.Count(gw.path, "/"); got != 2 {
		t.Errorf("the name did not stay one segment: %s", gw.path)
	}
	if !strings.HasPrefix(gw.path, "/variables/") {
		t.Errorf("expected the variables collection, got %s", gw.path)
	}
}

// A registration that cannot be turned into an address is refused at the point it is read, rather
// than on every call made with it.
func TestAnUnusableAddressIsRefused(t *testing.T) {
	for _, tc := range []struct{ name, baseURL string }{
		{"empty", ""},
		{"blank", "   "},
		{"no host", "https://"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := NewClient(tc.baseURL, testGatewayKey, ""); err == nil {
				t.Errorf("expected %q to be refused", tc.baseURL)
			}
		})
	}
}

// A certificate authority that cannot be read is a configuration fault, not a silent fallback to
// the system roots: a gateway whose certificate nothing signs would otherwise fail on every call.
func TestAnUnreadableCertificateAuthorityIsRefused(t *testing.T) {
	if _, err := NewClient("https://gw.example.com", testGatewayKey, "not a certificate"); err == nil {
		t.Error("expected an unreadable certificate authority to be refused")
	}
}

// A trailing slash on the registered address must not double up against the path.
func TestATrailingSlashIsTrimmed(t *testing.T) {
	gw := &recordingGateway{reply: `{"value":""}`}
	server := httptest.NewServer(gw.handler())
	t.Cleanup(server.Close)

	client, err := NewClient(server.URL+"/", testGatewayKey, "")
	if err != nil {
		t.Fatalf("failed to build the client: %v", err)
	}
	if _, err := client.GetVariable(context.Background(), "APP_NAME_URL"); err != nil {
		t.Fatalf("GetVariable failed: %v", err)
	}
	if gw.path != "/variables/APP_NAME_URL" {
		t.Errorf("expected /variables/APP_NAME_URL, got %s", gw.path)
	}
}

// An empty name addresses the collection itself, so it is refused before a request is made.
func TestAnEmptyNameIsRefused(t *testing.T) {
	client := newTestClient(t, &recordingGateway{})

	if _, err := client.GetVariable(context.Background(), "  "); err == nil {
		t.Error("expected an empty name to be refused")
	}
}
