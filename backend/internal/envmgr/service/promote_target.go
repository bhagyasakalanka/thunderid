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
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"strings"

	"github.com/thunder-id/thunderid/internal/envmgr/bundle"
	"github.com/thunder-id/thunderid/internal/envmgr/model"
	"github.com/thunder-id/thunderid/internal/envmgr/thunder"
	"github.com/thunder-id/thunderid/internal/system/secretresolver"
)

// credentialsByKind splits a bundle's credentials into the ones a control plane can be written without
// and the ones it cannot.
//
// A credential that is only ever verified, such as a password or an application's client secret, is
// left out of the document altogether: the control plane cannot produce the hash, and the resource is
// valid without one.
//
// A credential the data plane replays to a third party cannot be left out, because the resource that
// holds it requires it: a connection with no client secret and a Twilio sender with no auth token are
// both rejected as invalid. Those are written as a reference to the name the credential is held under,
// which names a secret rather than being one. Capture skips a reference, so the data plane keeps the
// value it already holds.
func credentialsByKind(resources []bundle.Resource, secretKeys []string) (omitted, referenced []string) {
	wanted := make(map[string]bool, len(secretKeys))
	for _, name := range secretKeys {
		wanted[name] = true
	}

	seen := map[string]bool{}
	for _, resource := range resources {
		for _, placeholder := range bundle.SecretPlaceholders(resource.Content) {
			if !wanted[placeholder.Name] || seen[placeholder.Name] {
				continue
			}
			seen[placeholder.Name] = true
			if kindOf(resource.Type, placeholder.Field) == KindHash {
				omitted = append(omitted, placeholder.Name)
				continue
			}
			referenced = append(referenced, placeholder.Name)
		}
	}
	return omitted, referenced
}

// ControlPlaneRequest builds the import a control plane is written with, from a raw bundle. It
// carries no deletions: the caller that seeds a brand new tenant has nothing there to remove.
//
// It is exported for the one caller that has a bundle without an environment behind it: seeding a
// brand new tenant from a live export of the one it is copied from, when that source has no captured
// version yet. Both paths must treat credentials identically, so they share this.
func ControlPlaneRequest(resources string, values map[string]string,
	secretKeys []string) thunder.ImportRequest {
	return controlPlaneRequest(bundle.Parse(resources), values, secretKeys)
}

// controlPlaneRequest builds the import a control plane is written with: the configuration, and no
// credential of any kind. See credentialsByKind for how the two kinds are each kept out.
func controlPlaneRequest(resources []bundle.Resource, values map[string]string,
	secretKeys []string) thunder.ImportRequest {
	omitted, referenced := credentialsByKind(resources, secretKeys)
	content := bundle.StripCredentialLines(bundle.Marshal(resources), omitted)
	vars := bundle.BuildTemplateVariables(content, values, nil)
	for _, name := range referenced {
		vars[name] = secretresolver.Prefix + name
	}
	return thunder.ImportRequest{Content: content, Variables: vars}
}

// SeedTenant writes an organization's existing configuration into a newly created tenant, so a second
// environment starts as a copy of the first rather than as an independently provisioned baseline.
//
// This is what makes configuration promotable between an organization's environments. A tenant
// provisioned from the bootstrap bundle builds its own organization unit, user types and themes, and
// they are the same resources under different ids; anything promoted in then either collides with them
// or refers to ids the destination does not have. Seeding from the source instead means both tenants
// agree on every id from the outset.
//
// The source is named by the tenant it manages rather than by environment id, because the caller is
// creating a tenant and knows nothing of this service's environments.
func (s *Service) SeedTenant(ctx context.Context, sourceDeploymentID,
	targetDeploymentID string) (*thunder.ImportResponse, error) {
	env, ok := s.EnvironmentForTenant(sourceDeploymentID)
	if !ok {
		return nil, fmt.Errorf("%w: no environment manages tenant %s", ErrNotFound, sourceDeploymentID)
	}
	seq, err := s.resolveSeq(env, "latest")
	if err != nil {
		return nil, err
	}
	if seq == 0 {
		return nil, fmt.Errorf("%w: %s has no captured version to seed from", ErrNoVersions, env.Name)
	}
	version, err := s.store.GetVersion(env.ID, seq)
	if err != nil {
		return nil, err
	}

	local := s.localCP
	if local == nil {
		return nil, fmt.Errorf("this service hosts no control plane, so a tenant cannot be seeded")
	}
	resp, err := local.Import(ctx, targetDeploymentID,
		controlPlaneRequest(bundle.Parse(version.Resources), version.Variables, secretKeysOf(version)))
	if err != nil {
		return nil, fmt.Errorf("seeding tenant %s from %s failed: %w", targetDeploymentID, env.Name, err)
	}
	return resp, nil
}

// EnvironmentForTenant finds the environment whose control plane is the given tenant.
func (s *Service) EnvironmentForTenant(deploymentID string) (model.Environment, bool) {
	deploymentID = strings.TrimSpace(deploymentID)
	if deploymentID == "" {
		return model.Environment{}, false
	}
	for _, env := range s.store.ListEnvironments() {
		if env.Source != nil && strings.EqualFold(strings.TrimSpace(env.Source.DeploymentID), deploymentID) {
			return env, true
		}
	}
	return model.Environment{}, false
}

// targetSecretOutcome reports what a promote did about the destination's credentials.
type targetSecretOutcome struct {
	// Generated and Reused are kept for compatibility with the previous shape. A promote no longer
	// touches credentials at all, so nothing is reported in either.
	Generated []string `json:"generated"`
	Reused    []string `json:"reused"`
	// Skipped names the credentials the destination has to hold for the promoted configuration to work.
	// They are set against the destination's own data plane, which is the only place they live.
	Skipped []string `json:"skipped"`
}

// No credential named in secretKeys is written. A control plane holds none of its own: the data plane's
// secret service is where they live, and it is where an operator sets them. Writing one here would also
// propagate it to that data plane through capture, replacing a working credential with one this service
// invented.
// The deletions are what the tenant holds that this configuration no longer describes. Without them
// a write is upsert-only, so restoring an earlier version would add and update but leave everything
// created since in place, and the tenant would match neither version.
func (s *Service) importIntoTargetControlPlane(ctx context.Context, env model.Environment,
	resources []bundle.Resource, values map[string]string, secretKeys []string,
	deletions []thunder.ResourceDeletion) (*thunder.ImportResponse, error) {
	if env.Source == nil || strings.TrimSpace(env.Source.BaseURL) == "" {
		return nil, nil
	}

	req := controlPlaneRequest(resources, values, secretKeys)
	req.Deletions = deletions

	// The tenant is the one recorded on the environment when it was registered, read from the store
	// rather than from anything the caller supplied, and it is the only tenant this write may reach.
	//
	// Sending it over HTTP instead would carry the caller's own token, whose tenant is wherever the
	// promotion was started from, so a promote into another tenant would quietly write back into the
	// one it came from.
	if local := s.localCP; local != nil && local.Hosts(env.Source.BaseURL) {
		tenant := strings.TrimSpace(env.Source.DeploymentID)
		if tenant == "" {
			return nil, fmt.Errorf("%w: %s names no tenant, so there is nowhere to promote it into; "+
				"the tenant is fixed when the environment is registered", ErrValidation, env.Name)
		}
		resp, err := local.Import(ctx, tenant, req)
		if err != nil {
			return nil, fmt.Errorf("import into the target control plane failed: %w", err)
		}
		return resp, nil
	}

	client := s.newClient(env.Source.BaseURL, callerCredentials(ctx), env.Source.InsecureSkipVerify)
	resp, err := client.Import(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("import into the target control plane failed: %w", err)
	}
	return resp, nil
}

// generateSecretValue produces a fresh high-entropy credential.
func generateSecretValue() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("failed to generate a secret: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}
