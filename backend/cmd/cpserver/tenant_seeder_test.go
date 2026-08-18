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
	"strings"
	"testing"

	"github.com/thunder-id/thunderid/internal/envmgr"
	envmgrservice "github.com/thunder-id/thunderid/internal/envmgr/service"
	"github.com/thunder-id/thunderid/internal/envmgr/thunder"
	"github.com/thunder-id/thunderid/internal/system/deployment"
	"github.com/thunder-id/thunderid/internal/system/export"
	"github.com/thunder-id/thunderid/internal/system/importer"
	tidcommon "github.com/thunder-id/thunderid/pkg/thunderidengine/common"
)

// stubRegistry stands in for the in-process environment manager.
type stubRegistry struct {
	seedErr error
}

func (s *stubRegistry) SeedTenant(context.Context, string, string) (*thunder.ImportResponse, error) {
	return nil, s.seedErr
}

func (s *stubRegistry) CreateEnvironment(context.Context, string,
	envmgrservice.CreateEnvironmentInput) (envmgrservice.CreateEnvironmentResult, error) {
	return envmgrservice.CreateEnvironmentResult{}, nil
}

func (s *stubRegistry) CaptureSecret(context.Context, string, string,
	map[string]interface{}) (int, error) {
	return 0, nil
}

func (s *stubRegistry) SetLocalControlPlane(envmgrservice.LocalControlPlane) {}

func (s *stubRegistry) SetDataPlanes(envmgrservice.DataPlanes) {}

func (s *stubRegistry) SetDataPlaneTokenIssuer(envmgrservice.DataPlaneTokenIssuer) {}

type stubExport struct{ deploymentID string }

func (s *stubExport) ExportResources(ctx context.Context, _ *export.ExportRequest) (
	*export.ExportResponse, *tidcommon.ServiceError) {
	s.deploymentID = deployment.Resolve(ctx, "")
	return &export.ExportResponse{
		Files: []export.ExportFile{
			{FileName: "ou.yaml", Content: "resource_type: organization_unit\nid: ou-1\nhandle: default\n"},
			{FileName: "app.yaml", Content: "resource_type: application\nid: app-1\nname: App\n" +
				"clientSecret: {{.APPLICATION_APP_CLIENT_SECRET}}\n"},
		},
		EnvFile: &export.EnvironmentFile{FileName: ".env", Content: "APP_URL=https://app\n"},
	}, nil
}

type stubImport struct {
	deploymentID string
	request      *importer.ImportRequest
}

func (s *stubImport) ImportResources(ctx context.Context, request *importer.ImportRequest) (
	*importer.ImportResponse, *tidcommon.ServiceError) {
	s.deploymentID = deployment.Resolve(ctx, "")
	s.request = request
	return &importer.ImportResponse{
		Summary: &importer.ImportSummary{TotalDocuments: 2, Imported: 2},
	}, nil
}

func (s *stubImport) DeleteResource(context.Context, *importer.DeleteResourceRequest) (
	*importer.DeleteResourceResponse, *tidcommon.ServiceError) {
	return nil, nil
}

// An organization's environments are created one after another, so the first has nothing captured
// when the second is created. The copy then comes from reading that tenant directly.
func TestSeedTenantFallsBackToReadingTheSourceTenant(t *testing.T) {
	exportSvc := &stubExport{}
	importSvc := &stubImport{}
	seeder := &environmentSeeder{
		registry:  &stubRegistry{seedErr: envmgr.ErrNoSeedSource},
		exportSvc: exportSvc,
		importSvc: importSvc,
	}

	summary, err := seeder.SeedTenant(context.Background(), "acme:dev", "acme:stage")
	if err != nil {
		t.Fatalf("seed: %v", err)
	}

	// Each half runs against the tenant it belongs to, which is what keeps the copy in the right place.
	if exportSvc.deploymentID != "acme:dev" {
		t.Fatalf("the source should be read as acme:dev, got %q", exportSvc.deploymentID)
	}
	if importSvc.deploymentID != "acme:stage" {
		t.Fatalf("the copy should be written to acme:stage, got %q", importSvc.deploymentID)
	}

	// Both documents travel, joined as one multi-document bundle.
	if !strings.Contains(importSvc.request.Content, "organization_unit") ||
		!strings.Contains(importSvc.request.Content, "resource_type: application") {
		t.Fatalf("the whole tenant should be copied, got:\n%s", importSvc.request.Content)
	}
	// A control plane is written no credential, so the hashed one is left out of the document.
	if strings.Contains(importSvc.request.Content, "APPLICATION_APP_CLIENT_SECRET") {
		t.Fatalf("no credential may be written to a control plane, got:\n%s", importSvc.request.Content)
	}
	if summary.From != "acme:dev" || summary.Imported != 2 {
		t.Fatalf("unexpected summary: %+v", summary)
	}
}
