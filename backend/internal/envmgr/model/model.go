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

// Package model holds the core domain types for the environment-management service.
package model

import (
	"strings"
	"time"
)

// Origin describes how a version came to exist.
type Origin string

const (
	// OriginCaptured means the version was captured from an environment's control-plane source.
	OriginCaptured Origin = "captured"
	// OriginPromoted means the version was produced by promoting from a lower environment.
	OriginPromoted Origin = "promoted"
	// OriginReverted means the version was produced by reverting to an earlier version.
	OriginReverted Origin = "reverted"
	// OriginUploaded means the version's payload was supplied directly by the caller.
	OriginUploaded Origin = "uploaded"
)

// Credentials describes how to authenticate to a ThunderID server.
//
// Prefer ClientID and ClientSecret: the service exchanges them for an access token through the
// client_credentials grant (presented as HTTP Basic auth at the token endpoint) and refreshes it as
// it expires. A static Token is also accepted, but it is only practical for short-lived manual
// testing because it expires and cannot be renewed.
type Credentials struct {
	Token        string `json:"token,omitempty"`
	ClientID     string `json:"clientId,omitempty"`
	ClientSecret string `json:"clientSecret,omitempty"`
	// TokenURL overrides the token endpoint. Defaults to <baseUrl>/oauth2/token.
	TokenURL string `json:"tokenUrl,omitempty"`
	Scope    string `json:"scope,omitempty"`
	// Resource is the RFC 8707 resource indicator naming the resource server the token is for.
	// ThunderID requires it (or a configured default resource server) to issue a scoped token.
	Resource string `json:"resource,omitempty"`
}

// Target identifies a data plane that a version is applied to.
type Target struct {
	BaseURL string `json:"baseUrl"`
	// Credentials is embedded so its fields stay flat in the stored and API JSON.
	Credentials
	// SecretProvider is the service holding the secrets this data plane resolves. Naming it lets an
	// apply check that every credential the configuration needs is present beforehand, rather than
	// discovering a missing one when a login fails.
	SecretProvider     *SecretProviderEndpoint `json:"secretProvider,omitempty"`
	InsecureSkipVerify bool                    `json:"insecureSkipVerify,omitempty"`
}

// SecretEndpoint returns where this data plane's secrets are held, along with the credentials and TLS
// setting for reaching it.
//
// A data plane serves its own store, so naming a separate service is only needed when the secrets
// live somewhere else. With none named, the store on the data plane itself is used, reached with the
// same credentials an apply already uses: it sits behind that server's management API, so there is no
// second set to configure.
func (t Target) SecretEndpoint() (string, Credentials, bool) {
	if t.SecretProvider != nil && strings.TrimSpace(t.SecretProvider.BaseURL) != "" {
		return t.SecretProvider.BaseURL,
			Credentials{Token: t.SecretProvider.Token},
			t.SecretProvider.InsecureSkipVerify
	}
	// The store is a path on the data plane, not a server of its own, so the token endpoint has to be
	// named explicitly: a client that derived one from the base it is given would ask the store's own
	// path for a token and be turned away unauthenticated.
	creds := t.Credentials
	if creds.ClientID != "" && strings.TrimSpace(creds.TokenURL) == "" {
		creds.TokenURL = strings.TrimRight(t.BaseURL, "/") + "/oauth2/token"
	}
	return strings.TrimRight(t.BaseURL, "/") + "/secret-store", creds, t.InsecureSkipVerify
}

// SecretProviderEndpoint locates a data plane's secret service.
type SecretProviderEndpoint struct {
	BaseURL            string `json:"baseUrl"`
	Token              string `json:"token,omitempty"`
	InsecureSkipVerify bool   `json:"insecureSkipVerify,omitempty"`
}

// Source identifies a control plane that config is captured from.
type Source struct {
	BaseURL string `json:"baseUrl"`
	Credentials
	// DeploymentID is the tenant this environment's configuration lives in. It is fixed when the
	// environment is registered and there is no way to change it afterwards, because it is the sole
	// authority for which tenant a promotion into this environment may write to.
	DeploymentID       string `json:"deploymentId,omitempty"`
	InsecureSkipVerify bool   `json:"insecureSkipVerify,omitempty"`
}

// Environment is a node in the promotion graph, bound to one data-plane target and an optional
// control-plane source that config is captured from.
type Environment struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	// Rank orders environments for display, lowest first. It no longer defines the promotion path.
	Rank int `json:"rank"`
	// PromotesTo lists the environments this one can promote into: the outgoing edges of the
	// promotion graph, which is a DAG. An environment can fan out to several (a shared dev promoting
	// to both eu-prod and us-prod) and can be fanned into by several (a prod gated behind both qa and
	// staging). When empty, the edge falls back to the next environment by rank, which keeps a simple
	// linear chain working without declaring edges.
	PromotesTo []string `json:"promotesTo,omitempty"`
	Target     Target   `json:"target"`
	Source     *Source  `json:"source,omitempty"`
	// Excluded lists resource keys a user chose not to promote into this environment. The choice is
	// remembered rather than asked again on every run: a resource held back once stays held back until
	// it is deliberately selected again, at which point it is dropped from this list and promotes from
	// then on. A key here is skipped by both promotion and apply.
	Excluded []string `json:"excluded,omitempty"`
	// AppliedSeq is the version sequence last applied to Target (0 when nothing has been applied).
	AppliedSeq int       `json:"appliedSeq"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// Version is an immutable snapshot of an environment's declarative configuration. The parameterized
// resource YAML and the externalized variable values are stored alongside the metadata.
type Version struct {
	Seq         int               `json:"seq"`
	EnvID       string            `json:"envId"`
	Origin      Origin            `json:"origin"`
	ParentSeq   int               `json:"parentSeq,omitempty"`
	SourceEnvID string            `json:"sourceEnvId,omitempty"`
	SourceSeq   int               `json:"sourceSeq,omitempty"`
	Note        string            `json:"note,omitempty"`
	CreatedAt   time.Time         `json:"createdAt"`
	Resources   string            `json:"resources,omitempty"`
	Variables   map[string]string `json:"variables,omitempty"`
	// SecretKeys are the placeholders backed by a secret. Their values are deliberately absent: an
	// apply sends a ${KEY} placeholder for each, leaving the data plane to supply the real value, so
	// secrets never pass through this service.
	SecretKeys []string `json:"secretKeys,omitempty"`
}
