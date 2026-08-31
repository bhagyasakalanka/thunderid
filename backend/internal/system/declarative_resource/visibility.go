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
	"strings"

	"github.com/thunder-id/thunderid/internal/system/config"
	"github.com/thunder-id/thunderid/internal/system/deployment"
)

// defaultSystemDeploymentID is the reserved deployment the platform itself is served under, used when
// the configuration names none.
const defaultSystemDeploymentID = "root"

// VisibleTo reports whether declarative resources may be read in this request's deployment.
//
// A declarative resource is loaded from a file and carries no deployment of its own, so on a server
// where every request names a tenant there is nothing to scope it by. Left ungated it would be
// visible to every tenant at once, which is why it is confined to the deployment the platform itself
// is served under: the platform's own configuration, readable by nobody else.
//
// On a server holding one deployment's data there is only one deployment to belong to, so everything
// stays visible and nothing changes.
func VisibleTo(ctx context.Context) bool {
	// A server holding one deployment's data has only one deployment to belong to, so everything is
	// visible exactly as it was.
	if _, readsFromToken := deployment.TokenClaim(); !readsFromToken {
		return true
	}
	// Without a loaded configuration there is nothing to scope by: this is a unit test or a load step
	// running before the server exists.
	if !config.IsServerRuntimeInitialized() {
		return true
	}

	system := strings.TrimSpace(config.GetServerRuntime().Config.Server.SystemDeploymentID)
	if system == "" {
		system = defaultSystemDeploymentID
	}
	// A context naming no deployment is the server acting for itself rather than for a tenant: the
	// files being loaded and validated at startup, before any request exists. Those must see every
	// declarative resource, including the ones they reference each other by. A request always names
	// a deployment, because a token without one is refused before it reaches a store.
	id, named := deployment.IDFromContext(ctx)
	if !named {
		return true
	}
	return id == system
}
