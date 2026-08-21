package importer

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/thunder-id/thunderid/internal/system/secretresolver"
)

// The whole chain: a control plane hashes a credential into the provider, the data plane loads it,
// the import stores a reference, and nothing anywhere holds the secret.
// clientSecretDocument is one application whose client secret is a placeholder, which is what each of
// these imports is asked to resolve.
const clientSecretDocument = "resource_type: application\nid: a\nclientSecret: {{.MY_APP_CLIENT_SECRET}}\n"

func TestEndToEnd_SecretStaysInTheProvider(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"secrets": map[string]interface{}{
			"MY_APP_CLIENT_SECRET": map[string]interface{}{
				"kind": "hash", "value": "the-hash", "algorithm": "PBKDF2",
				"parameters": map[string]interface{}{"salt": "s", "iterations": 1000, "keySize": 32},
			},
		}})
	}))
	defer srv.Close()

	prev := secretresolver.Default()
	r := secretresolver.New(secretresolver.Config{BaseURL: srv.URL})
	if err := r.LoadAll(context.Background()); err != nil {
		t.Fatalf("load: %v", err)
	}
	secretresolver.SetDefault(r)
	defer secretresolver.SetDefault(prev)

	content := clientSecretDocument
	filled := fillSecretPlaceholders(context.Background(), content, nil)

	if filled["MY_APP_CLIENT_SECRET"] != "kv:MY_APP_CLIENT_SECRET" {
		t.Fatalf("the import should store a reference, got %#v", filled["MY_APP_CLIENT_SECRET"])
	}
	if filled["MY_APP_CLIENT_SECRET"] == "the-hash" {
		t.Fatal("the hash must not be written into the configuration")
	}
}

// A credential the store holds readably is written into the configuration as itself, so the resource
// is created through the ordinary API with a real value. That is what lets a credential captured on
// the Control Plane work here: it arrives as a value, and the API hashes it if that is what the
// resource needs, exactly as for one created by hand.
func TestEndToEnd_AReadableSecretIsFilledInAsItself(t *testing.T) {
	const value = "the-client-secret"
	// The provider serves the whole set at /secrets and one entry at /secrets/{name}. Both are needed:
	// the resolver loads the set at startup and asks for a single name it has not seen.
	entry := map[string]interface{}{"kind": "value", "value": value}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/secrets" {
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"secrets": map[string]interface{}{"MY_APP_CLIENT_SECRET": entry},
			})
			return
		}
		_ = json.NewEncoder(w).Encode(entry)
	}))
	defer srv.Close()

	prev := secretresolver.Default()
	r := secretresolver.New(secretresolver.Config{BaseURL: srv.URL})
	if err := r.LoadAll(context.Background()); err != nil {
		t.Fatalf("load: %v", err)
	}
	secretresolver.SetDefault(r)
	defer secretresolver.SetDefault(prev)

	content := clientSecretDocument
	filled := fillSecretPlaceholders(context.Background(), content, nil)

	if filled["MY_APP_CLIENT_SECRET"] != value {
		t.Fatalf("expected the credential itself, got %#v", filled["MY_APP_CLIENT_SECRET"])
	}
}

// A value the caller sent is never replaced by one held here, so an explicit request always wins.
func TestEndToEnd_AnExplicitValueIsNotOverridden(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"secrets": map[string]interface{}{
			"MY_APP_CLIENT_SECRET": map[string]interface{}{"kind": "value", "value": "from-the-store"},
		}})
	}))
	defer srv.Close()

	prev := secretresolver.Default()
	r := secretresolver.New(secretresolver.Config{BaseURL: srv.URL})
	if err := r.LoadAll(context.Background()); err != nil {
		t.Fatalf("load: %v", err)
	}
	secretresolver.SetDefault(r)
	defer secretresolver.SetDefault(prev)

	content := clientSecretDocument
	filled := fillSecretPlaceholders(context.Background(), content,
		map[string]interface{}{"MY_APP_CLIENT_SECRET": "from-the-caller"})

	if filled["MY_APP_CLIENT_SECRET"] != "from-the-caller" {
		t.Fatalf("the caller's value must win, got %#v", filled["MY_APP_CLIENT_SECRET"])
	}
}
