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
	"context"
	"fmt"
	"strings"

	"github.com/thunder-id/thunderid/internal/environmentvariable"
	"github.com/thunder-id/thunderid/internal/envmgr/model"
	envmgrservice "github.com/thunder-id/thunderid/internal/envmgr/service"
	"github.com/thunder-id/thunderid/internal/system/deployment"
	"github.com/thunder-id/thunderid/internal/tenant"
)

// environmentSeeder gives a newly created environment of an organization the configuration its first
// environment holds.
//
// The environment manager's latest version is preferred: it is the state that was captured and
// promoted, so a new environment starts from something deliberate rather than from whatever happens
// to be half-finished. A tenant created moments ago has no environment registered and nothing
// captured, so the source is then read directly instead. Requiring a capture first would mean an
// organization's environments could not be created one after another.
type environmentSeeder struct {
	registry envmgrRegistry
	// envVarService holds the per-deployment values an apply resolves its placeholders from.
	envVarService environmentvariable.EnvironmentVariableServiceInterface
}

// consoleVariables are the placeholders the exported Console application fills, named the way the
// exporter derives them from the resource type, name and field.
const (
	consoleURLVariable          = "APPLICATION_CONSOLE_URL"
	consoleRedirectURIsVariable = "APPLICATION_CONSOLE_REDIRECT_URIS"
)

// setConsoleURLsForDataPlane points the new tenant's Console application at its own data plane.
//
// The Console is the one application a control plane creates for itself, so its URL and redirect URI
// are the control plane's. Applied unchanged they would send a data plane's users to the control
// plane to sign in. The data plane serves its own console, so the environment records that address
// and an apply resolves the placeholders to it instead.
//
// Only the Console is treated this way. Every other resource is configuration an operator wrote, and
// where its URLs should point is their decision, not this server's.
func (s *environmentSeeder) setConsoleURLsForDataPlane(ctx context.Context, deploymentID,
	dataPlaneURL string) error {
	if s.envVarService == nil {
		return nil
	}
	console := strings.TrimSuffix(strings.TrimSpace(dataPlaneURL), "/") + "/console"
	scoped := deployment.WithID(ctx, deploymentID)

	for key, value := range map[string]string{
		consoleURLVariable: console,
		// An array placeholder is read as a JSON array when it is not supplied as indexed values.
		consoleRedirectURIsVariable: fmt.Sprintf("[%q]", console),
	} {
		_, svcErr := s.envVarService.CreateEnvironmentVariable(scoped,
			environmentvariable.CreateEnvironmentVariableRequest{
				Key:         key,
				Value:       value,
				Description: "Set when the environment was created, so its Console signs in against its own data plane",
			})
		if svcErr != nil {
			return fmt.Errorf("setting %s failed: %s", key, svcErr.ErrorDescription.DefaultValue)
		}
	}
	return nil
}

// tenant rather than being left as a second call an operator has to remember.
func (s *environmentSeeder) RegisterEnvironment(ctx context.Context,
	in tenant.RegisterEnvironmentInput) (*tenant.EnvironmentSummary, error) {
	var rank *int
	if in.Rank > 0 {
		rank = &in.Rank
	}

	env, err := s.registry.CreateEnvironment(ctx, in.DeploymentID, envmgrservice.CreateEnvironmentInput{
		Name: in.Name,
		Rank: rank,
		Target: model.Target{
			DataPlaneID: in.DataPlane.ID,
			BaseURL:     in.DataPlane.BaseURL,
		},
	})
	if err != nil {
		return nil, err
	}
	if err := s.setConsoleURLsForDataPlane(ctx, in.DeploymentID, in.DataPlane.BaseURL); err != nil {
		return nil, err
	}
	return &tenant.EnvironmentSummary{
		ID: env.ID, Name: env.Name, Rank: env.Rank, DataPlaneToken: env.DataPlaneToken,
	}, nil
}
