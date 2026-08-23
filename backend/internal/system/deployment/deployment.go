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

// Package deployment carries the per-request deployment identifier used to scope persistence.
//
// The deployment id partitions every stored resource by the DEPLOYMENT_ID column. By default it is
// the server-configured identifier, which is what a server holding one deployment's data wants.
//
// A process that holds many deployments' data instead reads the id from a claim in the caller's
// token, by calling UseTokenClaim at start-up. That is a property of the binary rather than of a
// configuration file: a runtime serves exactly one deployment and must never be talked into scoping
// a request by whatever an end user's token happens to claim, so the choice is not left where it
// could be set wrongly.
package deployment

import (
	"context"
	"errors"
	"strings"
	"sync/atomic"

	"github.com/thunder-id/thunderid/internal/system/config"
)

// ctxKey is the private context key under which the per-request deployment id is stored.
type ctxKey struct{}

// WithID returns a context carrying the given deployment id. An empty id is ignored so callers can
// pass an unconditionally-extracted claim without having to branch on its presence.
func WithID(ctx context.Context, id string) context.Context {
	if id == "" {
		return ctx
	}
	return context.WithValue(ctx, ctxKey{}, id)
}

// fromContext returns the deployment id carried by the context, if any.
func fromContext(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(ctxKey{}).(string)
	return id, ok && id != ""
}

// Resolve returns the deployment id a store should scope by for this request.
//
//   - A context carrying an id wins, whichever way this process reads it.
//   - Otherwise, a process reading the id from the server configuration uses the supplied fallback,
//     the store's own configured identifier, so its behavior is exactly what it was.
//   - A process reading the id from a token claim does not fall back to the configured identifier:
//     that is the point of reading from the token. Requests always carry the id, because the security
//     layer refuses an authenticated request whose token lacks the claim, so reaching this branch
//     means a background operation that must name its deployment with WithID. The empty id surfaces
//     that rather than silently scoping to the wrong one.
func Resolve(ctx context.Context, fallback string) string {
	if id, ok := fromContext(ctx); ok {
		return id
	}
	if _, ok := TokenClaim(); ok {
		return ""
	}
	return fallback
}

// ResolveDefault returns the deployment id for the request using the server-configured identifier as
// the fallback, the same value stores resolve to. It is for callers that scope by the deployment id
// but have no configured value of their own, such as the cache layer. Where the id comes from a token
// claim, a context carrying none returns an empty string, matching Resolve.
func ResolveDefault(ctx context.Context) string {
	if id, ok := fromContext(ctx); ok {
		return id
	}
	if _, ok := TokenClaim(); ok {
		return ""
	}
	if config.IsServerRuntimeInitialized() {
		return config.GetServerRuntime().Config.Server.Identifier
	}
	return ""
}

// tokenClaim names the token claim this process reads the deployment id from. Empty means it reads
// the server-configured identifier instead, which is the default.
var tokenClaim atomic.Value

// UseTokenClaim makes this process read each request's deployment id from the named token claim,
// rather than from the server configuration. A control plane calls it at start-up.
//
// The claim name is a parameter rather than a package constant because the authorization server that
// issues these tokens is not always this one, and its claim naming is its own. It is required: there
// is no way to ask for a token-derived id without saying which claim carries it, so a process cannot
// end up expecting a claim it never named.
func UseTokenClaim(claim string) error {
	name := strings.TrimSpace(claim)
	if name == "" {
		return errors.New("a token claim name is required to read the deployment id from a token")
	}
	tokenClaim.Store(name)
	return nil
}

// UseServerIdentifier restores the default, where the deployment id comes from the server
// configuration. It exists for tests that switch a process over and have to switch it back.
func UseServerIdentifier() {
	tokenClaim.Store("")
}

// TokenClaim returns the claim this process reads the deployment id from, and whether it reads one
// at all. A process using the server-configured identifier reports false.
func TokenClaim() (string, bool) {
	name, _ := tokenClaim.Load().(string)
	return name, name != ""
}

// IDFromContext reports the token-derived deployment id when the request carries one. It returns
// false for requests with no deployment claim (single-tenant, or non-request/background contexts),
// letting callers that must fail closed distinguish "tenant scoped" from "unscoped".
func IDFromContext(ctx context.Context) (string, bool) {
	return fromContext(ctx)
}

// OrganizationOf returns the organization a deployment id belongs to.
//
// A deployment id names a gateway as "<org>:<gateway>", and everything an organization owns across
// its gateways - the gateways themselves, their variables, its registry row - is partitioned under
// the organization rather than under any one gateway. An id naming no organization is its own
// organization, which is what a single-tenant deployment has.
func OrganizationOf(id string) string {
	org, _, found := strings.Cut(id, ":")
	if !found || strings.TrimSpace(org) == "" {
		return id
	}
	return org
}
