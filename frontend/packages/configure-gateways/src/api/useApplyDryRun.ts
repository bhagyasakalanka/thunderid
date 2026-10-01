// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useConfig} from '@thunderid/contexts';
import {useThunderID} from '@thunderid/react';
import GatewayQueryKeys from '../constants/gateway-query-keys';
import type {ApplyResult, ApplyVersionRequest} from '../models/gateway';

/**
 * Runs a dry run of applying a version (a number or `latest`) to a gateway, which reports the
 * variables and secrets the version refers to that the gateway does not hold. Nothing on the
 * gateway changes. A selection checks only the changes it names; without one, the gateway's standing
 * choices apply. Pass `enabled: false` to hold the request until it is needed.
 */
export default function useApplyDryRun(
  gatewayId: string,
  version: string,
  enabled = true,
  selection: string[] | undefined = undefined,
): UseQueryResult<ApplyResult> {
  const {http} = useThunderID();
  const {getServerUrl} = useConfig();

  return useQuery<ApplyResult>({
    queryKey: [GatewayQueryKeys.GATEWAY_DRY_RUN, gatewayId, 'apply', version, selection ?? null],
    queryFn: async (): Promise<ApplyResult> => {
      const data: ApplyVersionRequest = {version, dryRun: true, ...(selection ? {selection} : {})};
      const response: {data: ApplyResult} = await http.request({
        url: `${getServerUrl()}/gateways/${encodeURIComponent(gatewayId)}/apply`,
        method: 'POST',
        data,
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data;
    },
    enabled: enabled && Boolean(gatewayId) && Boolean(version),
    refetchOnWindowFocus: false,
  });
}
