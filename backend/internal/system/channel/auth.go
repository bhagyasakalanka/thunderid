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

package channel

import (
	"crypto/subtle"
	"net/http"
	"strings"
)

// HeaderDataPlaneID is the request header the Data Plane sends its id in during the handshake.
const HeaderDataPlaneID = "X-Data-Plane-ID"

// Verifier authenticates an inbound Data Plane handshake request. Implementations must not mutate r.
// Token implementations are provided; an mTLS implementation can be added later without changing the
// channel server.
//
// Verify returns the Data Plane id the request proved it is, or "" when the credential says nothing
// about identity. A shared token says nothing: every Data Plane presents the same one, so the server
// has to take the id the client claims in its header and any holder of the token can claim any id. A
// per-Data-Plane token does say something, and the server uses that instead.
type Verifier interface {
	Verify(r *http.Request) (string, error)
}

// bearerToken reads the token from the Authorization header.
func bearerToken(r *http.Request) string {
	return strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
}

// tokenVerifier checks a shared bearer token presented in the Authorization header.
type tokenVerifier struct {
	token string
}

// newTokenVerifier builds a Verifier that compares against the configured shared token.
func newTokenVerifier(token string) *tokenVerifier {
	return &tokenVerifier{token: token}
}

// Verify returns nil when the request carries the configured bearer token, errAuthNotConfigured when
// no token is configured, and errUnauthorized otherwise. The comparison is constant-time.
//
// The identity is empty because a shared token proves none: the caller falls back to the id the Data
// Plane claims for itself.
func (v *tokenVerifier) Verify(r *http.Request) (string, error) {
	if v.token == "" {
		return "", errAuthNotConfigured
	}
	got := bearerToken(r)
	if got == "" || subtle.ConstantTimeCompare([]byte(got), []byte(v.token)) != 1 {
		return "", errUnauthorized
	}
	return "", nil
}

// perDataPlaneTokenVerifier checks a token issued to one named Data Plane.
//
// This is what makes the handshake say who connected rather than take the client's word for it. With
// one token shared by every Data Plane, any holder can claim another's id, evict its connection and
// receive every command meant for it. Here a claim is only accepted when it comes with that Data
// Plane's own token, so a compromised deployment can impersonate nothing but itself.
type perDataPlaneTokenVerifier struct {
	tokens map[string]string
}

// newPerDataPlaneTokenVerifier builds a Verifier over a Data-Plane-id to token mapping.
func newPerDataPlaneTokenVerifier(tokens map[string]string) *perDataPlaneTokenVerifier {
	copied := make(map[string]string, len(tokens))
	for id, token := range tokens {
		copied[id] = token
	}
	return &perDataPlaneTokenVerifier{tokens: copied}
}

// Verify returns the id the request authenticated as. The claimed id selects which token must be
// presented, and proving it is what authenticates the claim, so an id with no token configured is
// refused rather than falling back to any other.
func (v *perDataPlaneTokenVerifier) Verify(r *http.Request) (string, error) {
	if len(v.tokens) == 0 {
		return "", errAuthNotConfigured
	}
	claimed := r.Header.Get(HeaderDataPlaneID)
	if claimed == "" {
		return "", errMissingDataPlaneID
	}
	want, ok := v.tokens[claimed]
	got := bearerToken(r)
	// The comparison runs whether or not the id is known, so a wrong id and a wrong token fail the
	// same way rather than the first being distinguishable by how quickly it is rejected.
	matched := subtle.ConstantTimeCompare([]byte(got), []byte(want)) == 1
	if !ok || want == "" || got == "" || !matched {
		return "", errUnauthorized
	}
	return claimed, nil
}
