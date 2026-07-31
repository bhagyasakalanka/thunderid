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
import type {ApplyAllResult} from '../models/promotion';

/**
 * Re-applies every environment's latest version.
 *
 * Editing a value the configuration references, such as a redirect URL, does not change any stored
 * version, so nothing reaches the Data Planes until an apply runs. This is that push.
 */
export default function useApplyAll(): UseMutationResult<{results: ApplyAllResult[]}, Error, void> {
  const {http} = useThunderID();
  const baseUrl: string | undefined = useEnvManagerUrl();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('promotions');
  const {showToast} = useToast();

  return useMutation<{results: ApplyAllResult[]}, Error, void>({
    mutationFn: async (): Promise<{results: ApplyAllResult[]}> => {
      const response: {data: {results: ApplyAllResult[]}} = await http.request({
        url: `${baseUrl}/apply`,
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'same-origin',
        data: {},
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data;
    },
    onSuccess: (data: {results: ApplyAllResult[]}) => {
      queryClient.invalidateQueries({queryKey: [PromotionQueryKeys.ENVIRONMENTS]}).catch(() => {
        // Ignore invalidation errors.
      });
      const failed: number = (data.results ?? []).filter((r: ApplyAllResult) => Boolean(r.error)).length;
      const applied: number = (data.results ?? []).length - failed;
      if (failed > 0) {
        showToast(
          t('applyAll.partial', 'Applied to {{applied}} environment(s); {{failed}} could not be applied', {
            applied,
            failed,
          }),
          'warning',
        );
        return;
      }
      showToast(t('applyAll.success', 'Applied to {{applied}} environment(s)', {applied}), 'success');
    },
    onError: () => {
      showToast(t('applyAll.error', 'Failed to apply to the environments. Please try again.'), 'error');
    },
  });
}
