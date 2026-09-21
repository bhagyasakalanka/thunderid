// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package promote

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	tidcommon "github.com/thunder-id/thunderid/pkg/thunderidengine/common"

	"github.com/thunder-id/thunderid/internal/system/deployment"
	"github.com/thunder-id/thunderid/internal/system/export"
	"github.com/thunder-id/thunderid/internal/system/importer"
)

// fakeExporter records the deployment it was asked to read and returns a fixed export.
type fakeExporter struct {
	scope   string
	request *export.ExportRequest
	files   []export.ExportFile
	err     *tidcommon.ServiceError
}

func (f *fakeExporter) ExportResources(ctx context.Context, request *export.ExportRequest) (
	*export.ExportResponse, *tidcommon.ServiceError) {
	f.scope = deployment.Resolve(ctx)
	f.request = request
	if f.err != nil {
		return nil, f.err
	}
	return &export.ExportResponse{
		Files: f.files,
		// An export also reports the source's own variable values. A promotion must not pass these
		// on, and this field being populated is what makes that assertion meaningful.
		EnvFile: &export.EnvironmentFile{Content: "APPLICATION_MY_APP_REDIRECT_URI=https://dev.example.com"},
	}, nil
}

// fakeImporter records the deployment and content it was asked to write.
type fakeImporter struct {
	scope    string
	request  *importer.ImportRequest
	response *importer.ImportResponse
	err      *tidcommon.ServiceError
}

func (f *fakeImporter) ImportResources(ctx context.Context, request *importer.ImportRequest) (
	*importer.ImportResponse, *tidcommon.ServiceError) {
	f.scope = deployment.Resolve(ctx)
	f.request = request
	if f.err != nil {
		return nil, f.err
	}
	return f.response, nil
}

func (f *fakeImporter) DeleteResource(_ context.Context, _ *importer.DeleteResourceRequest) (
	*importer.DeleteResourceResponse, *tidcommon.ServiceError) {
	return nil, nil
}

func newFixture(files []export.ExportFile, response *importer.ImportResponse) (
	ServiceInterface, *fakeExporter, *fakeImporter) {
	exporter := &fakeExporter{files: files}
	imp := &fakeImporter{response: response}
	return newService(exporter, imp), exporter, imp
}

func okResponse(imported int) *importer.ImportResponse {
	return &importer.ImportResponse{Summary: &importer.ImportSummary{Imported: imported}}
}

// The two halves run under different deployment scopes. This is the whole mechanism: one context,
// two ids, and the ordinary export and import doing the work.
func TestReadsTheSourceScopeAndWritesTheTargetScope(t *testing.T) {
	svc, exporter, imp := newFixture(
		[]export.ExportFile{{FileName: "app.yaml", Content: "kind: application"}}, okResponse(1))

	response, svcErr := svc.Promote(context.Background(), &Request{From: "dev", To: "stage"})

	require.Nil(t, svcErr)
	assert.Equal(t, "dev", exporter.scope, "the export must read the source deployment")
	assert.Equal(t, "stage", imp.scope, "the import must write the target deployment")
	assert.Equal(t, "dev", response.From)
	assert.Equal(t, "stage", response.To)
	assert.Equal(t, 1, response.Resources)
}

// The source's variable values must not travel with the configuration. Staging keeps its own
// redirect URIs and its own credentials; the import fills placeholders from the target's store.
func TestTheSourcesVariableValuesAreNotCarriedAcross(t *testing.T) {
	svc, _, imp := newFixture(
		[]export.ExportFile{{FileName: "app.yaml", Content: "kind: application"}}, okResponse(1))

	_, svcErr := svc.Promote(context.Background(), &Request{From: "dev", To: "prod"})

	require.Nil(t, svcErr)
	assert.Empty(t, imp.request.Variables,
		"a promotion must not hand the target the source's variable values")
}

// Every configuration type is asked for, and identity data is not.
func TestPromotesConfigurationButNotUsersOrGroups(t *testing.T) {
	svc, exporter, _ := newFixture(
		[]export.ExportFile{{FileName: "app.yaml", Content: "kind: application"}}, okResponse(1))

	_, svcErr := svc.Promote(context.Background(), &Request{From: "dev", To: "stage"})

	require.Nil(t, svcErr)
	require.NotNil(t, exporter.request)
	assert.Equal(t, []string{wildcard}, exporter.request.Applications)
	assert.Equal(t, []string{wildcard}, exporter.request.Flows)
	assert.Equal(t, []string{wildcard}, exporter.request.Themes)
	assert.Empty(t, exporter.request.Users, "users are identity data, not configuration")
	assert.Empty(t, exporter.request.Groups, "groups are identity data, not configuration")
}

// A dry run reaches the import, because that is what reports the outcome without writing.
func TestADryRunPropagatesToTheImport(t *testing.T) {
	svc, _, imp := newFixture(
		[]export.ExportFile{{FileName: "app.yaml", Content: "kind: application"}}, okResponse(0))

	response, svcErr := svc.Promote(context.Background(), &Request{From: "dev", To: "stage", DryRun: true})

	require.Nil(t, svcErr)
	assert.True(t, imp.request.DryRun)
	assert.True(t, response.DryRun, "the response repeats it, so a caller can tell nothing was written")
}

// Exported files are joined into the single document the import parser reads.
func TestExportedFilesAreJoinedIntoOneDocument(t *testing.T) {
	svc, _, imp := newFixture([]export.ExportFile{
		{FileName: "app.yaml", Content: "kind: application"},
		{FileName: "flow.yaml", Content: "kind: flow"},
	}, okResponse(2))

	_, svcErr := svc.Promote(context.Background(), &Request{From: "dev", To: "stage"})

	require.Nil(t, svcErr)
	assert.Equal(t, "kind: application\n---\nkind: flow", imp.request.Content)
}

// A resource the target refused is named, so a caller knows what did not arrive. A partial
// promotion is possible because the import is an upsert per resource, not one transaction.
func TestRefusedResourcesAreReported(t *testing.T) {
	svc, _, _ := newFixture(
		[]export.ExportFile{{FileName: "app.yaml", Content: "kind: application"}},
		&importer.ImportResponse{
			Summary: &importer.ImportSummary{Imported: 1, Failed: 1},
			Results: []importer.ImportItemOutcome{
				{ResourceType: "application", ResourceName: "Good App", Status: "success"},
				{ResourceType: "application", ResourceName: "My App", Status: statusFailed,
					Message: "APPLICATION_MY_APP_REDIRECT_URI is not set"},
			},
		})

	response, svcErr := svc.Promote(context.Background(), &Request{From: "dev", To: "prod"})

	require.Nil(t, svcErr)
	require.Len(t, response.Failures, 1)
	assert.Equal(t, "My App", response.Failures[0].Name)
	assert.Equal(t, "application", response.Failures[0].ResourceType)
	assert.Contains(t, response.Failures[0].Reason, "REDIRECT_URI",
		"the reason should name what the target is missing")
}

func TestRejectsAnIncompleteOrSelfReferentialRequest(t *testing.T) {
	svc, _, _ := newFixture(nil, okResponse(0))

	for name, request := range map[string]*Request{
		"nil":           nil,
		"no source":     {To: "stage"},
		"no target":     {From: "dev"},
		"blank source":  {From: "   ", To: "stage"},
		"same both":     {From: "dev", To: "dev"},
		"same via trim": {From: " dev ", To: "dev"},
	} {
		t.Run(name, func(t *testing.T) {
			_, svcErr := svc.Promote(context.Background(), request)
			require.NotNil(t, svcErr, "%s must be refused", name)
			assert.Equal(t, ErrorInvalidRequest.Code, svcErr.Code)
		})
	}
}

// An empty source is reported as its own condition rather than as a failed export, because it is a
// state the caller can act on.
func TestAnEmptySourceIsReportedAsNothingToPromote(t *testing.T) {
	exporter := &fakeExporter{err: &export.ErrorNoResourcesFound}
	svc := newService(exporter, &fakeImporter{response: okResponse(0)})

	_, svcErr := svc.Promote(context.Background(), &Request{From: "empty", To: "stage"})

	require.NotNil(t, svcErr)
	assert.Equal(t, ErrorSourceEmpty.Code, svcErr.Code)
}

// Deployment ids are trimmed before use, so a stray space cannot address a different scope.
func TestDeploymentIdsAreTrimmed(t *testing.T) {
	svc, exporter, imp := newFixture(
		[]export.ExportFile{{FileName: "app.yaml", Content: "kind: application"}}, okResponse(1))

	_, svcErr := svc.Promote(context.Background(), &Request{From: "  dev  ", To: "  stage  "})

	require.Nil(t, svcErr)
	assert.Equal(t, "dev", exporter.scope)
	assert.Equal(t, "stage", imp.scope)
}

// Naming resources narrows the export to those, so holding one resource back does not mean holding
// the whole environment back.
func TestASelectionNarrowsTheExport(t *testing.T) {
	svc, exporter, _ := newFixture(
		[]export.ExportFile{{FileName: "app.yaml", Content: "kind: application"}}, okResponse(1))

	_, svcErr := svc.Promote(context.Background(), &Request{
		From: "dev", To: "stage",
		Resources: []ResourceRef{
			{Type: "application", ID: "app-a"},
			{Type: "application", ID: "app-b"},
			{Type: "flow", ID: "login"},
		},
	})

	require.Nil(t, svcErr)
	assert.Equal(t, []string{"app-a", "app-b"}, exporter.request.Applications)
	assert.Equal(t, []string{"login"}, exporter.request.Flows)
	assert.Empty(t, exporter.request.Themes, "a type nobody named is not exported")
}

// An empty selection is the ordinary case and promotes everything.
func TestNoSelectionPromotesEverything(t *testing.T) {
	svc, exporter, _ := newFixture(
		[]export.ExportFile{{FileName: "app.yaml", Content: "kind: application"}}, okResponse(1))

	_, svcErr := svc.Promote(context.Background(), &Request{From: "dev", To: "stage"})

	require.Nil(t, svcErr)
	assert.Equal(t, []string{wildcard}, exporter.request.Applications)
}

// Naming a type a promotion does not carry is an error, not a silent drop: a caller asking for a
// user to be promoted has misunderstood, and promoting everything else would hide that.
func TestNamingAnUnpromotableTypeIsRefused(t *testing.T) {
	svc, _, _ := newFixture(nil, okResponse(0))

	for _, resourceType := range []string{"user", "group", "nonsense"} {
		_, svcErr := svc.Promote(context.Background(), &Request{
			From: "dev", To: "stage",
			Resources: []ResourceRef{{Type: resourceType, ID: "x"}},
		})
		require.NotNil(t, svcErr, "%s must be refused", resourceType)
		assert.Equal(t, ErrorUnpromotableType.Code, svcErr.Code)
	}
}

func TestANamedResourceNeedsBothATypeAndAnID(t *testing.T) {
	svc, _, _ := newFixture(nil, okResponse(0))

	for name, ref := range map[string]ResourceRef{
		"no type": {ID: "app-a"},
		"no id":   {Type: "application"},
		"blank":   {Type: "  ", ID: "  "},
	} {
		t.Run(name, func(t *testing.T) {
			_, svcErr := svc.Promote(context.Background(), &Request{
				From: "dev", To: "stage", Resources: []ResourceRef{ref},
			})
			require.NotNil(t, svcErr)
			assert.Equal(t, ErrorInvalidRequest.Code, svcErr.Code)
		})
	}
}
