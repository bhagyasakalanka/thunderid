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
import type {Version} from '../models/promotion';

/** Variables for capturing a version from an environment's control-plane source. */
export interface CaptureVersionVariables {
  envId: string;
  note?: string;
}

/**
 * Captures the environment's current control-plane configuration as a new version. The environment
 * must have a source configured; without one the service reports that nothing can be captured.
 */
export default function useCaptureVersion(): UseMutationResult<Version, Error, CaptureVersionVariables> {
  const {http} = useThunderID();
  const baseUrl: string | undefined = useEnvManagerUrl();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('promotions');
  const {showToast} = useToast();

  return useMutation<Version, Error, CaptureVersionVariables>({
    mutationFn: async (variables: CaptureVersionVariables): Promise<Version> => {
      const response: {data: Version} = await http.request({
        url: `${baseUrl}/environments/${variables.envId}/versions`,
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'same-origin',
        data: {mode: 'capture', note: variables.note},
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data;
    },
    onSuccess: (_result: Version, variables: CaptureVersionVariables) => {
      queryClient.invalidateQueries({queryKey: [PromotionQueryKeys.ENVIRONMENTS]}).catch(() => {
        // Ignore invalidation errors.
      });
      queryClient.invalidateQueries({queryKey: [PromotionQueryKeys.VERSIONS, variables.envId]}).catch(() => {
        // Ignore invalidation errors.
      });
      showToast(t('capture.success', 'Configuration captured as a new version'), 'success');
    },
    onError: () => {
      showToast(t('capture.error', 'Failed to capture the configuration. Please try again.'), 'error');
    },
  });
}
