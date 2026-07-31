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
import type {RegeneratedSecret} from '../models/promotion';

/** Variables for regenerating one credential. */
export interface RegenerateSecretVariables {
  envId: string;
  name: string;
}

/**
 * Issues a fresh credential and stores it on the environment's Data Plane.
 *
 * Only a hashed credential can be regenerated, because a value the Data Plane replays to a third party
 * is issued by that party. The response is the one and only time the new value can be read.
 */
export default function useRegenerateEnvironmentSecret(): UseMutationResult<
  RegeneratedSecret,
  Error,
  RegenerateSecretVariables
> {
  const {http} = useThunderID();
  const baseUrl: string | undefined = useEnvManagerUrl();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('promotions');
  const {showToast} = useToast();

  return useMutation<RegeneratedSecret, Error, RegenerateSecretVariables>({
    mutationFn: async (variables: RegenerateSecretVariables): Promise<RegeneratedSecret> => {
      const url = `${baseUrl}/environments/${variables.envId}/secrets/${encodeURIComponent(variables.name)}/regenerate`;
      const response: {data: RegeneratedSecret} = await http.request({
        url,
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'same-origin',
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data;
    },
    onSuccess: (_data: RegeneratedSecret, variables: RegenerateSecretVariables) => {
      queryClient.invalidateQueries({queryKey: [PromotionQueryKeys.SECRETS, variables.envId]}).catch(() => {
        // Ignore invalidation errors.
      });
      queryClient.invalidateQueries({queryKey: [PromotionQueryKeys.VARIABLES, variables.envId]}).catch(() => {
        // Ignore invalidation errors.
      });
    },
    onError: (error: Error) => {
      showToast(error.message || t('secrets.regenerateError', 'Failed to regenerate the secret'), 'error');
    },
  });
}
