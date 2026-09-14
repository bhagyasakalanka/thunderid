// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package application

import (
	"context"
	"testing"

	"github.com/thunder-id/thunderid/internal/application/model"
	"github.com/thunder-id/thunderid/internal/system/parameterise"
	"github.com/thunder-id/thunderid/pkg/thunderidengine/providers"
)

// withOAuth builds an application carrying one OAuth configuration.
func withOAuth(name string, oauth *providers.OAuthConfigWithSecret) *model.ApplicationDTO {
	return &model.ApplicationDTO{
		Name: name,
		InboundAuthConfig: []providers.InboundAuthConfigWithSecret{
			{Type: "oauth2", OAuthConfig: oauth},
		},
	}
}

// confidentialAuthCode is a client both parameterised fields apply to: it redirects, and it keeps a
// credential.
func confidentialAuthCode() *providers.OAuthConfigWithSecret {
	return &providers.OAuthConfigWithSecret{
		GrantTypes:              []providers.GrantType{providers.GrantTypeAuthorizationCode},
		TokenEndpointAuthMethod: providers.TokenEndpointAuthMethodClientSecretBasic,
	}
}

// realSecret is a value a caller might send, which the parameterised contract refuses.
const realSecret = "a-real-secret"

func parameterisedContext() context.Context {
	return parameterise.WithMode(context.Background())
}

// The placeholder an authored application carries has to be the one a capture of it would derive,
// or the two halves name different variables and the apply leaves it unresolved.
func TestParameteriseInboundAuth_DerivesTheNameACaptureWouldUse(t *testing.T) {
	app := withOAuth("Console", confidentialAuthCode())
	if svcErr := parameteriseInboundAuth(parameterisedContext(), app); svcErr != nil {
		t.Fatal(svcErr.ErrorDescription.DefaultValue)
	}
	oauth := app.InboundAuthConfig[0].OAuthConfig
	if oauth.RedirectURIs[0] != "var:APPLICATION_CONSOLE_REDIRECT_URIS" {
		t.Errorf("redirect placeholder = %q, want the name an export derives", oauth.RedirectURIs[0])
	}
	if oauth.ClientSecret != "sec:APPLICATION_CONSOLE_CLIENT_SECRET" {
		t.Errorf("secret reference = %q, want the name an export derives", oauth.ClientSecret)
	}
}

// The parameterised contract stores a placeholder for the fields it does not accept, so an
// application authored once can be applied to gateways that each resolve their own values.
func TestParameteriseInboundAuth_StoresPlaceholdersForDeploymentFields(t *testing.T) {
	oauth := confidentialAuthCode()
	oauth.ClientID = "my-app"
	app := withOAuth("My App", oauth)

	if svcErr := parameteriseInboundAuth(parameterisedContext(), app); svcErr != nil {
		t.Fatalf("unexpected error: %v", svcErr.ErrorDescription.DefaultValue)
	}

	oauth = app.InboundAuthConfig[0].OAuthConfig
	if len(oauth.RedirectURIs) != 1 || oauth.RedirectURIs[0] != "var:APPLICATION_MY_APP_REDIRECT_URIS" {
		t.Errorf("redirect URIs = %v, want the derived placeholder", oauth.RedirectURIs)
	}
	if oauth.ClientSecret != "sec:APPLICATION_MY_APP_CLIENT_SECRET" {
		t.Errorf("client secret = %q, want the derived reference", oauth.ClientSecret)
	}
	if oauth.ClientID != "my-app" {
		t.Errorf("a field the contract does accept must be left alone, got %q", oauth.ClientID)
	}
}

// A value supplied anyway is refused rather than overwritten: accepting it and discarding it would
// tell the caller their redirect URI was stored when it was not.
func TestParameteriseInboundAuth_RefusesValuesItDoesNotAccept(t *testing.T) {
	for _, tc := range []struct {
		name  string
		oauth *providers.OAuthConfigWithSecret
	}{
		{"a redirect URI", func() *providers.OAuthConfigWithSecret {
			o := confidentialAuthCode()
			o.RedirectURIs = []string{"https://app.example/cb"}
			return o
		}()},
		{"a client secret", func() *providers.OAuthConfigWithSecret {
			o := confidentialAuthCode()
			o.ClientSecret = realSecret
			return o
		}()},
	} {
		app := withOAuth("My App", tc.oauth)
		if svcErr := parameteriseInboundAuth(parameterisedContext(), app); svcErr == nil {
			t.Errorf("%s should be refused on the parameterised contract", tc.name)
		}
	}
}

// An update that sends back what a read returned is not a caller trying to set a value, so the
// placeholders it already carries are accepted.
func TestParameteriseInboundAuth_AcceptsItsOwnPlaceholdersBack(t *testing.T) {
	oauth := confidentialAuthCode()
	oauth.RedirectURIs = []string{"var:APPLICATION_MY_APP_REDIRECT_URIS"}
	oauth.ClientSecret = "sec:APPLICATION_MY_APP_CLIENT_SECRET"
	app := withOAuth("My App", oauth)

	if svcErr := parameteriseInboundAuth(parameterisedContext(), app); svcErr != nil {
		t.Fatalf("a re-submitted parameterised application should be accepted: %v",
			svcErr.ErrorDescription.DefaultValue)
	}
}

// The full contract is untouched: a deployment configuring itself supplies these values, and they
// are stored as given.
func TestParameteriseInboundAuth_LeavesTheFullContractAlone(t *testing.T) {
	oauth := confidentialAuthCode()
	oauth.RedirectURIs = []string{"https://app.example/cb"}
	oauth.ClientSecret = realSecret
	app := withOAuth("My App", oauth)

	if svcErr := parameteriseInboundAuth(context.Background(), app); svcErr != nil {
		t.Fatalf("unexpected error: %v", svcErr.ErrorDescription.DefaultValue)
	}

	oauth = app.InboundAuthConfig[0].OAuthConfig
	if oauth.RedirectURIs[0] != "https://app.example/cb" || oauth.ClientSecret != realSecret {
		t.Error("the full contract must store what it was given")
	}
}

// A placeholder stands in for a value, so it belongs only where a value would. Authoring one that
// the client's own configuration forbids would be invalid on every gateway it reached.
func TestParameteriseInboundAuth_PlacesPlaceholdersOnlyWhereAValueBelongs(t *testing.T) {
	for _, tc := range []struct {
		name            string
		oauth           *providers.OAuthConfigWithSecret
		wantRedirectURI bool
		wantSecret      bool
	}{
		{
			name: "a public browser client redirects but keeps no secret",
			oauth: &providers.OAuthConfigWithSecret{
				GrantTypes:              []providers.GrantType{providers.GrantTypeAuthorizationCode},
				PublicClient:            true,
				TokenEndpointAuthMethod: providers.TokenEndpointAuthMethodNone,
			},
			wantRedirectURI: true,
			wantSecret:      false,
		},
		{
			name: "a confidential client redirects and keeps a secret",
			oauth: &providers.OAuthConfigWithSecret{
				GrantTypes:              []providers.GrantType{providers.GrantTypeAuthorizationCode},
				TokenEndpointAuthMethod: providers.TokenEndpointAuthMethodClientSecretBasic,
			},
			wantRedirectURI: true,
			wantSecret:      true,
		},
		{
			name: "a machine-to-machine client keeps a secret but never redirects",
			oauth: &providers.OAuthConfigWithSecret{
				GrantTypes:              []providers.GrantType{providers.GrantTypeClientCredentials},
				TokenEndpointAuthMethod: providers.TokenEndpointAuthMethodClientSecretBasic,
			},
			wantRedirectURI: false,
			wantSecret:      true,
		},
	} {
		app := withOAuth("My App", tc.oauth)
		if svcErr := parameteriseInboundAuth(parameterisedContext(), app); svcErr != nil {
			t.Fatalf("%s: %v", tc.name, svcErr.ErrorDescription.DefaultValue)
		}
		oauth := app.InboundAuthConfig[0].OAuthConfig

		if got := len(oauth.RedirectURIs) > 0; got != tc.wantRedirectURI {
			t.Errorf("%s: redirect placeholder present = %v, want %v", tc.name, got, tc.wantRedirectURI)
		}
		if got := oauth.ClientSecret != ""; got != tc.wantSecret {
			t.Errorf("%s: secret reference present = %v, want %v", tc.name, got, tc.wantSecret)
		}
	}
}
