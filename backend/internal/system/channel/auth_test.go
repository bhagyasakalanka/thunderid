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
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestTokenVerifierAcceptsMatchingBearer(t *testing.T) {
	v := newTokenVerifier("s3cret")
	r := httptest.NewRequest(http.MethodGet, "/cp/connect", nil)
	r.Header.Set("Authorization", "Bearer s3cret")
	assert.NoError(t, v.Verify(r))
}

func TestTokenVerifierRejectsWrongOrMissingBearer(t *testing.T) {
	v := newTokenVerifier("s3cret")

	r := httptest.NewRequest(http.MethodGet, "/cp/connect", nil)
	r.Header.Set("Authorization", "Bearer nope")
	assert.ErrorIs(t, v.Verify(r), errUnauthorized)

	r2 := httptest.NewRequest(http.MethodGet, "/cp/connect", nil)
	assert.ErrorIs(t, v.Verify(r2), errUnauthorized)
}

func TestTokenVerifierRejectsWhenNotConfigured(t *testing.T) {
	v := newTokenVerifier("")
	r := httptest.NewRequest(http.MethodGet, "/cp/connect", nil)
	r.Header.Set("Authorization", "Bearer anything")
	assert.ErrorIs(t, v.Verify(r), errAuthNotConfigured)
}
