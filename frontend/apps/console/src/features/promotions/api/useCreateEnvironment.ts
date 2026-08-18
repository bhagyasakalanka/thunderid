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
 * Connection details for a plane the environment manager talks to.
 *
 * Prefer clientId and clientSecret: the service exchanges them for tokens and renews them as they
 * expire. Leave both empty for a server that trusts the same issuer as the console, and the caller's
 * own token is forwarded instead. A static token is a last resort, because it expires.
 */
export interface SecretProviderInput {
  baseUrl: string;
  token?: string;
  insecureSkipVerify?: boolean;
}

export interface EndpointInput {
  baseUrl: string;
  /** The Control Plane tenant this environment belongs to, used to route captured secrets to it. */
  deploymentId?: string;
  /**
   * The service holding this data plane's secrets, used to check they are present before an apply.
   * Omit it unless the secrets live outside the data plane: a data plane serves its own store, and
   * that is reached with the credentials above, so there is nothing extra to configure.
   */
  secretProvider?: SecretProviderInput;
  clientId?: string;
  clientSecret?: string;
  scope?: string;
  /** RFC 8707 resource indicator naming the resource server the token is minted for. */
  resource?: string;
  token?: string;
  insecureSkipVerify?: boolean;
}

/** Variables for registering an environment. */
export interface CreateEnvironmentVariables {
  name: string;
  rank?: number;
  target: EndpointInput;
  source?: EndpointInput;
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
