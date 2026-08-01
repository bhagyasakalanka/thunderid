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

package service

import (
	"context"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"testing"

	"github.com/thunder-id/thunderid/internal/envmgr/model"
	"github.com/thunder-id/thunderid/internal/envmgr/store"
	"github.com/thunder-id/thunderid/internal/envmgr/thunder"
)

// fakeClient records import calls and serves canned export/reveal data.
type fakeClient struct {
	exportResources string
	exportEnv       string
	secrets         map[string]string
	envVars         map[string]string
	secretNames     []string
	kvWrites        map[string]map[string]interface{}
	kvExisting      map[string][2]string
	imports         []thunder.ImportRequest
}

func (f *fakeClient) Export(context.Context) (thunder.ExportResult, error) {
	return thunder.ExportResult{Resources: f.exportResources, EnvFile: f.exportEnv}, nil
}

func (f *fakeClient) SecretKeys(context.Context) ([]string, error) {
	keys := make([]string, 0, len(f.secrets))
	for k := range f.secrets {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys, nil
}

func (f *fakeClient) EnvironmentVariables(context.Context) (map[string]string, error) {
	return f.envVars, nil
}

func (f *fakeClient) SecretNames(context.Context) ([]string, error) {
	return f.secretNames, nil
}

func (f *fakeClient) PutSecret(_ context.Context, name string, body map[string]interface{}) error {
	if f.kvWrites == nil {
		f.kvWrites = map[string]map[string]interface{}{}
	}
	f.kvWrites[name] = body
	f.secretNames = append(f.secretNames, name)
	return nil
}

func (f *fakeClient) GetSecret(_ context.Context, name string) (string, string, bool, error) {
	if body, ok := f.kvWrites[name]; ok {
		kind, _ := body["kind"].(string)
		value, _ := body["value"].(string)
		return kind, value, true, nil
	}
	if v, ok := f.kvExisting[name]; ok {
		return v[0], v[1], true, nil
	}
	return "", "", false, nil
}

func (f *fakeClient) Import(_ context.Context, req thunder.ImportRequest) (*thunder.ImportResponse, error) {
	f.imports = append(f.imports, req)
	return &thunder.ImportResponse{Summary: &thunder.ImportSummary{}}, nil
}

func (f *fakeClient) lastImport() thunder.ImportRequest {
	return f.imports[len(f.imports)-1]
}

// fakeDataPlanes hands every environment the same fake, standing in for the connections data planes
// hold open to the control plane.
type fakeDataPlanes struct {
	plane     DataPlane
	connected bool
}

func (f *fakeDataPlanes) For(dataPlaneID string) (DataPlane, error) {
	if !f.connected {
		return nil, fmt.Errorf("data plane %s is not connected", dataPlaneID)
	}
	return f.plane, nil
}

func (f *fakeDataPlanes) Status(string) model.DataPlaneStatus {
	return model.DataPlaneStatus{Connected: f.connected}
}

func newTestService(t *testing.T, fake *fakeClient) *Service {
	t.Helper()
	st, err := store.New(t.TempDir())
	if err != nil {
		t.Fatalf("store: %v", err)
	}
	svc := New(st, func(string, thunder.Credentials, bool) ThunderClient { return fake })
	svc.SetDataPlanes(&fakeDataPlanes{plane: fake, connected: true})
	return svc
}

// app returns a minimal application document.
func app(id string) string {
	return fmt.Sprintf("resource_type: application\nid: %s\nname: %s", id, id)
}

func bundleOf(ids ...string) string {
	parts := make([]string, 0, len(ids))
	for _, id := range ids {
		parts = append(parts, app(id))
	}
	return strings.Join(parts, "\n---\n")
}

func TestApplyTracksDeletions(t *testing.T) {
	fake := &fakeClient{}
	svc := newTestService(t, fake)

	env, err := svc.CreateEnvironment(CreateEnvironmentInput{Name: "dev", Target: model.Target{DataPlaneID: "dp"}})
	if err != nil {
		t.Fatalf("create env: %v", err)
	}

	if _, err := svc.UploadVersion(env.ID, bundleOf("app-a", "app-b"), nil, "v1"); err != nil {
		t.Fatalf("upload v1: %v", err)
	}
	res, err := svc.Apply(context.Background(), env.ID, "latest", false)
	if err != nil {
		t.Fatalf("apply v1: %v", err)
	}
	if len(fake.lastImport().Deletions) != 0 {
		t.Fatalf("first apply should have no deletions: %+v", fake.lastImport().Deletions)
	}
	if res.TargetSeq != 1 {
		t.Fatalf("expected target seq 1, got %d", res.TargetSeq)
	}

	// v2 removes app-b -> apply must request its deletion.
	if _, err := svc.UploadVersion(env.ID, bundleOf("app-a"), nil, "v2"); err != nil {
		t.Fatalf("upload v2: %v", err)
	}
	if _, err := svc.Apply(context.Background(), env.ID, "latest", false); err != nil {
		t.Fatalf("apply v2: %v", err)
	}
	dels := fake.lastImport().Deletions
	if len(dels) != 1 || dels[0].ResourceType != "application" || dels[0].ID != "app-b" {
		t.Fatalf("expected deletion of application app-b, got %+v", dels)
	}

	// Applied version must be recorded on the environment.
	got, _ := svc.GetEnvironment(env.ID)
	if got.AppliedSeq != 2 {
		t.Fatalf("expected appliedSeq 2, got %d", got.AppliedSeq)
	}
}

func TestApplyDryRunDoesNotRecord(t *testing.T) {
	fake := &fakeClient{}
	svc := newTestService(t, fake)
	env, _ := svc.CreateEnvironment(CreateEnvironmentInput{Name: "dev", Target: model.Target{DataPlaneID: "dp"}})
	_, _ = svc.UploadVersion(env.ID, bundleOf("app-a"), nil, "v1")

	if _, err := svc.Apply(context.Background(), env.ID, "latest", true); err != nil {
		t.Fatalf("dry run apply: %v", err)
	}
	if !fake.lastImport().DryRun {
		t.Fatalf("expected dryRun propagated to import")
	}
	got, _ := svc.GetEnvironment(env.ID)
	if got.AppliedSeq != 0 {
		t.Fatalf("dry run must not record appliedSeq, got %d", got.AppliedSeq)
	}
}

func TestCaptureRecordsSecretKeysWithoutValues(t *testing.T) {
	fake := &fakeClient{
		exportResources: bundleOf("app-a"),
		exportEnv:       "APP_A_CLIENT_ID=abc\nAPP_A_CLIENT_SECRET=from-export",
		secrets:         map[string]string{"APP_A_CLIENT_SECRET": "never-read"},
	}
	svc := newTestService(t, fake)
	env, _ := svc.CreateEnvironment(CreateEnvironmentInput{
		Name:   "dev",
		Target: model.Target{DataPlaneID: "dp"},
		Source: &model.Source{BaseURL: "https://cp"},
	})

	v, err := svc.CaptureVersion(context.Background(), env.ID, "captured")
	if err != nil {
		t.Fatalf("capture: %v", err)
	}
	full, _ := svc.GetVersion(env.ID, v.Seq)

	if full.Variables["APP_A_CLIENT_ID"] != "abc" {
		t.Fatalf("expected the non-secret variable to be carried over")
	}
	// A secret's value must not be stored, even when the export happened to include one.
	if _, present := full.Variables["APP_A_CLIENT_SECRET"]; present {
		t.Fatalf("secret value was stored: %#v", full.Variables)
	}
	if len(full.SecretKeys) != 1 || full.SecretKeys[0] != "APP_A_CLIENT_SECRET" {
		t.Fatalf("expected the secret key to be recorded, got %v", full.SecretKeys)
	}
}

func TestCaptureLetsControlPlaneVariablesOverrideTheExport(t *testing.T) {
	fake := &fakeClient{
		exportResources: bundleOf("app-a"),
		exportEnv:       "APP_A_REDIRECT_URIS=[\"https://stale\"]",
		envVars:         map[string]string{"APP_A_REDIRECT_URIS": `["https://configured"]`},
	}
	svc := newTestService(t, fake)
	env, _ := svc.CreateEnvironment(CreateEnvironmentInput{
		Name:   "dev",
		Target: model.Target{DataPlaneID: "dp"},
		Source: &model.Source{BaseURL: "https://cp"},
	})

	v, _ := svc.CaptureVersion(context.Background(), env.ID, "")
	full, _ := svc.GetVersion(env.ID, v.Seq)
	if full.Variables["APP_A_REDIRECT_URIS"] != `["https://configured"]` {
		t.Fatalf("control plane value should win, got %q", full.Variables["APP_A_REDIRECT_URIS"])
	}
}

func TestApplyOmitsSecretsSoTheDataPlaneFillsThem(t *testing.T) {
	fake := &fakeClient{}
	svc := newTestService(t, fake)
	env, _ := svc.CreateEnvironment(CreateEnvironmentInput{Name: "dev", Target: model.Target{DataPlaneID: "dp"}})

	resources := "resource_type: application\nid: app-a\nname: app-a\nclientSecret: {{.APP_A_CLIENT_SECRET}}"
	stored, err := svc.store.AddVersion(model.Version{
		EnvID:      env.ID,
		Origin:     model.OriginUploaded,
		CreatedAt:  svc.now().UTC(),
		Resources:  resources,
		Variables:  map[string]string{},
		SecretKeys: []string{"APP_A_CLIENT_SECRET"},
	})
	if err != nil {
		t.Fatalf("add version: %v", err)
	}
	if _, err := svc.Apply(context.Background(), env.ID, strconv.Itoa(stored.Seq), false); err != nil {
		t.Fatalf("apply: %v", err)
	}

	if _, present := fake.lastImport().Variables["APP_A_CLIENT_SECRET"]; present {
		t.Fatalf("a secret must be omitted so the data plane resolves it, got %#v",
			fake.lastImport().Variables["APP_A_CLIENT_SECRET"])
	}
	// The placeholder itself must survive in the content for the data plane to fill.
	if !strings.Contains(fake.lastImport().Content, "{{.APP_A_CLIENT_SECRET}}") {
		t.Fatalf("the placeholder should remain in the content: %s", fake.lastImport().Content)
	}
}

func TestCaptureRequiresSource(t *testing.T) {
	svc := newTestService(t, &fakeClient{})
	env, _ := svc.CreateEnvironment(CreateEnvironmentInput{Name: "dev", Target: model.Target{DataPlaneID: "dp"}})
	if _, err := svc.CaptureVersion(context.Background(), env.ID, ""); err != ErrNoSource {
		t.Fatalf("expected ErrNoSource, got %v", err)
	}
}

func TestApplyPicksUpVariablesAddedAfterCapture(t *testing.T) {
	// The control plane has nothing configured at capture time.
	fake := &fakeClient{
		exportResources: "resource_type: application\nid: app-a\nname: app-a\n" +
			"redirectUris:\n  {{- range .APP_A_REDIRECT_URIS}}\n  - {{.}}\n  {{- end}}",
	}
	svc := newTestService(t, fake)
	env, _ := svc.CreateEnvironment(CreateEnvironmentInput{
		Name:   "dev",
		Target: model.Target{DataPlaneID: "dp"},
		Source: &model.Source{BaseURL: "https://cp"},
	})
	if _, err := svc.CaptureVersion(context.Background(), env.ID, ""); err != nil {
		t.Fatalf("capture: %v", err)
	}

	status, err := svc.CheckVariables(context.Background(), env.ID, "latest")
	if err != nil {
		t.Fatalf("check: %v", err)
	}
	if len(status.Missing) != 1 || status.Missing[0] != "APP_A_REDIRECT_URIS" {
		t.Fatalf("expected the redirect URIs to be reported missing, got %v", status.Missing)
	}

	// The operator now sets it in the control plane, without re-capturing.
	fake.envVars = map[string]string{"APP_A_REDIRECT_URIS": `["https://dp/callback"]`}

	status, err = svc.CheckVariables(context.Background(), env.ID, "latest")
	if err != nil {
		t.Fatalf("re-check: %v", err)
	}
	if len(status.Missing) != 0 {
		t.Fatalf("the new value should clear the warning, got %v", status.Missing)
	}

	if _, err := svc.Apply(context.Background(), env.ID, "latest", false); err != nil {
		t.Fatalf("apply: %v", err)
	}
	arr, ok := fake.lastImport().Variables["APP_A_REDIRECT_URIS"].([]interface{})
	if !ok || len(arr) != 1 || arr[0] != "https://dp/callback" {
		t.Fatalf("apply should use the live value, got %#v", fake.lastImport().Variables["APP_A_REDIRECT_URIS"])
	}
}

func TestPromoteSelective(t *testing.T) {
	svc := newTestService(t, &fakeClient{})
	dev, _ := svc.CreateEnvironment(CreateEnvironmentInput{Name: "dev", Rank: intp(1), Target: model.Target{DataPlaneID: "dev"}})
	prod, _ := svc.CreateEnvironment(CreateEnvironmentInput{Name: "prod", Rank: intp(2), Target: model.Target{DataPlaneID: "prod"}})

	_, _ = svc.UploadVersion(dev.ID, bundleOf("app-a", "app-b"), nil, "dev-v1")

	// Promote only app-a to prod.
	result, err := svc.Promote(context.Background(), PromoteInput{
		FromEnvID: dev.ID, ToEnvID: prod.ID, Selection: []string{"application/id:app-a"},
		SelectionProvided: true,
	})
	if err != nil {
		t.Fatalf("promote: %v", err)
	}
	if result.Preview.Summary.Added != 2 {
		t.Fatalf("preview should show 2 additions, got %+v", result.Preview.Summary)
	}
	full, _ := svc.GetVersion(prod.ID, result.NewVersion.Seq)
	if strings.Contains(full.Resources, "app-b") {
		t.Fatalf("app-b should not have been promoted:\n%s", full.Resources)
	}
	if !strings.Contains(full.Resources, "app-a") {
		t.Fatalf("app-a should have been promoted:\n%s", full.Resources)
	}
	if full.Origin != model.OriginPromoted || full.SourceEnvID != dev.ID {
		t.Fatalf("promotion metadata wrong: %+v", full)
	}
}

func TestPromoteAllAndApply(t *testing.T) {
	fake := &fakeClient{}
	svc := newTestService(t, fake)
	dev, _ := svc.CreateEnvironment(CreateEnvironmentInput{Name: "dev", Rank: intp(1), Target: model.Target{DataPlaneID: "dev"}})
	prod, _ := svc.CreateEnvironment(CreateEnvironmentInput{Name: "prod", Rank: intp(2), Target: model.Target{DataPlaneID: "prod"}})
	_, _ = svc.UploadVersion(dev.ID, bundleOf("app-a", "app-b"), nil, "dev-v1")

	result, err := svc.Promote(context.Background(), PromoteInput{FromEnvID: dev.ID, ToEnvID: prod.ID, Apply: true})
	if err != nil {
		t.Fatalf("promote+apply: %v", err)
	}
	if result.Applied == nil {
		t.Fatalf("expected apply result")
	}
	got, _ := svc.GetEnvironment(prod.ID)
	if got.AppliedSeq != result.NewVersion.Seq {
		t.Fatalf("prod applied seq %d != new version %d", got.AppliedSeq, result.NewVersion.Seq)
	}
}

func TestRevertRestoresAndAdvancesHead(t *testing.T) {
	svc := newTestService(t, &fakeClient{})
	env, _ := svc.CreateEnvironment(CreateEnvironmentInput{Name: "dev", Target: model.Target{DataPlaneID: "dp"}})
	_, _ = svc.UploadVersion(env.ID, bundleOf("app-a"), nil, "v1")
	_, _ = svc.UploadVersion(env.ID, bundleOf("app-a", "app-b"), nil, "v2")

	result, err := svc.Revert(context.Background(), RevertInput{EnvID: env.ID, ToRef: "1"})
	if err != nil {
		t.Fatalf("revert: %v", err)
	}
	if result.NewVersion.Seq != 3 || result.NewVersion.Origin != model.OriginReverted {
		t.Fatalf("revert should add a new head v3: %+v", result.NewVersion)
	}
	full, _ := svc.GetVersion(env.ID, 3)
	if strings.Contains(full.Resources, "app-b") {
		t.Fatalf("reverted head should match v1 (no app-b):\n%s", full.Resources)
	}
	// Preview reflects removing app-b (current v2 -> target v1).
	if result.Preview.Summary.Deleted != 1 {
		t.Fatalf("expected one deletion in revert preview, got %+v", result.Preview.Summary)
	}
}

func TestRevertToPreviousResolvesSecondNewest(t *testing.T) {
	svc := newTestService(t, &fakeClient{})
	env, _ := svc.CreateEnvironment(CreateEnvironmentInput{Name: "dev", Target: model.Target{DataPlaneID: "dp"}})
	_, _ = svc.UploadVersion(env.ID, bundleOf("app-a"), nil, "v1")
	_, _ = svc.UploadVersion(env.ID, bundleOf("app-a", "app-b"), nil, "v2")
	_, _ = svc.UploadVersion(env.ID, bundleOf("app-a", "app-b", "app-c"), nil, "v3")

	result, err := svc.Revert(context.Background(), RevertInput{EnvID: env.ID, ToRef: "previous"})
	if err != nil {
		t.Fatalf("revert to previous: %v", err)
	}
	// v3 is the head, so "previous" is v2: the new head must match v2's content.
	full, _ := svc.GetVersion(env.ID, result.NewVersion.Seq)
	if !strings.Contains(full.Resources, "app-b") || strings.Contains(full.Resources, "app-c") {
		t.Fatalf("expected v2 content restored, got:\n%s", full.Resources)
	}
	if full.SourceSeq != 2 {
		t.Fatalf("expected sourceSeq 2, got %d", full.SourceSeq)
	}
}

func TestRevertToPreviousRequiresTwoVersions(t *testing.T) {
	svc := newTestService(t, &fakeClient{})
	env, _ := svc.CreateEnvironment(CreateEnvironmentInput{Name: "dev", Target: model.Target{DataPlaneID: "dp"}})
	_, _ = svc.UploadVersion(env.ID, bundleOf("app-a"), nil, "v1")

	if _, err := svc.Revert(context.Background(), RevertInput{EnvID: env.ID, ToRef: "previous"}); err !=
		ErrNoPreviousVersion {
		t.Fatalf("expected ErrNoPreviousVersion, got %v", err)
	}
}

func TestApplyAllPushesEveryEnvironment(t *testing.T) {
	fake := &fakeClient{}
	svc := newTestService(t, fake)
	dev, _ := svc.CreateEnvironment(CreateEnvironmentInput{
		Name: "dev", Rank: intp(1), Target: model.Target{DataPlaneID: "dev"},
	})
	prod, _ := svc.CreateEnvironment(CreateEnvironmentInput{
		Name: "prod", Rank: intp(2), Target: model.Target{DataPlaneID: "prod"},
	})
	_, _ = svc.UploadVersion(dev.ID, bundleOf("app-a"), nil, "v1")
	_, _ = svc.UploadVersion(prod.ID, bundleOf("app-a"), nil, "v1")

	results := svc.ApplyAll(context.Background(), false)

	if len(results) != 2 {
		t.Fatalf("expected a result per environment, got %d", len(results))
	}
	for _, r := range results {
		if r.Error != "" || r.Applied == nil {
			t.Fatalf("%s should have applied, got error %q", r.EnvName, r.Error)
		}
	}
	if len(fake.imports) != 2 {
		t.Fatalf("expected two imports, got %d", len(fake.imports))
	}
}

func TestApplyAllSkipsEnvironmentsWithoutAVersionAndKeepsGoing(t *testing.T) {
	fake := &fakeClient{}
	svc := newTestService(t, fake)
	empty, _ := svc.CreateEnvironment(CreateEnvironmentInput{
		Name: "empty", Rank: intp(1), Target: model.Target{DataPlaneID: "empty"},
	})
	ready, _ := svc.CreateEnvironment(CreateEnvironmentInput{
		Name: "ready", Rank: intp(2), Target: model.Target{DataPlaneID: "ready"},
	})
	_, _ = svc.UploadVersion(ready.ID, bundleOf("app-a"), nil, "v1")

	results := svc.ApplyAll(context.Background(), false)

	byID := map[string]ApplyAllResult{}
	for _, r := range results {
		byID[r.EnvID] = r
	}
	// The environment with nothing to apply is reported, not fatal, and the other still goes through.
	if byID[empty.ID].Error == "" {
		t.Fatalf("expected the empty environment to report why it was skipped")
	}
	if byID[ready.ID].Applied == nil {
		t.Fatalf("a skipped environment must not stop the others")
	}
}

func TestCheckVariablesReportsSecretsTheDataPlaneLacks(t *testing.T) {
	// The data plane holds one of the two secrets the configuration needs.
	fake := &fakeClient{
		exportResources: "resource_type: application\nid: app-a\nname: app-a\n" +
			"clientSecret: {{.APP_A_CLIENT_SECRET}}\nother: {{.APP_B_CLIENT_SECRET}}",
		secrets:     map[string]string{"APP_A_CLIENT_SECRET": "x", "APP_B_CLIENT_SECRET": "y"},
		secretNames: []string{"APP_A_CLIENT_SECRET"},
	}
	svc := newTestService(t, fake)
	env, _ := svc.CreateEnvironment(CreateEnvironmentInput{
		Name: "dev",
		Target: model.Target{
			DataPlaneID: "dp",
		},
		Source: &model.Source{BaseURL: "https://cp"},
	})
	if _, err := svc.CaptureVersion(context.Background(), env.ID, ""); err != nil {
		t.Fatalf("capture: %v", err)
	}

	status, err := svc.CheckVariables(context.Background(), env.ID, "latest")
	if err != nil {
		t.Fatalf("check: %v", err)
	}
	if !status.SecretsChecked {
		t.Fatal("the secret service was configured, so it should have been consulted")
	}
	if len(status.MissingSecrets) != 1 || status.MissingSecrets[0] != "APP_B_CLIENT_SECRET" {
		t.Fatalf("expected only the absent secret to be reported, got %v", status.MissingSecrets)
	}
}

func TestCheckVariablesUsesTheDataPlanesOwnSecretStore(t *testing.T) {
	fake := &fakeClient{
		exportResources: "resource_type: application\nid: app-a\nname: app-a\n" +
			"clientSecret: {{.APP_A_CLIENT_SECRET}}",
		secrets:     map[string]string{"APP_A_CLIENT_SECRET": "x"},
		secretNames: []string{"APP_A_CLIENT_SECRET"},
	}
	svc := newTestService(t, fake)
	env, _ := svc.CreateEnvironment(CreateEnvironmentInput{
		Name:   "dev",
		Target: model.Target{DataPlaneID: "dp"},
		Source: &model.Source{BaseURL: "https://cp"},
	})
	_, _ = svc.CaptureVersion(context.Background(), env.ID, "")

	status, _ := svc.CheckVariables(context.Background(), env.ID, "latest")
	// With no separate service named, the data plane's own store answers, so the check is real.
	if !status.SecretsChecked {
		t.Fatal("the data plane's own secret store should have been consulted")
	}
	if len(status.MissingSecrets) != 0 {
		t.Fatalf("the store holds the secret, got %v", status.MissingSecrets)
	}
}

func TestPromoteLeavesTheDestinationsCredentialsAlone(t *testing.T) {
	fake := &fakeClient{}
	svc := newTestService(t, fake)
	dev, _ := svc.CreateEnvironment(CreateEnvironmentInput{
		Name: "dev", Rank: intp(1), Target: model.Target{DataPlaneID: "dev"},
		Source: &model.Source{BaseURL: "https://dev-cp", DeploymentID: "dev-tenant"},
	})
	stage, _ := svc.CreateEnvironment(CreateEnvironmentInput{
		Name: "stage", Rank: intp(2),
		Target: model.Target{
			DataPlaneID: "stage",
		},
		Source: &model.Source{BaseURL: "https://stage-cp", DeploymentID: "stage-tenant"},
	})

	// A version whose configuration needs one secret.
	if _, err := svc.store.AddVersion(model.Version{
		EnvID: dev.ID, Origin: model.OriginUploaded, CreatedAt: svc.now().UTC(),
		Resources:  "resource_type: application\nid: app-a\nname: app-a",
		Variables:  map[string]string{},
		SecretKeys: []string{"APP_A_CLIENT_SECRET"},
	}); err != nil {
		t.Fatalf("add version: %v", err)
	}

	result, err := svc.Promote(context.Background(), PromoteInput{FromEnvID: dev.ID, ToEnvID: stage.ID})
	if err != nil {
		t.Fatalf("promote: %v", err)
	}

	// Nothing invents a credential for the destination: it is named as one the destination has to hold,
	// and set against its own data plane.
	if len(result.Secrets.Generated) != 0 || len(result.Secrets.Skipped) != 1 {
		t.Fatalf("a promote must not issue credentials, got %+v", result.Secrets)
	}
	// A promotion is started from the source, so it must not reach into the destination's secret store:
	// those credentials arrive by the destination's own control plane capturing them.
	if len(fake.kvWrites) != 0 {
		t.Fatalf("a promote must not write to the destination's secret store, got %v", fake.kvWrites)
	}

	// The promoted configuration is written into the target's control plane tenant.
	if result.ControlPlane == nil {
		t.Fatal("the configuration should have been imported into the target control plane")
	}
	if len(fake.imports) == 0 {
		t.Fatal("expected an import into the target control plane")
	}
}

func TestPromoteNeverReadsTheDestinationsSecretStore(t *testing.T) {
	// The destination holds a credential of its own. A promote must neither consult it nor replace it:
	// the destination's secret store belongs to the destination, and the source cannot manage it.
	fake := &fakeClient{kvExisting: map[string][2]string{"APP_A_CLIENT_SECRET": {"hash", "the-hash"}}}
	svc := newTestService(t, fake)
	dev, _ := svc.CreateEnvironment(CreateEnvironmentInput{
		Name: "dev", Rank: intp(1), Target: model.Target{DataPlaneID: "dev"},
	})
	stage, _ := svc.CreateEnvironment(CreateEnvironmentInput{
		Name: "stage", Rank: intp(2),
		Target: model.Target{
			DataPlaneID: "stage",
		},
	})
	_, _ = svc.store.AddVersion(model.Version{
		EnvID: dev.ID, Origin: model.OriginUploaded, CreatedAt: svc.now().UTC(),
		Resources: "resource_type: application\nid: app-a\nname: app-a",
		Variables: map[string]string{}, SecretKeys: []string{"APP_A_CLIENT_SECRET"},
	})

	if _, err := svc.Promote(context.Background(), PromoteInput{FromEnvID: dev.ID, ToEnvID: stage.ID}); err != nil {
		t.Fatalf("promote: %v", err)
	}

	if len(fake.kvWrites) != 0 {
		t.Fatalf("the destination's credential must be left alone, got %v", fake.kvWrites)
	}
}

func TestControlPlaneWriteOmitsHashedCredentialsAndReferencesReplayableOnes(t *testing.T) {
	// A control plane write carries no credential, but the two kinds cannot be expressed the same way.
	// An application's client secret is only ever verified, so the field is left out. A connection's is
	// handed to the upstream provider and the resource is rejected without it, so it is written as a
	// reference to where the credential is held rather than as the credential.
	fake := &fakeClient{}
	svc := newTestService(t, fake)
	dev, _ := svc.CreateEnvironment(CreateEnvironmentInput{
		Name: "dev", Rank: intp(1), Target: model.Target{DataPlaneID: "dev"},
		Source: &model.Source{BaseURL: "https://dev-cp", DeploymentID: "dev-tenant"},
	})
	_, _ = svc.store.AddVersion(model.Version{
		EnvID: dev.ID, Origin: model.OriginUploaded, CreatedAt: svc.now().UTC(),
		Resources: "resource_type: application\nid: app-a\nname: app-a\n" +
			"clientSecret: {{.APPLICATION_APP_A_CLIENT_SECRET}}\n" +
			"---\nresource_type: connection\nid: conn-a\nname: conn-a\ntype: oidc\n" +
			"clientSecret: {{.CONNECTION_CONN_A_CLIENT_SECRET}}\n",
		Variables: map[string]string{},
	})

	if _, err := svc.ApplyToControlPlane(context.Background(), dev.ID, "latest"); err != nil {
		t.Fatalf("apply to control plane: %v", err)
	}
	if len(fake.imports) != 1 {
		t.Fatalf("expected one import, got %d", len(fake.imports))
	}
	req := fake.imports[0]

	if strings.Contains(req.Content, "APPLICATION_APP_A_CLIENT_SECRET") {
		t.Fatalf("the application's client secret field should have been left out, got:\n%s", req.Content)
	}
	if !strings.Contains(req.Content, "{{.CONNECTION_CONN_A_CLIENT_SECRET}}") {
		t.Fatalf("the connection's client secret field is required, so it must stay, got:\n%s", req.Content)
	}
	if req.Variables["CONNECTION_CONN_A_CLIENT_SECRET"] != "kv:CONNECTION_CONN_A_CLIENT_SECRET" {
		t.Fatalf("the connection's credential should resolve to a reference, got %#v", req.Variables)
	}
}

func TestCaptureSecretForTenantRoutesToThatTenantsProvider(t *testing.T) {
	fake := &fakeClient{}
	svc := newTestService(t, fake)
	_, _ = svc.CreateEnvironment(CreateEnvironmentInput{
		Name: "dev", Rank: intp(1),
		Target: model.Target{
			DataPlaneID: "dev",
		},
		Source: &model.Source{BaseURL: "https://cp", DeploymentID: "dev-tenant"},
	})

	delivered, err := svc.CaptureSecretForTenant(context.Background(), "dev-tenant", "MY_SECRET",
		map[string]interface{}{"kind": "hash", "value": "h", "algorithm": "PBKDF2"})
	if err != nil {
		t.Fatalf("capture: %v", err)
	}
	if delivered != 1 || fake.kvWrites["MY_SECRET"]["kind"] != "hash" {
		t.Fatalf("expected the secret routed to that tenant's provider, got %d %#v",
			delivered, fake.kvWrites)
	}

	// A tenant with no registered environment is not an error: there is simply nowhere to send it yet.
	if n, err := svc.CaptureSecretForTenant(context.Background(), "unknown", "X",
		map[string]interface{}{"kind": "value", "value": "v"}); err != nil || n != 0 {
		t.Fatalf("expected zero deliveries and no error, got %d %v", n, err)
	}
}

func TestVersionHistoryPruned(t *testing.T) {
	svc := newTestService(t, &fakeClient{})
	env, _ := svc.CreateEnvironment(CreateEnvironmentInput{Name: "dev", Target: model.Target{DataPlaneID: "dp"}})
	for i := 0; i < 7; i++ {
		if _, err := svc.UploadVersion(env.ID, bundleOf("app-"+strconv.Itoa(i)), nil, "v"); err != nil {
			t.Fatalf("upload: %v", err)
		}
	}
	versions, _ := svc.ListVersions(env.ID)
	if len(versions) != store.KeepPrevious+1 {
		t.Fatalf("expected %d versions retained, got %d", store.KeepPrevious+1, len(versions))
	}
	// Newest first: seq 7 down to 4.
	if versions[0].Seq != 7 || versions[len(versions)-1].Seq != 4 {
		t.Fatalf("unexpected retained range: %d..%d", versions[0].Seq, versions[len(versions)-1].Seq)
	}
}

func intp(i int) *int { return &i }

func TestCheckVariablesClassifiesACredentialInAnOlderVersion(t *testing.T) {
	svc := newTestService(t, &fakeClient{secretNames: []string{"ADMIN2_WSO2_COM_PASSWORD"}})

	env, err := svc.CreateEnvironment(CreateEnvironmentInput{
		Name: "dev",
		Target: model.Target{
			DataPlaneID: "dp",
		},
	})
	if err != nil {
		t.Fatalf("create environment: %v", err)
	}

	// A version captured before credentials were classified: SecretKeys is empty even though the
	// bundle plainly holds a password.
	if _, err := svc.UploadVersion(env.ID,
		"resource_type: user\ncredentials:\n  password: \"{{.ADMIN2_WSO2_COM_PASSWORD}}\"\n",
		map[string]string{}, "captured earlier"); err != nil {
		t.Fatalf("upload version: %v", err)
	}

	status, err := svc.CheckVariables(context.Background(), env.ID, "latest")
	if err != nil {
		t.Fatalf("check variables: %v", err)
	}
	if len(status.Missing) != 0 {
		t.Fatalf("a password is not a missing variable, got %v", status.Missing)
	}
	if len(status.SecretBacked) != 1 || status.SecretBacked[0] != "ADMIN2_WSO2_COM_PASSWORD" {
		t.Fatalf("the password should be reported as secret backed, got %v", status.SecretBacked)
	}
	if len(status.MissingSecrets) != 0 {
		t.Fatalf("the secret service holds it, so nothing is missing, got %v", status.MissingSecrets)
	}
}

// setupPromotionPair builds a dev -> prod pair with two applications in dev.
func setupPromotionPair(t *testing.T, fake *fakeClient) (*Service, model.Environment, model.Environment) {
	t.Helper()
	svc := newTestService(t, fake)
	dev, _ := svc.CreateEnvironment(CreateEnvironmentInput{
		Name: "dev", Rank: intp(1), Target: model.Target{DataPlaneID: "dev"}})
	prod, _ := svc.CreateEnvironment(CreateEnvironmentInput{
		Name: "prod", Rank: intp(2), Target: model.Target{DataPlaneID: "prod"}})
	if _, err := svc.UploadVersion(dev.ID, bundleOf("app-a", "app-b"), nil, "dev-v1"); err != nil {
		t.Fatalf("upload: %v", err)
	}
	return svc, dev, prod
}

func TestPromoteRemembersWhatWasHeldBack(t *testing.T) {
	svc, dev, prod := setupPromotionPair(t, &fakeClient{})

	// The user promotes app-a and deliberately leaves app-b behind.
	if _, err := svc.Promote(context.Background(), PromoteInput{
		FromEnvID: dev.ID, ToEnvID: prod.ID,
		Selection: []string{"application/id:app-a"}, SelectionProvided: true,
	}); err != nil {
		t.Fatalf("promote: %v", err)
	}

	env, err := svc.GetEnvironment(prod.ID)
	if err != nil {
		t.Fatalf("get environment: %v", err)
	}
	if len(env.Excluded) != 1 || env.Excluded[0] != "application/id:app-b" {
		t.Fatalf("the held back resource should have been recorded, got %v", env.Excluded)
	}
}

func TestPromoteKeepsHoldingBackOnALaterRun(t *testing.T) {
	svc, dev, prod := setupPromotionPair(t, &fakeClient{})

	if _, err := svc.Promote(context.Background(), PromoteInput{
		FromEnvID: dev.ID, ToEnvID: prod.ID,
		Selection: []string{"application/id:app-a"}, SelectionProvided: true,
	}); err != nil {
		t.Fatalf("first promote: %v", err)
	}

	// dev changes again and the user promotes without expressing a preference. The earlier decision
	// stands: asking again every time is how a held back resource eventually slips through.
	if _, err := svc.UploadVersion(dev.ID, bundleOf("app-a", "app-b", "app-c"), nil, "dev-v2"); err != nil {
		t.Fatalf("upload: %v", err)
	}
	result, err := svc.Promote(context.Background(), PromoteInput{FromEnvID: dev.ID, ToEnvID: prod.ID})
	if err != nil {
		t.Fatalf("second promote: %v", err)
	}

	full, _ := svc.GetVersion(prod.ID, result.NewVersion.Seq)
	if strings.Contains(full.Resources, "app-b") {
		t.Fatalf("app-b was held back earlier and must stay held back:\n%s", full.Resources)
	}
	if !strings.Contains(full.Resources, "app-c") {
		t.Fatalf("a resource nobody held back should promote:\n%s", full.Resources)
	}
}

func TestPromoteReleasesAResourceWhenItIsSelectedAgain(t *testing.T) {
	svc, dev, prod := setupPromotionPair(t, &fakeClient{})

	if _, err := svc.Promote(context.Background(), PromoteInput{
		FromEnvID: dev.ID, ToEnvID: prod.ID,
		Selection: []string{"application/id:app-a"}, SelectionProvided: true,
	}); err != nil {
		t.Fatalf("first promote: %v", err)
	}

	// The user changes their mind and selects app-b this time.
	result, err := svc.Promote(context.Background(), PromoteInput{
		FromEnvID: dev.ID, ToEnvID: prod.ID,
		Selection: []string{"application/id:app-b"}, SelectionProvided: true,
	})
	if err != nil {
		t.Fatalf("second promote: %v", err)
	}

	full, _ := svc.GetVersion(prod.ID, result.NewVersion.Seq)
	if !strings.Contains(full.Resources, "app-b") {
		t.Fatalf("app-b was selected and should have promoted:\n%s", full.Resources)
	}
	env, _ := svc.GetEnvironment(prod.ID)
	for _, key := range env.Excluded {
		if key == "application/id:app-b" {
			t.Fatal("selecting a resource again must clear the record, or it would be held back forever")
		}
	}
}

func TestApplyLeavesAHeldBackResourceAlone(t *testing.T) {
	fake := &fakeClient{}
	svc, dev, prod := setupPromotionPair(t, fake)

	if _, err := svc.Promote(context.Background(), PromoteInput{
		FromEnvID: dev.ID, ToEnvID: prod.ID,
		Selection: []string{"application/id:app-a"}, SelectionProvided: true,
	}); err != nil {
		t.Fatalf("promote: %v", err)
	}
	if _, err := svc.Apply(context.Background(), prod.ID, "latest", false); err != nil {
		t.Fatalf("apply: %v", err)
	}

	// Held back means left alone on the data plane: neither pushed nor deleted.
	if strings.Contains(fake.lastImport().Content, "app-b") {
		t.Fatalf("a held back resource must not be applied:\n%s", fake.lastImport().Content)
	}
	for _, d := range fake.lastImport().Deletions {
		if d.ID == "app-b" {
			t.Fatal("holding a resource back means leaving it alone, not deleting it from the data plane")
		}
	}
}

// The promotion view shows whether each environment's data plane is connected, because nothing can be
// applied or promoted to one that is not, and an operator should see that before starting.
func TestEnvironmentSummariesReportDataPlaneConnectivity(t *testing.T) {
	fake := &fakeClient{}
	svc := newTestService(t, fake)
	planes := &fakeDataPlanes{plane: fake, connected: true}
	svc.SetDataPlanes(planes)
	if _, err := svc.CreateEnvironment(CreateEnvironmentInput{
		Name: "dev", Target: model.Target{DataPlaneID: "dev-dp"},
	}); err != nil {
		t.Fatalf("create: %v", err)
	}

	summaries, err := svc.ListEnvironmentSummaries()
	if err != nil {
		t.Fatalf("summaries: %v", err)
	}
	if !summaries[0].DataPlane.Connected {
		t.Fatal("a connected data plane should be reported as connected")
	}

	planes.connected = false
	summaries, err = svc.ListEnvironmentSummaries()
	if err != nil {
		t.Fatalf("summaries: %v", err)
	}
	if summaries[0].DataPlane.Connected {
		t.Fatal("a data plane that dropped should be reported as disconnected")
	}
}

// An environment that names no data plane cannot be applied to, and says so rather than failing at the
// transport with something that reads like an outage.
func TestApplyRefusesWhenTheDataPlaneIsNotConnected(t *testing.T) {
	fake := &fakeClient{}
	svc := newTestService(t, fake)
	svc.SetDataPlanes(&fakeDataPlanes{plane: fake, connected: false})
	env, _ := svc.CreateEnvironment(CreateEnvironmentInput{
		Name: "dev", Target: model.Target{DataPlaneID: "dev-dp"},
	})
	_, _ = svc.store.AddVersion(model.Version{
		EnvID: env.ID, Origin: model.OriginUploaded, CreatedAt: svc.now().UTC(), Resources: app("a"),
	})

	_, err := svc.Apply(context.Background(), env.ID, "latest", false)

	if err == nil || !strings.Contains(err.Error(), "not connected") {
		t.Fatalf("expected a disconnected data plane to be named, got %v", err)
	}
}
