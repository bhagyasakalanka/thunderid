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
import type {DataPlaneJob} from '../models/promotion';

/** How often unfinished work is checked again, in milliseconds. */
const POLL_INTERVAL = 3000;

/**
 * Follows work queued for a data plane until it finishes.
 *
 * An apply or a credential is carried out by the Control Plane pod holding that data plane's
 * connection, which is not always the pod that accepted the request. When it is not, the request
 * comes back with a job id and no result, and this reads the answer once some pod has delivered it.
 *
 * Polling stops as soon as the work is done or has failed, so a finished job costs nothing.
 */
export default function useDataPlaneJob(jobId: string | undefined): UseQueryResult<DataPlaneJob, Error> {
  const {http} = useThunderID();
  const baseUrl: string | undefined = useEnvManagerUrl();

  return useQuery<DataPlaneJob, Error>({
    queryKey: [PromotionQueryKeys.DATA_PLANE_JOB, jobId],
    enabled: Boolean(baseUrl) && Boolean(jobId),
    refetchInterval: (query): number | false => {
      const status: string | undefined = query.state.data?.status;
      return status === 'done' || status === 'failed' ? false : POLL_INTERVAL;
    },
    queryFn: async (): Promise<DataPlaneJob> => {
      const response: {data: DataPlaneJob} = await http.request({
        url: `${baseUrl}/data-plane-jobs/${jobId}`,
        method: 'GET',
        credentials: 'same-origin',
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data;
    },
  });
}
