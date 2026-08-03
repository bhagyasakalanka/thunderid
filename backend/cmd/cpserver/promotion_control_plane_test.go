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
	"testing"

	"github.com/thunder-id/thunderid/internal/envmgr/thunder"
	"github.com/thunder-id/thunderid/internal/system/deployment"
	"github.com/thunder-id/thunderid/internal/system/importer"
	tidcommon "github.com/thunder-id/thunderid/pkg/thunderidengine/common"
)

// recordingImportService captures what the in-process import was actually asked to do.
type recordingImportService struct {
	request      *importer.ImportRequest
	deploymentID string
}

func (r *recordingImportService) ImportResources(ctx context.Context,
	request *importer.ImportRequest) (*importer.ImportResponse, *tidcommon.ServiceError) {
	r.request = request
	r.deploymentID = deployment.Resolve(ctx, "")
	return &importer.ImportResponse{Summary: &importer.ImportSummary{}}, nil
}

func (r *recordingImportService) DeleteResource(context.Context, *importer.DeleteResourceRequest) (
	*importer.DeleteResourceResponse, *tidcommon.ServiceError) {
	return nil, nil
}

// Writing an older version to a control plane tenant has to carry its deletions through. Copying the
// request field by field is how they went missing, leaving a restore that only added and updated and
// left everything a newer version had created in place.
func TestLocalControlPlaneImportCarriesDeletions(t *testing.T) {
	recorder := &recordingImportService{}
	cp := &localControlPlane{importService: recorder, baseURL: "https://localhost:8095"}

	_, err := cp.Import(context.Background(), "org3:dev", thunder.ImportRequest{
		Content:   "resource_type: application\nid: app-a\nname: app-a",
		Variables: map[string]interface{}{"APP_A_URL": "https://a"},
		Deletions: []thunder.ResourceDeletion{
			{ResourceType: "application", ID: "app-b"},
			{ResourceType: "flow", ID: "flow-b"},
		},
	})

	if err != nil {
		t.Fatalf("import: %v", err)
	}
	if recorder.deploymentID != "org3:dev" {
		t.Fatalf("the write should land in the named tenant, got %q", recorder.deploymentID)
	}
	if len(recorder.request.Deletions) != 2 {
		t.Fatalf("expected both deletions to reach the import, got %+v", recorder.request.Deletions)
	}
	if recorder.request.Deletions[0].ID != "app-b" || recorder.request.Deletions[1].ID != "flow-b" {
		t.Fatalf("unexpected deletions: %+v", recorder.request.Deletions)
	}
	if recorder.request.Content == "" || recorder.request.Variables["APP_A_URL"] != "https://a" {
		t.Fatalf("the rest of the request should travel too, got %+v", recorder.request)
	}
}
