// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useConfig} from '@thunderid/contexts';
import {useThunderID} from '@thunderid/react';
import GatewayQueryKeys from '../constants/gateway-query-keys';
import type {GatewaySecret, GatewaySecretList} from '../models/gateway';

// The most a gateway returns in one page.
const PAGE_SIZE = 100;

/**
 * Lists the secrets a gateway holds. The request passes through this plane to the gateway's own
 * store, so a gateway that cannot be reached fails it with a 502.
 * Every page is read, so the values can be grouped by what they are for.
 */
export default function useGetGatewaySecrets(gatewayId: string): UseQueryResult<GatewaySecretList> {
  const {http} = useThunderID();
  const {getServerUrl} = useConfig();

  return useQuery<GatewaySecretList>({
    queryKey: [GatewayQueryKeys.GATEWAY_SECRETS, gatewayId],
    queryFn: async (): Promise<GatewaySecretList> => {
      const secrets: GatewaySecret[] = [];
      for (;;) {
        const response: {data: GatewaySecretList} = await http.request({
          url: `${getServerUrl()}/gateways/${encodeURIComponent(gatewayId)}/secrets?limit=${String(PAGE_SIZE)}&offset=${String(secrets.length)}`,
          method: 'GET',
        } as unknown as Parameters<typeof http.request>[0]);
        secrets.push(...response.data.secrets);
        if (response.data.secrets.length === 0 || secrets.length >= response.data.totalResults) {
          return {totalResults: secrets.length, startIndex: 1, count: secrets.length, secrets};
        }
      }
    },
    enabled: Boolean(gatewayId),
  });
}
