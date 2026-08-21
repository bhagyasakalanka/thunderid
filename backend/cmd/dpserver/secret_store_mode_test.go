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

package main

import (
	"testing"

	"github.com/thunder-id/thunderid/internal/secretstore"
	"github.com/thunder-id/thunderid/internal/system/config"
	engineconfig "github.com/thunder-id/thunderid/pkg/thunderidengine/config"
)

// A Data Plane holds the credentials the configuration applied to it refers to, so it keeps a store
// whether or not one was configured. Defaulting is done here rather than in the store package because
// it is a per-plane decision: a hybrid server keeps no store unless it asks for one.
func TestAnUnsetModeDefaultsToTheDatabaseOnTheDataPlane(t *testing.T) {
	withRuntime(t)
	got := secretStoreConfig(engineconfig.SecretProviderConfig{}, nil, "acme:dev")

	if got.Mode != secretstore.ModeDB {
		t.Fatalf("expected an unset mode to default to the database, got %q", got.Mode)
	}
}

// A configured mode is never overridden, so a deployment that asked for a key vault or a file gets it.
func TestAConfiguredModeIsKept(t *testing.T) {
	withRuntime(t)
	for _, mode := range []string{"file", "kv", "service"} {
		got := secretStoreConfig(engineconfig.SecretProviderConfig{Mode: mode}, nil, "acme:dev")
		if string(got.Mode) != mode {
			t.Fatalf("expected %q to be kept, got %q", mode, got.Mode)
		}
	}
}

// withRuntime loads a minimal server runtime, which building the store configuration reads to reach
// the database provider.
func withRuntime(t *testing.T) {
	t.Helper()
	config.ResetServerRuntime()
	if err := config.InitializeServerRuntime("/tmp/test", &config.Config{
		Server: engineconfig.ServerConfig{Mode: "dp"},
	}); err != nil {
		t.Fatalf("initialize runtime: %v", err)
	}
	t.Cleanup(config.ResetServerRuntime)
}
