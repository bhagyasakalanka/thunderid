// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useConfig} from '@thunderid/contexts';
import {useThunderID} from '@thunderid/react';
import GatewayQueryKeys from '../constants/gateway-query-keys';
import type {ConfigurationVersion} from '../models/gateway';

/**
 * Reads one configuration version (a number or `latest`), with each place it refers to a variable or
 * a secret. Nothing captured yet fails the request.
 */
export default function useGetConfigurationVersion(
  version: string,
  enabled = true,
): UseQueryResult<ConfigurationVersion> {
  const {http} = useThunderID();
  const {getServerUrl} = useConfig();

  return useQuery<ConfigurationVersion>({
    // Under the versions' key, so a capture refreshes it with the listing.
    queryKey: [GatewayQueryKeys.CONFIGURATION_VERSIONS, 'version', version],
    queryFn: async (): Promise<ConfigurationVersion> => {
      const response: {data: ConfigurationVersion} = await http.request({
        url: `${getServerUrl()}/configuration-versions/${encodeURIComponent(version)}`,
        method: 'GET',
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data;
    },
    enabled: enabled && Boolean(version),
    retry: false,
  });
}
