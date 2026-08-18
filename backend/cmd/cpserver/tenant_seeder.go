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
	"errors"
	"fmt"
	"strings"

	"github.com/thunder-id/thunderid/internal/environmentvariable"
	"github.com/thunder-id/thunderid/internal/envmgr"
	"github.com/thunder-id/thunderid/internal/envmgr/bundle"
	"github.com/thunder-id/thunderid/internal/envmgr/model"
	envmgrservice "github.com/thunder-id/thunderid/internal/envmgr/service"
	"github.com/thunder-id/thunderid/internal/system/deployment"
	"github.com/thunder-id/thunderid/internal/system/export"
	"github.com/thunder-id/thunderid/internal/system/importer"
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
	registry  envmgrRegistry
	exportSvc export.ExportServiceInterface
	importSvc importer.ImportServiceInterface
	// controlPlaneURL is where a registered environment reads its configuration from: this server.
	controlPlaneURL string
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

// SeedTenant copies the source tenant's configuration into the target and reports what landed.
func (s *environmentSeeder) SeedTenant(ctx context.Context, sourceDeploymentID,
	targetDeploymentID string) (*tenant.SeedSummary, error) {
	resp, err := s.registry.SeedTenant(ctx, sourceDeploymentID, targetDeploymentID)
	if err != nil {
		if !errors.Is(err, envmgr.ErrNoSeedSource) && !errors.Is(err, envmgrservice.ErrNoVersions) {
			return nil, err
		}
		return s.seedFromExport(ctx, sourceDeploymentID, targetDeploymentID)
	}

	summary := &tenant.SeedSummary{From: sourceDeploymentID}
	if resp != nil {
		summary.TotalDocuments = resp.Summary.TotalDocuments
		summary.Imported = resp.Summary.Imported
		summary.Failed = resp.Summary.Failed
	}
	return summary, nil
}

// RegisterEnvironment records the new tenant as an environment of its organization.
//
// The source is this control plane and the tenant just created; the target is the data plane the
// caller named. Both are known here, which is why registration happens as part of creating the
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
		Source: &model.Source{
			BaseURL:            s.controlPlaneURL,
			DeploymentID:       in.DeploymentID,
			InsecureSkipVerify: in.ControlPlaneInsecureSkipVerify,
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

// seedFromExport reads the source tenant directly and writes it into the target. Both steps run in
// process against the tenant each is scoped to, the same way a promotion reaches another tenant.
func (s *environmentSeeder) seedFromExport(ctx context.Context, sourceDeploymentID,
	targetDeploymentID string) (*tenant.SeedSummary, error) {
	if s.exportSvc == nil || s.importSvc == nil {
		return nil, fmt.Errorf("this server cannot read tenant %s to copy it", sourceDeploymentID)
	}

	exported, svcErr := s.exportSvc.ExportResources(deployment.WithID(ctx, sourceDeploymentID),
		everythingExportRequest())
	if svcErr != nil {
		return nil, fmt.Errorf("reading tenant %s failed: %s", sourceDeploymentID, svcErr.Error.DefaultValue)
	}

	resources := joinExportedFiles(exported)
	if strings.TrimSpace(resources) == "" {
		return nil, fmt.Errorf("tenant %s holds no configuration to copy", sourceDeploymentID)
	}
	values := map[string]string{}
	if exported.EnvFile != nil {
		values = bundle.ParseEnv(exported.EnvFile.Content)
	}

	// Credentials are handled exactly as a promotion handles them: none is written to a control plane.
	req := envmgrservice.ControlPlaneRequest(resources, values, bundle.SecretVariables(resources))
	result, svcErr := s.importSvc.ImportResources(deployment.WithID(ctx, targetDeploymentID),
		&importer.ImportRequest{Content: req.Content, Variables: req.Variables})
	if svcErr != nil {
		return nil, fmt.Errorf("writing tenant %s failed: %s", targetDeploymentID, svcErr.ErrorDescription)
	}

	summary := &tenant.SeedSummary{From: sourceDeploymentID}
	if result != nil && result.Summary != nil {
		summary.TotalDocuments = result.Summary.TotalDocuments
		summary.Imported = result.Summary.Imported
		summary.Failed = result.Summary.Failed
	}
	return summary, nil
}

// everythingExportRequest asks for the whole tenant, which is what a copy of it means.
func everythingExportRequest() *export.ExportRequest {
	all := []string{"*"}
	return &export.ExportRequest{
		Applications: all, Connections: all, UserTypes: all, OrganizationUnits: all,
		Users: all, Groups: all, ResourceServers: all, Roles: all, Flows: all,
		Translations: all, Layouts: all, Themes: all, ServerConfigs: all,
		Options: &export.ExportOptions{IncludeDependencies: true, Format: "yaml"},
	}
}

// joinExportedFiles concatenates the exported documents into the multi-document bundle the import
// reads, in the order the export produced them so a resource still precedes what refers to it.
func joinExportedFiles(response *export.ExportResponse) string {
	if response == nil {
		return ""
	}
	docs := make([]string, 0, len(response.Files))
	for _, file := range response.Files {
		if content := strings.TrimSpace(file.Content); content != "" {
			docs = append(docs, content)
		}
	}
	return strings.Join(docs, "\n---\n")
}
