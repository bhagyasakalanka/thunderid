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
	"fmt"
	"strings"
)

// CaptureSecretForTenant relays a secret the control plane captured to the secret provider of every
// environment of the organization it was created in.
//
// A credential is created once, in the organization's single workspace, but no control plane holds
// one: they live in each data plane's own store. Every environment therefore needs its own copy, so
// that the resource works there as soon as the configuration referring to it is applied. Sending it
// only where that configuration has already reached would leave the credential missing on whichever
// environment it is promoted to next, which surfaces as a login that rejects every attempt.
//
// It returns how many providers received the secret. Zero with no error means the organization has no
// environment registered yet, which the caller treats as "nothing to do" rather than a failure:
// secrets created before an environment exists are recreated on promote.
func (s *Service) CaptureSecretForTenant(ctx context.Context, deploymentID, name string,
	body map[string]interface{}) (int, error) {
	if strings.TrimSpace(deploymentID) == "" || strings.TrimSpace(name) == "" {
		return 0, fmt.Errorf("%w: a deployment id and a secret name are required", ErrValidation)
	}

	envs, err := s.store.ListEnvironments(ctx)
	if err != nil {
		return 0, err
	}

	delivered := 0
	for _, env := range envs {
		if _, err := s.queueSecret(ctx, env, name, body); err != nil {
			return delivered, fmt.Errorf("failed to store the secret for %s: %w", env.Name, err)
		}
		delivered++
	}
	return delivered, nil
}
