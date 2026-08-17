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
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package service

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/thunder-id/thunderid/internal/envmgr/model"
	"github.com/thunder-id/thunderid/internal/envmgr/thunder"
)

// secretsFixture builds an environment holding one credential of each kind: an application's client
// secret, which is only ever verified, and a connection's, which is replayed to the provider.
func secretsFixture(t *testing.T) (*Service, *fakeClient, model.Environment) {
	t.Helper()
	fake := &fakeClient{
		exportResources: "resource_type: application\nid: app-a\nname: app-a\n" +
			"clientSecret: {{.APPLICATION_APP_A_CLIENT_SECRET}}\n" +
			"---\nresource_type: connection\nid: conn-a\nname: conn-a\n" +
			"clientSecret: {{.CONNECTION_CONN_A_CLIENT_SECRET}}",
		secrets: map[string]string{
			"APPLICATION_APP_A_CLIENT_SECRET": "x",
			"CONNECTION_CONN_A_CLIENT_SECRET": "y",
		},
		secretNames: []string{"CONNECTION_CONN_A_CLIENT_SECRET"},
	}
	svc := newTestService(t, fake)
	svc.SetSecretHasher(func(value string) (HashedSecret, error) {
		return HashedSecret{Hash: "hashed:" + value, Algorithm: "SHA256", Salt: "salt"}, nil
	})
	env, err := svc.CreateEnvironment(context.Background(), CreateEnvironmentInput{
		Name:   "dev",
		Target: model.Target{DataPlaneID: "dp"},
		Source: &model.Source{BaseURL: "https://cp", DeploymentID: "tenant-a"},
	})
	if err != nil {
		t.Fatalf("create environment: %v", err)
	}
	if _, err := svc.CaptureVersion(context.Background(), env.ID, ""); err != nil {
		t.Fatalf("capture: %v", err)
	}
	return svc, fake, env.Environment
}

func TestListSecretsClassifiesByResourceAndReportsWhatTheDataPlaneHolds(t *testing.T) {
	svc, _, env := secretsFixture(t)

	list, err := svc.ListSecrets(context.Background(), env.ID)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if !list.Checked {
		t.Fatal("the data plane's store answered, so held is a judgement")
	}
	byName := map[string]SecretEntry{}
	for _, entry := range list.Secrets {
		byName[entry.Name] = entry
	}

	app := byName["APPLICATION_APP_A_CLIENT_SECRET"]
	// An application's client secret is only ever compared against what a client presents.
	if app.Kind != KindHash {
		t.Fatalf("an application client secret must be hashed, got %q", app.Kind)
	}
	if app.Held {
		t.Fatal("the data plane does not hold it, so it must be reported as missing")
	}
	if app.ResourceType != "application" || app.ResourceName != "app-a" {
		t.Fatalf("the owning resource must be reported, got %+v", app)
	}

	conn := byName["CONNECTION_CONN_A_CLIENT_SECRET"]
	// The same field name on a connection is handed to the upstream provider, so it cannot be hashed.
	if conn.Kind != KindValue {
		t.Fatalf("a connection client secret must stay readable, got %q", conn.Kind)
	}
	if !conn.Held {
		t.Fatal("the data plane holds it")
	}
}

func TestSetSecretHashesOnlyTheVerifiableCredential(t *testing.T) {
	svc, fake, env := secretsFixture(t)
	ctx := context.Background()

	if _, err := svc.SetSecret(ctx, env.ID, "APPLICATION_APP_A_CLIENT_SECRET", "chosen"); err != nil {
		t.Fatalf("set application secret: %v", err)
	}
	written := fake.kvWrites["APPLICATION_APP_A_CLIENT_SECRET"]
	if written["kind"] != KindHash || written["value"] != "hashed:chosen" {
		t.Fatalf("the credential must be stored as a hash, got %v", written)
	}

	if _, err := svc.SetSecret(ctx, env.ID, "CONNECTION_CONN_A_CLIENT_SECRET", "provider-issued"); err != nil {
		t.Fatalf("set connection secret: %v", err)
	}
	written = fake.kvWrites["CONNECTION_CONN_A_CLIENT_SECRET"]
	// Hashing this would leave the connection unable to authenticate to the provider.
	if written["kind"] != KindValue || written["value"] != "provider-issued" {
		t.Fatalf("the credential must be stored as is, got %v", written)
	}
}

func TestRegenerateSecretIssuesAValueAndReturnsItOnce(t *testing.T) {
	svc, fake, env := secretsFixture(t)

	entry, value, err := svc.RegenerateSecret(context.Background(), env.ID, "APPLICATION_APP_A_CLIENT_SECRET")
	if err != nil {
		t.Fatalf("regenerate: %v", err)
	}
	if value == "" {
		t.Fatal("the new credential has to be returned, because a hash cannot be read back")
	}
	if !entry.Held {
		t.Fatal("the secret was just written, so it is held")
	}
	written := fake.kvWrites["APPLICATION_APP_A_CLIENT_SECRET"]
	if written["value"] != "hashed:"+value {
		t.Fatalf("the stored hash must be of the returned value, got %v", written)
	}
}

func TestRegenerateSecretRefusesACredentialThatIsReplayed(t *testing.T) {
	svc, _, env := secretsFixture(t)

	// A random value here would simply not be the credential the provider issued.
	_, _, err := svc.RegenerateSecret(context.Background(), env.ID, "CONNECTION_CONN_A_CLIENT_SECRET")
	if !errors.Is(err, ErrValidation) {
		t.Fatalf("expected a validation error, got %v", err)
	}
}

func TestSetSecretRefusesToStoreAVerifiableCredentialWithNoHasher(t *testing.T) {
	svc, fake, env := secretsFixture(t)
	svc.SetSecretHasher(nil)

	// Storing the plaintext where a hash is expected would be read back as the hash itself.
	_, err := svc.SetSecret(context.Background(), env.ID, "APPLICATION_APP_A_CLIENT_SECRET", "chosen")
	if !errors.Is(err, ErrValidation) {
		t.Fatalf("expected a validation error, got %v", err)
	}
	if _, written := fake.kvWrites["APPLICATION_APP_A_CLIENT_SECRET"]; written {
		t.Fatal("nothing may be written when the credential cannot be hashed")
	}
}

func TestSecretKindFallsBackToTheNameWhenTheBundleDoesNotExplainIt(t *testing.T) {
	// A key recorded at capture time whose resource has since left the bundle still has to be settable,
	// and settable as the right kind.
	for name, want := range map[string]string{
		"APPLICATION_APP_A_CLIENT_SECRET": KindHash,
		"USER_ADMIN_PASSWORD":             KindHash,
		"CONNECTION_TWILIO_AUTH_TOKEN":    KindValue,
		"CONNECTION_X_CLIENT_SECRET":      KindValue,
		"NOTIFICATION_SENDER_API_KEY":     KindValue,
	} {
		if got := kindFromName(name); got != want {
			t.Fatalf("%s: expected %q, got %q", name, want, got)
		}
	}
}

// recordingControlPlane records which tenant a promotion wrote into.
type recordingControlPlane struct {
	deploymentID string
	content      string
	variables    map[string]interface{}
}

func (r *recordingControlPlane) Hosts(string) bool { return true }

func (r *recordingControlPlane) Import(_ context.Context, deploymentID string,
	req thunder.ImportRequest) (*thunder.ImportResponse, error) {
	r.deploymentID = deploymentID
	r.content = req.Content
	r.variables = req.Variables
	return &thunder.ImportResponse{}, nil
}

func TestPromoteWritesIntoTheDestinationsOwnTenant(t *testing.T) {
	svc, _, dev := secretsFixture(t)
	cp := &recordingControlPlane{}
	svc.SetLocalControlPlane(cp)

	stage, err := svc.CreateEnvironment(context.Background(), CreateEnvironmentInput{
		Name:   "stage",
		Target: model.Target{DataPlaneID: "dp-b"},
		Source: &model.Source{BaseURL: "https://cp", DeploymentID: "tenant-b"},
	})
	if err != nil {
		t.Fatalf("create stage: %v", err)
	}

	if _, err := svc.Promote(context.Background(), PromoteInput{FromEnvID: dev.ID, ToEnvID: stage.ID}); err != nil {
		t.Fatalf("promote: %v", err)
	}

	// Sending this over HTTP would carry the caller's token, whose tenant is the one promoted from, so
	// the promoted configuration would be written back into the source tenant.
	if cp.deploymentID != "tenant-b" {
		t.Fatalf("expected the promotion to write into tenant-b, got %q", cp.deploymentID)
	}
	if cp.content == "" {
		t.Fatal("the promoted configuration must be written, not just recorded as a version")
	}
}

func TestCaptureIsRefusedForAnEnvironmentFedByPromotion(t *testing.T) {
	svc, _, dev := secretsFixture(t)
	stage, err := svc.CreateEnvironment(context.Background(), CreateEnvironmentInput{
		Name:   "stage",
		Target: model.Target{DataPlaneID: "dp-b"},
		Source: &model.Source{BaseURL: "https://cp", DeploymentID: "tenant-b"},
	})
	if err != nil {
		t.Fatalf("create stage: %v", err)
	}
	_ = dev

	// Capturing here would read whichever tenant the caller's token names and record it as this
	// environment's own state.
	if _, err := svc.CaptureVersion(context.Background(), stage.ID, ""); !errors.Is(err, ErrPromotionFed) {
		t.Fatalf("expected capture to be refused, got %v", err)
	}
}

func TestRevertRestoresTheControlPlaneWithoutSendingCredentials(t *testing.T) {
	svc, _, dev := secretsFixture(t)
	cp := &recordingControlPlane{}
	svc.SetLocalControlPlane(cp)

	// A second version, so there is something to revert away from.
	if _, err := svc.CaptureVersion(context.Background(), dev.ID, "second"); err != nil {
		t.Fatalf("capture: %v", err)
	}

	result, err := svc.Revert(context.Background(), RevertInput{EnvID: dev.ID, ToRef: "previous"})
	if err != nil {
		t.Fatalf("revert: %v", err)
	}

	// The environment is reverted as a whole, so its control plane goes back with the data plane.
	if result.ControlPlane == nil || cp.content == "" {
		t.Fatal("the restored configuration should have been written to the control plane")
	}
	if cp.deploymentID != dev.Source.DeploymentID {
		t.Fatalf("expected the environment's own tenant, got %q", cp.deploymentID)
	}
	// A control plane holds no credential: the field is removed rather than written, so nothing here
	// can replace what the data plane already verifies against.
	if _, present := cp.variables["APPLICATION_APP_A_CLIENT_SECRET"]; present {
		t.Fatal("no credential may be sent to a control plane")
	}
	if strings.Contains(cp.content, "APPLICATION_APP_A_CLIENT_SECRET") {
		t.Fatal("the credential field must be stripped, not left as an unresolved placeholder")
	}
	if !strings.Contains(cp.content, "app-a") {
		t.Fatal("stripping the credential must not take the resource with it")
	}
}

// A pod that cannot reach the data plane answers from what it last reported, rather than failing.
func TestListSecretsFallsBackToWhatTheDataPlaneLastReported(t *testing.T) {
	fake := &fakeClient{secretNames: []string{"APPLICATION_APP_A_CLIENT_SECRET"}}
	svc := newTestService(t, fake)
	env, _ := svc.CreateEnvironment(context.Background(), CreateEnvironmentInput{
		Name: "dev", Target: model.Target{DataPlaneID: "dev-dp"},
	})
	_, _ = svc.store.AddVersion(context.Background(), model.Version{
		EnvID: env.ID, Origin: model.OriginUploaded, CreatedAt: svc.now().UTC(),
		Resources: "resource_type: application\nid: app-a\nname: app-a\n" +
			"clientSecret: {{.APPLICATION_APP_A_CLIENT_SECRET}}",
		SecretKeys: []string{"APPLICATION_APP_A_CLIENT_SECRET"},
	})

	// While the connection is here, the names are recorded.
	if _, err := svc.ListSecrets(context.Background(), env.ID); err != nil {
		t.Fatalf("list with a connection: %v", err)
	}
	stored, _ := svc.store.GetEnvironment(context.Background(), env.ID)
	if len(stored.SecretNames) == 0 || stored.SecretNamesAt.IsZero() {
		t.Fatal("expected the reported credentials to be recorded for other pods")
	}

	// With no connection, the recorded names still answer.
	svc.SetDataPlanes(&fakeDataPlanes{plane: fake, connected: false})
	list, err := svc.ListSecrets(context.Background(), env.ID)
	if err != nil {
		t.Fatalf("expected the recorded names to answer, got %v", err)
	}
	if !list.Checked {
		t.Fatal("expected the listing to report that the credentials are known")
	}
}

// A pod that cannot reach the data plane queues the question rather than reporting the credentials
// as unknown forever, and hands back the job to follow.
func TestListSecretsQueuesTheQuestionWhenThisPodCannotAsk(t *testing.T) {
	fake := &fakeClient{secretNames: []string{"APPLICATION_APP_A_CLIENT_SECRET"}}
	svc := newTestService(t, fake)
	env, _ := svc.CreateEnvironment(context.Background(), CreateEnvironmentInput{
		Name: "dev", Target: model.Target{DataPlaneID: "dev-dp"},
	})
	_, _ = svc.store.AddVersion(context.Background(), model.Version{
		EnvID: env.ID, Origin: model.OriginUploaded, CreatedAt: svc.now().UTC(),
		Resources: "resource_type: application\nid: app-a\nname: app-a\n" +
			"clientSecret: {{.APPLICATION_APP_A_CLIENT_SECRET}}",
		SecretKeys: []string{"APPLICATION_APP_A_CLIENT_SECRET"},
	})

	svc.SetDataPlanes(&fakeDataPlanes{plane: fake, connected: false})
	list, err := svc.ListSecrets(context.Background(), env.ID)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if list.Checked {
		t.Fatal("expected the credentials to be reported as not yet known")
	}
	if list.PendingJobID == "" {
		t.Fatal("expected a job to follow")
	}

	// The pod holding the connection carries it out, which records the answer.
	svc.SetDataPlanes(&fakeDataPlanes{plane: fake, connected: true})
	if err := svc.DeliverNext(context.Background(), "dev-dp"); err != nil {
		t.Fatalf("deliver: %v", err)
	}

	stored, _ := svc.store.GetEnvironment(context.Background(), env.ID)
	if stored.SecretNamesAt.IsZero() || len(stored.SecretNames) != 1 {
		t.Fatalf("expected the answer to be recorded, got %v", stored.SecretNames)
	}

	// With it recorded, the pod that could not ask now answers.
	svc.SetDataPlanes(&fakeDataPlanes{plane: fake, connected: false})
	again, err := svc.ListSecrets(context.Background(), env.ID)
	if err != nil {
		t.Fatalf("second list: %v", err)
	}
	if !again.Checked {
		t.Fatal("expected the recorded answer to be used")
	}
}
