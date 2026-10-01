// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useConfig} from '@thunderid/contexts';
import {useThunderID} from '@thunderid/react';
import GatewayQueryKeys from '../constants/gateway-query-keys';
import type {GatewayVariable, GatewayVariableList} from '../models/gateway';

// The most a gateway returns in one page.
const PAGE_SIZE = 100;

/**
 * Lists the variables a gateway holds. The request passes through this plane to the gateway's own
 * store, so a gateway that cannot be reached fails it with a 502.
 * Every page is read, so the values can be grouped by what they are for.
 */
export default function useGetGatewayVariables(gatewayId: string): UseQueryResult<GatewayVariableList> {
  const {http} = useThunderID();
  const {getServerUrl} = useConfig();

  return useQuery<GatewayVariableList>({
    queryKey: [GatewayQueryKeys.GATEWAY_VARIABLES, gatewayId],
    queryFn: async (): Promise<GatewayVariableList> => {
      const variables: GatewayVariable[] = [];
      for (;;) {
        const response: {data: GatewayVariableList} = await http.request({
          url: `${getServerUrl()}/gateways/${encodeURIComponent(gatewayId)}/variables?limit=${String(PAGE_SIZE)}&offset=${String(variables.length)}`,
          method: 'GET',
        } as unknown as Parameters<typeof http.request>[0]);
        variables.push(...response.data.variables);
        if (response.data.variables.length === 0 || variables.length >= response.data.totalResults) {
          return {totalResults: variables.length, startIndex: 1, count: variables.length, variables};
        }
      }
    },
    enabled: Boolean(gatewayId),
  });
}
