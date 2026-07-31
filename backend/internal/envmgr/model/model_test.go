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

package model

import "testing"

func TestSecretEndpointNamesTheDataPlanesTokenEndpoint(t *testing.T) {
	target := Target{
		BaseURL:     "https://localhost:8090",
		Credentials: Credentials{ClientID: "envmgr", ClientSecret: "envmgr-secret"},
	}

	url, creds, _ := target.SecretEndpoint()

	if url != "https://localhost:8090/secret-store" {
		t.Fatalf("unexpected endpoint %q", url)
	}
	// The store is a path on the data plane, so a token URL derived from that path would be asked of
	// the store itself and refused, leaving every credential reported as unreachable.
	if creds.TokenURL != "https://localhost:8090/oauth2/token" {
		t.Fatalf("expected the data plane's own token endpoint, got %q", creds.TokenURL)
	}
}

func TestSecretEndpointKeepsAConfiguredTokenEndpoint(t *testing.T) {
	target := Target{
		BaseURL: "https://localhost:8090",
		Credentials: Credentials{
			ClientID: "envmgr", ClientSecret: "envmgr-secret",
			TokenURL: "https://sso.example.com/token",
		},
	}

	_, creds, _ := target.SecretEndpoint()

	if creds.TokenURL != "https://sso.example.com/token" {
		t.Fatalf("a configured token endpoint must win, got %q", creds.TokenURL)
	}
}

func TestSecretEndpointPrefersASeparateSecretService(t *testing.T) {
	target := Target{
		BaseURL:        "https://localhost:8090",
		Credentials:    Credentials{ClientID: "envmgr", ClientSecret: "envmgr-secret"},
		SecretProvider: &SecretProviderEndpoint{BaseURL: "https://kv.example.com", Token: "static"},
	}

	url, creds, _ := target.SecretEndpoint()

	// A separate service holds the secrets and guards itself with its own token, so neither the data
	// plane's address nor its client credentials apply.
	if url != "https://kv.example.com" || creds.Token != "static" || creds.ClientID != "" {
		t.Fatalf("unexpected endpoint %q with credentials %+v", url, creds)
	}
}
