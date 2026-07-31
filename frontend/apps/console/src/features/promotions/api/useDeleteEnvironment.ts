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

/**
 * Removes an environment and its stored configuration versions from the environment manager. The
 * data planes themselves are left untouched.
 */
export default function useDeleteEnvironment(): UseMutationResult<void, Error, string> {
  const {http} = useThunderID();
  const baseUrl: string | undefined = useEnvManagerUrl();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('promotions');
  const {showToast} = useToast();

  return useMutation<void, Error, string>({
    mutationFn: async (envId: string): Promise<void> => {
      await http.request({
        url: `${baseUrl}/environments/${envId}`,
        method: 'DELETE',
        credentials: 'same-origin',
      } as unknown as Parameters<typeof http.request>[0]);
    },
    onSuccess: (_result: void, envId: string) => {
      queryClient.removeQueries({queryKey: [PromotionQueryKeys.VERSIONS, envId]});
      queryClient.invalidateQueries({queryKey: [PromotionQueryKeys.ENVIRONMENTS]}).catch(() => {
        // Ignore invalidation errors.
      });
      showToast(t('environment.deleteSuccess', 'Environment removed'), 'success');
    },
    onError: () => {
      showToast(t('environment.deleteError', 'Failed to remove the environment. Please try again.'), 'error');
    },
  });
}
