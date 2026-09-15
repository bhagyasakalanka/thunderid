// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

// Package dataplane runs identity for end users: it authenticates them, executes flows, and issues
// tokens. It is the whole product minus the authoring surface, which is why a deployment that wants
// one server runs this one.
//
// Everything reachable only at runtime is linked here and nowhere else. A control plane binary does
// not import this package, so it does not contain an authorization endpoint to protect, an issuer to
// misconfigure, or a token to leak.
package dataplane

import (
	"context"
	"fmt"

	"github.com/thunder-id/thunderid/internal/attestation"
	"github.com/thunder-id/thunderid/internal/authn"
	"github.com/thunder-id/thunderid/internal/authzen"
	"github.com/thunder-id/thunderid/internal/flow/flowexec"
	"github.com/thunder-id/thunderid/internal/oauth"
	"github.com/thunder-id/thunderid/internal/oauth/oauth2/dcr"
	"github.com/thunder-id/thunderid/internal/openid4vci"
	"github.com/thunder-id/thunderid/internal/server"
)

// Plane describes the data plane to the server that runs it.
//
// It serves the Gate, because it is the plane an end user authenticates against, and the Console,
// because a data plane is administered in its own right.
func Plane() server.Plane {
	return server.Plane{
		Name:       "data plane",
		StaticApps: []string{"gate", "console"},
		Wire:       wire,
	}
}

// wire mounts the runtime surfaces on top of the services every plane builds.
func wire(_ context.Context, svcs *server.Services) error {
	_, directAuthGuard := authn.Initialize(svcs.Mux, svcs.MCPServer, svcs.IDPService, svcs.JWTService,
		svcs.AuthnProvider, svcs.AuthAssertGen, svcs.OTPService, svcs.NotifSenderSvc,
		svcs.TemplateService, svcs.MagicLinkService, svcs.OAuthAuthnService, svcs.OIDCAuthnService,
		svcs.GoogleAuthnService, svcs.GitHubAuthnService, svcs.DirectAuthSecret)

	// AuthZEN access-evaluation endpoints are Direct API endpoints, so they reuse the Direct Auth
	// guard created by the authn service.
	authzen.Initialize(svcs.Mux, svcs.AuthZService, svcs.EntityProvider, svcs.ResourceService,
		directAuthGuard)

	attestationProvider, err := attestation.Initialize(svcs.RuntimeCryptoSvc)
	if err != nil {
		return fmt.Errorf("failed to initialize attestation provider: %w", err)
	}

	flowExecService, err := flowexec.Initialize(svcs.Mux, svcs.FlowMgtService, svcs.ActorProvider,
		svcs.ExecRegistry, svcs.InterceptorRegistry, svcs.ObservabilitySvc, svcs.RuntimeCryptoSvc,
		attestationProvider, svcs.GraphBuilder, svcs.JWTService, svcs.RuntimeStoreProvider,
		svcs.Transactioner, svcs.ServerConfigService, svcs.FlowConfig)
	if err != nil {
		return fmt.Errorf("failed to initialize flow execution service: %w", err)
	}

	tokenValidator, err := oauth.Initialize(svcs.Mux, svcs.ActorProvider, svcs.AuthnProvider,
		svcs.JWTService, svcs.JWEService, flowExecService, svcs.ObservabilitySvc,
		svcs.RuntimeCryptoSvc, svcs.OUService, svcs.AttributeCacheService, svcs.AuthZService,
		svcs.ResourceServerProvider, svcs.I18nService, svcs.IDPService, svcs.DPoPVerifier,
		svcs.RuntimeStoreProvider, svcs.Transactioner, svcs.RevocationEnforcer, svcs.RevocationSvc,
		svcs.SessionService, svcs.FlowMgtService, svcs.OAuthCfg)
	if err != nil {
		return fmt.Errorf("failed to initialize OAuth services: %w", err)
	}

	// Initialized after the OAuth services because credential issuance validates the presented
	// access token with the OAuth token validator and resolves the wallet application behind it.
	if _, err := openid4vci.Initialize(svcs.Mux, svcs.RuntimeCryptoSvc, tokenValidator,
		svcs.UserService, svcs.DPoPVerifier, svcs.OpenID4VCICredSvc, svcs.ActorProvider,
		svcs.RuntimeStoreProvider); err != nil {
		return fmt.Errorf("failed to initialize OpenID4VCI issuer service: %w", err)
	}

	if svcs.OAuthCfg.OAuth.DCR.IsEnabled() {
		if err := dcr.Initialize(svcs.Mux, svcs.ApplicationService, svcs.OUService, svcs.I18nService,
			svcs.OAuthCfg); err != nil {
			return fmt.Errorf("failed to initialize OAuth2 DCR service: %w", err)
		}
	}

	return nil
}
