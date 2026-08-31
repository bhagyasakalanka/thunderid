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

package declarativeresource

import (
	"context"
	"testing"

	"github.com/thunder-id/thunderid/internal/system/config"
	"github.com/thunder-id/thunderid/internal/system/deployment"
	engineconfig "github.com/thunder-id/thunderid/pkg/thunderidengine/config"
)

// withServer installs a server configuration for the duration of a test.
func withServer(t *testing.T, systemID string) {
	t.Helper()
	cfg := &config.Config{}
	cfg.Server = engineconfig.ServerConfig{SystemDeploymentID: systemID}
	if err := config.InitializeServerRuntime(t.TempDir(), cfg); err != nil {
		t.Fatalf("initialize server runtime: %v", err)
	}
	t.Cleanup(config.ResetServerRuntime)
}

// readsFromTheToken makes this process take each request's deployment from a token claim, the way a
// control plane binary does at start-up.
func readsFromTheToken(t *testing.T) {
	t.Helper()
	if err := deployment.UseTokenClaim("deploymentId"); err != nil {
		t.Fatalf("use token claim: %v", err)
	}
	t.Cleanup(deployment.UseServerIdentifier)
}

// A server holding one deployment's data has one deployment to belong to, so declarative resources
// stay visible and nothing about it changes.
func TestVisibleTo_OneDeploymentSeesEverything(t *testing.T) {
	withServer(t, "root")
	if !VisibleTo(context.Background()) {
		t.Fatal("expected declarative resources to be visible when the server holds one deployment")
	}
	if !VisibleTo(deployment.WithID(context.Background(), "acme:dev")) {
		t.Fatal("expected them visible whatever deployment is named, when the id comes from the server")
	}
}

// Where each request names its own deployment, a declarative resource carries none of its own, so it
// belongs to the platform's own deployment alone. No tenant may see it.
func TestVisibleTo_ConfinesThemToThePlatformDeployment(t *testing.T) {
	withServer(t, "root")
	readsFromTheToken(t)

	if !VisibleTo(deployment.WithID(context.Background(), "root")) {
		t.Fatal("expected the platform's own deployment to see its declarative resources")
	}
	if VisibleTo(deployment.WithID(context.Background(), "acme:dev")) {
		t.Fatal("expected a tenant not to see the platform's declarative resources")
	}
	// Loading names no deployment: it happens before any request, and the files reference each
	// other, so it must see them all.
	if !VisibleTo(context.Background()) {
		t.Fatal("expected loading, which names no deployment, to see every declarative resource")
	}
}
