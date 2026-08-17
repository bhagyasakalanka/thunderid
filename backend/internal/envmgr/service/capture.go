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

// CaptureSecretForTenant relays a secret the control plane captured to the secret provider of the
// environment that tenant belongs to.
//
// The control plane serves every tenant, so it cannot know which data plane's provider a secret
// belongs on; this service holds that mapping (an environment names both its tenant and its
// provider). The relay exists so the control plane has exactly one place to send a captured secret,
// regardless of how many environments there are.
//
// It returns how many providers received the secret. Zero with no error means no environment is
// registered for the tenant yet, which the caller treats as "nothing to do" rather than a failure:
// secrets created before the environment is registered are recreated on promote.
func (s *Service) CaptureSecretForTenant(ctx context.Context, deploymentID, name string,
	body map[string]interface{}) (int, error) {
	if strings.TrimSpace(deploymentID) == "" || strings.TrimSpace(name) == "" {
		return 0, fmt.Errorf("%w: a tenant id and a secret name are required", ErrValidation)
	}

	envs, err := s.store.ListEnvironments(ctx)
	if err != nil {
		return 0, err
	}

	delivered := 0
	for _, env := range envs {
		if env.Source == nil || env.Source.DeploymentID != deploymentID {
			continue
		}
		if _, err := s.queueSecret(ctx, env, name, body); err != nil {
			return delivered, fmt.Errorf("failed to store the secret for %s: %w", env.Name, err)
		}
		delivered++
	}
	return delivered, nil
}
