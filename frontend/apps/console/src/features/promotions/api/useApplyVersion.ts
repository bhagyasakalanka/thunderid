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
import type {ApplyResult} from '../models/promotion';

/** Variables for an apply. version accepts a number, "latest" or "previous". */
export interface ApplyVariables {
  envId: string;
  version?: string;
}

/**
 * Applies a version to an environment's data plane.
 */
export default function useApplyVersion(): UseMutationResult<ApplyResult, Error, ApplyVariables> {
  const {http} = useThunderID();
  const baseUrl: string | undefined = useEnvManagerUrl();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('promotions');
  const {showToast} = useToast();

  return useMutation<ApplyResult, Error, ApplyVariables>({
    mutationFn: async (variables: ApplyVariables): Promise<ApplyResult> => {
      const response: {data: ApplyResult} = await http.request({
        url: `${baseUrl}/environments/${variables.envId}/apply`,
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'same-origin',
        data: {version: variables.version},
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [PromotionQueryKeys.ENVIRONMENTS]}).catch(() => {
        // Ignore invalidation errors.
      });
      showToast(t('apply.success', 'Configuration applied successfully'), 'success');
    },
    onError: () => {
      showToast(t('apply.error', 'Failed to apply the configuration. Please try again.'), 'error');
    },
  });
}
