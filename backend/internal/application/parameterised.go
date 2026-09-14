// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package application

import (
	"context"

	"github.com/thunder-id/thunderid/internal/application/model"
	"github.com/thunder-id/thunderid/internal/system/parameterise"
	"github.com/thunder-id/thunderid/internal/system/varname"
	tidcommon "github.com/thunder-id/thunderid/pkg/thunderidengine/common"
	"github.com/thunder-id/thunderid/pkg/thunderidengine/providers"
)

// resourceType names applications when deriving the variable a placeholder carries.
const resourceType = "application"

// The fields a parameterised application does not carry a value for. A redirect URI is where one
// deployment sends its users and a client secret is one deployment's credential; neither is a
// property of the application being designed.
//
// They are spelled as the serialized field, not as the Go field, because that is what an export
// derives its placeholder from: "RedirectURIs" yields REDIRECT_UR_IS, which would name a variable no
// captured state ever refers to, and the mismatch would only surface as an unresolved placeholder at
// apply time.
const (
	varFieldRedirectURIs = "redirectUris"
	varFieldClientSecret = "clientSecret"
)

// parameteriseInboundAuth replaces the deployment-specific parts of an application's OAuth
// configuration with the placeholders that stand for them.
//
// This is the difference between the two contracts. The full API takes a redirect URI and a client
// secret as values, because it is configuring one running deployment. The parameterised API does not
// accept them at all: what is authored here is applied to many gateways, so a value given now would
// be a value wrong everywhere except where it came from. The placeholder is put in instead, and the
// gateway resolves it from what it holds at apply time.
//
// A value supplied anyway is refused rather than overwritten. Silently replacing it would tell the
// caller their redirect URI was accepted when it had in fact been discarded.
func parameteriseInboundAuth(ctx context.Context, app *model.ApplicationDTO) *tidcommon.ServiceError {
	if !parameterise.Enabled(ctx) || app == nil {
		return nil
	}

	for i := range app.InboundAuthConfig {
		oauth := app.InboundAuthConfig[i].OAuthConfig
		if oauth == nil {
			continue
		}

		if len(oauth.RedirectURIs) > 0 && !allReferences(oauth.RedirectURIs) {
			return &ErrorRedirectURIsNotAcceptedWhenParameterised
		}
		if oauth.ClientSecret != "" && !varname.IsReference(oauth.ClientSecret) {
			return &ErrorClientSecretNotAcceptedWhenParameterised
		}

		// A placeholder stands in for a value, so it belongs exactly where a value would. A client
		// that takes no redirect URI does not get a placeholder for one, and a public client, which
		// must not carry a secret at all, does not get a reference to one: putting them in
		// unconditionally would author configuration that is invalid on every gateway it reaches.
		if usesRedirectURIs(oauth) {
			oauth.RedirectURIs = []string{varname.VariableReference(
				varname.DeriveVariableName(resourceType, app.Name, varFieldRedirectURIs))}
		}
		if holdsClientSecret(oauth) {
			oauth.ClientSecret = varname.SecretReference(
				varname.DeriveVariableName(resourceType, app.Name, varFieldClientSecret))
		}
	}
	return nil
}

// usesRedirectURIs reports whether this client is one a redirect URI applies to. Only the
// authorization code grant redirects, so a machine-to-machine client has none to stand in for.
func usesRedirectURIs(oauth *providers.OAuthConfigWithSecret) bool {
	for _, grant := range oauth.GrantTypes {
		if grant == providers.GrantTypeAuthorizationCode {
			return true
		}
	}
	return false
}

// holdsClientSecret reports whether this client is one that has a credential at all. A public client
// cannot keep a secret, and "none" states that it does not authenticate with one.
func holdsClientSecret(oauth *providers.OAuthConfigWithSecret) bool {
	return !oauth.PublicClient &&
		oauth.TokenEndpointAuthMethod != providers.TokenEndpointAuthMethodNone
}

// allReferences reports whether every entry is already a reference, which is what a re-submitted
// parameterised application carries: an update that sends back what a read returned is not a caller
// trying to set a value.
func allReferences(values []string) bool {
	for _, value := range values {
		if !varname.IsReference(value) {
			return false
		}
	}
	return len(values) > 0
}
