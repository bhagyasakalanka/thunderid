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
import type {VersionListResponse} from '../models/promotion';

/**
 * Lists an environment's retained configuration versions, newest first.
 */
export default function useGetVersions(envId: string): UseQueryResult<VersionListResponse> {
  const {http} = useThunderID();
  const baseUrl: string | undefined = useEnvManagerUrl();

  return useQuery<VersionListResponse>({
    queryKey: [PromotionQueryKeys.VERSIONS, envId],
    enabled: Boolean(baseUrl) && Boolean(envId),
    queryFn: async (): Promise<VersionListResponse> => {
      const response: {data: VersionListResponse} = await http.request({
        url: `${baseUrl}/environments/${envId}/versions`,
        method: 'GET',
        credentials: 'same-origin',
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data;
    },
  });
}
