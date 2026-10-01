// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useConfig, useToast} from '@thunderid/contexts';
import {useThunderID} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import GatewayQueryKeys from '../constants/gateway-query-keys';
import type {CaptureConfigurationVersionRequest, ConfigurationVersion} from '../models/gateway';
import shortHash from '../utils/shortHash';

export default function useCaptureConfigurationVersion(): UseMutationResult<
  ConfigurationVersion,
  Error,
  CaptureConfigurationVersionRequest
> {
  const {http} = useThunderID();
  const {getServerUrl} = useConfig();
  const {showToast} = useToast();
  const {t} = useTranslation();
  const queryClient = useQueryClient();

  return useMutation<ConfigurationVersion, Error, CaptureConfigurationVersionRequest>({
    mutationFn: async (data: CaptureConfigurationVersionRequest): Promise<ConfigurationVersion> => {
      const response: {data: ConfigurationVersion} = await http.request({
        url: `${getServerUrl()}/configuration-versions`,
        method: 'POST',
        data,
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data;
    },
    onSuccess: (version) => {
      void queryClient.invalidateQueries({queryKey: [GatewayQueryKeys.CONFIGURATION_VERSIONS]});
      // A new latest version changes what every gateway would receive.
      void queryClient.invalidateQueries({queryKey: [GatewayQueryKeys.GATEWAY_DIFF]});
      void queryClient.invalidateQueries({queryKey: [GatewayQueryKeys.GATEWAY_DRY_RUN]});
      const label = version.name
        ? t('gateways:versions.label', '{{name}} · {{hash}}', {name: version.name, hash: shortHash(version.version)})
        : shortHash(version.version);
      if (version.unchanged) {
        showToast(
          t('gateways:capture.unchanged', 'Nothing changed since {{version}}, so no new version was captured.', {
            version: label,
          }),
          'info',
        );
        return;
      }
      showToast(t('gateways:capture.success', 'Captured version {{version}}.', {version: label}), 'success');
    },
  });
}
