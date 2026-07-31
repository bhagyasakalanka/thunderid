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
import type {Diff} from '../models/promotion';

/**
 * Reads the diff between two versions of one environment.
 *
 * The apply flow uses it with the defaults, applied to the version being applied, so the change can
 * be reviewed before it reaches a data plane rather than being read from the result afterwards.
 * Resources held back from the environment are filtered out server side, so the preview shows what
 * the apply would actually do.
 */
export default function useGetEnvironmentDiff(
  envId: string,
  from = 'applied',
  to = 'latest',
): UseQueryResult<Diff, Error> {
  const {http} = useThunderID();
  const baseUrl: string | undefined = useEnvManagerUrl();

  return useQuery<Diff, Error>({
    queryKey: ['environment-diff', envId, from, to],
    enabled: Boolean(envId) && Boolean(baseUrl),
    queryFn: async (): Promise<Diff> => {
      const response = await http.request({
        url: `${baseUrl}/environments/${envId}/diff?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
      } as unknown as Parameters<typeof http.request>[0]);

      return (response as {data: Diff}).data;
    },
  });
}
