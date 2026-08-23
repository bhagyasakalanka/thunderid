// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useThunderID} from '@thunderid/react';
import useGatewayApiUrl from './useGatewayApiUrl';
import PromotionQueryKeys from '../constants/promotion-query-keys';
import type {VersionListResponse} from '../models/promotion';

/**
 * Lists an gateway's retained configuration versions, newest first.
 */
export default function useGetVersions(gatewayId: string): UseQueryResult<VersionListResponse> {
  const {http} = useThunderID();
  const baseUrl: string | undefined = useGatewayApiUrl();

  return useQuery<VersionListResponse>({
    queryKey: [PromotionQueryKeys.VERSIONS, gatewayId],
    enabled: Boolean(baseUrl) && Boolean(gatewayId),
    queryFn: async (): Promise<VersionListResponse> => {
      const response: {data: VersionListResponse} = await http.request({
        url: `${baseUrl}/gateways/${gatewayId}/versions`,
        method: 'GET',
        credentials: 'same-origin',
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data;
    },
  });
}
