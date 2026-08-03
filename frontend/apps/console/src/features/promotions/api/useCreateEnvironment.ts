/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useToast} from '@thunderid/contexts';
import {useThunderID} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import useEnvManagerUrl from './useEnvManagerUrl';
import PromotionQueryKeys from '../constants/promotion-query-keys';
import type {Environment} from '../models/promotion';

/**
 * The Data Plane an environment is applied to.
 *
 * It is named, not addressed. The Data Plane dials the Control Plane and holds that connection open,
 * and everything sent to it travels back down that connection, so there is no URL to call and no
 * credential to hold.
 */
export interface TargetInput {
  /** The id the Data Plane presents when it connects to the Control Plane. */
  dataPlaneId: string;
  /** Where that deployment serves its own users. Recorded for an operator to follow; nothing calls it. */
  baseUrl?: string;
}

/**
 * The Control Plane an environment's configuration is captured from.
 *
 * The console is already talking to it, so the caller's own session token is forwarded and there is
 * nothing to configure beyond which tenant to read.
 */
export interface SourceInput {
  baseUrl: string;
  /** The Control Plane tenant this environment belongs to, used to route captured secrets to it. */
  deploymentId?: string;
  insecureSkipVerify?: boolean;
}

/** Variables for registering an environment. */
export interface CreateEnvironmentVariables {
  name: string;
  rank?: number;
  target: TargetInput;
  source?: SourceInput;
}

/**
 * Registers an environment in the promotion chain.
 */
export default function useCreateEnvironment(): UseMutationResult<Environment, Error, CreateEnvironmentVariables> {
  const {http} = useThunderID();
  const baseUrl: string | undefined = useEnvManagerUrl();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('promotions');
  const {showToast} = useToast();

  return useMutation<Environment, Error, CreateEnvironmentVariables>({
    mutationFn: async (variables: CreateEnvironmentVariables): Promise<Environment> => {
      const response: {data: Environment} = await http.request({
        url: `${baseUrl}/environments`,
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'same-origin',
        data: variables,
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [PromotionQueryKeys.ENVIRONMENTS]}).catch(() => {
        // Ignore invalidation errors.
      });
      showToast(t('environment.createSuccess', 'Environment registered successfully'), 'success');
    },
    onError: () => {
      showToast(t('environment.createError', 'Failed to register the environment. Please try again.'), 'error');
    },
  });
}
