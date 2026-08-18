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
import type {EnvironmentListResponse} from '../models/promotion';

/**
 * Lists the environments in the promotion chain, ordered by rank.
 */
export default function useGetEnvironments(): UseQueryResult<EnvironmentListResponse> {
  const {http} = useThunderID();
  const baseUrl: string | undefined = useEnvManagerUrl();

  return useQuery<EnvironmentListResponse>({
    queryKey: [PromotionQueryKeys.ENVIRONMENTS],
    enabled: Boolean(baseUrl),
    queryFn: async (): Promise<EnvironmentListResponse> => {
      const response: {data: EnvironmentListResponse} = await http.request({
        url: `${baseUrl}/environments`,
        method: 'GET',
        credentials: 'same-origin',
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data;
    },
  });
}
