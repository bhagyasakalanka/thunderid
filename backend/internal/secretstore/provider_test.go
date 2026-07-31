/*
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package secretstore

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

func TestChainPrefersEarlierProviders(t *testing.T) {
	high := NewStatic("high", map[string]string{"SHARED": "from-high"})
	low := NewStatic("low", map[string]string{"SHARED": "from-low", "ONLY_LOW": "low"})
	chain := NewChain(high, low)

	value, ok, err := chain.Get(context.Background(), "SHARED")
	if err != nil || !ok || value != "from-high" {
		t.Fatalf("expected the earlier provider to win, got %q ok=%v err=%v", value, ok, err)
	}

	all, err := chain.All(context.Background())
	if err != nil {
		t.Fatalf("all: %v", err)
	}
	if all["SHARED"] != "from-high" || all["ONLY_LOW"] != "low" {
		t.Fatalf("unexpected merge: %#v", all)
	}
}

func TestChainReportsMissWithoutError(t *testing.T) {
	chain := NewChain(NewStatic("only", map[string]string{"A": "1"}))
	if _, ok, err := chain.Get(context.Background(), "NOPE"); ok || err != nil {
		t.Fatalf("a miss must not be an error, got ok=%v err=%v", ok, err)
	}
}

func TestNewFromFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "secrets.json")
	if err := os.WriteFile(path, []byte(`{"MY_SECRET":"value"}`), 0o600); err != nil {
		t.Fatalf("write: %v", err)
	}
	p, err := NewFromFile(path)
	if err != nil {
		t.Fatalf("from file: %v", err)
	}
	if value, ok, _ := p.Get(context.Background(), "MY_SECRET"); !ok || value != "value" {
		t.Fatalf("unexpected value %q", value)
	}

	if _, err := NewFromFile(filepath.Join(t.TempDir(), "absent.json")); err == nil {
		t.Fatal("expected an error for a missing file")
	}
}

func TestEnvSecretsStripsThePrefix(t *testing.T) {
	t.Setenv("TEST_SECRET_MY_APP_CLIENT_SECRET", "shhh")
	t.Setenv("TEST_SECRET_", "ignored-bare-prefix")

	secrets := EnvSecrets("TEST_SECRET_")
	if secrets["MY_APP_CLIENT_SECRET"] != "shhh" {
		t.Fatalf("unexpected value %q", secrets["MY_APP_CLIENT_SECRET"])
	}
	if _, present := secrets[""]; present {
		t.Fatal("a bare prefix must not produce an empty key")
	}
}
