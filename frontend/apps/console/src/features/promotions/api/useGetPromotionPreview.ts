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

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useThunderID} from '@thunderid/react';
import useEnvManagerUrl from './useEnvManagerUrl';
import PromotionQueryKeys from '../constants/promotion-query-keys';
import type {Diff} from '../models/promotion';

/**
 * Previews what promoting a source environment's version into a target environment would change.
 * This is the diff the user reviews, and selects from, before promoting.
 */
export default function useGetPromotionPreview(fromEnv: string, toEnv: string, version?: string): UseQueryResult<Diff> {
  const {http} = useThunderID();
  const baseUrl: string | undefined = useEnvManagerUrl();

  return useQuery<Diff>({
    queryKey: [PromotionQueryKeys.PROMOTION_PREVIEW, fromEnv, toEnv, version ?? 'latest'],
    enabled: Boolean(baseUrl) && Boolean(fromEnv) && Boolean(toEnv),
    queryFn: async (): Promise<Diff> => {
      const params = new URLSearchParams({fromEnv, toEnv});
      if (version) {
        params.set('version', version);
      }
      const response: {data: Diff} = await http.request({
        url: `${baseUrl}/promotions/preview?${params.toString()}`,
        method: 'GET',
        credentials: 'same-origin',
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data;
    },
  });
}
