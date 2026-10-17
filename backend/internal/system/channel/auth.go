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
// A token implementation is provided; an mTLS implementation can be added later without changing the
// channel server.
type Verifier interface {
	Verify(r *http.Request) error
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
func (v *tokenVerifier) Verify(r *http.Request) error {
	if v.token == "" {
		return errAuthNotConfigured
	}
	got := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
	if got == "" || subtle.ConstantTimeCompare([]byte(got), []byte(v.token)) != 1 {
		return errUnauthorized
	}
	return nil
}
