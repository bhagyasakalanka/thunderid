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

import {useCallback} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useConfig} from '@thunderid/contexts';
import {useThunderID} from '@thunderid/react';

interface ManagedResourcesResponse {
  enabled: boolean;
  managed: Record<string, string[] | undefined>;
}

/**
 * Tells whether a connection is owned by the control plane, so a view can present it read only
 * instead of offering controls the server will refuse with 403.
 *
 * Identity providers and notification senders share the single "connection" resource type, so one
 * lookup covers both. While the answer is still loading nothing is reported as managed, so the UI
 * does not flicker into a read-only state and back.
 */
export default function useIsManagedConnection(): (id: string | undefined) => boolean {
  const {http} = useThunderID();
  const {getServerUrl} = useConfig();

  const {data} = useQuery<ManagedResourcesResponse>({
    queryKey: ['managed-resources'],
    queryFn: async (): Promise<ManagedResourcesResponse> => {
      const serverUrl: string = getServerUrl();
      const response: {data: ManagedResourcesResponse} = await http.request({
        url: `${serverUrl}/managed-resources`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data;
    },
    staleTime: 30_000,
  });

  return useCallback(
    (id: string | undefined): boolean => {
      if (!data?.enabled || !id) {
        return false;
      }
      return (data.managed['connection'] ?? []).includes(id);
    },
    [data],
  );
}
