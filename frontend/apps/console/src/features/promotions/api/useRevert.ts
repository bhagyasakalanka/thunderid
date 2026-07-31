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
import type {RevertResult} from '../models/promotion';

/** Variables for a revert. toVersion accepts a version number or "previous". */
export interface RevertVariables {
  envId: string;
  toVersion: string;
  apply?: boolean;
  note?: string;
}

/**
 * Reverts an environment to an earlier version. Reverting adds a new version restoring the older
 * content rather than deleting history.
 */
export default function useRevert(): UseMutationResult<RevertResult, Error, RevertVariables> {
  const {http} = useThunderID();
  const baseUrl: string | undefined = useEnvManagerUrl();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('promotions');
  const {showToast} = useToast();

  return useMutation<RevertResult, Error, RevertVariables>({
    mutationFn: async (variables: RevertVariables): Promise<RevertResult> => {
      const response: {data: RevertResult} = await http.request({
        url: `${baseUrl}/environments/${variables.envId}/revert`,
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'same-origin',
        data: {toVersion: variables.toVersion, apply: variables.apply, note: variables.note},
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data;
    },
    onSuccess: (result: RevertResult, variables: RevertVariables) => {
      queryClient.invalidateQueries({queryKey: [PromotionQueryKeys.ENVIRONMENTS]}).catch(() => {
        // Ignore invalidation errors.
      });
      queryClient.invalidateQueries({queryKey: [PromotionQueryKeys.VERSIONS, variables.envId]}).catch(() => {
        // Ignore invalidation errors.
      });
      // A revert restores the Control Plane as well, and that write can fail per resource while the
      // revert itself succeeds. Reporting only the revert would leave the tenant looking untouched
      // with no indication why.
      const failed: number = result.controlPlane?.summary?.failed ?? 0;
      if (failed > 0) {
        showToast(
          t(
            'revert.controlPlanePartial',
            'Reverted, but {{failed}} resources could not be written to the Control Plane',
            {
              failed,
            },
          ),
          'warning',
        );
        return;
      }
      showToast(t('revert.success', 'Environment reverted successfully'), 'success');
    },
    onError: () => {
      showToast(t('revert.error', 'Failed to revert the environment. Please try again.'), 'error');
    },
  });
}
