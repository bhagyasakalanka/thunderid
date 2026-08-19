// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useToast} from '@thunderid/contexts';
import {useThunderID} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import useEnvManagerUrl from './useEnvManagerUrl';
import PromotionQueryKeys from '../constants/promotion-query-keys';
import type {ImportResponse} from '../models/promotion';

/** Variables for restoring a control plane. version accepts a number or "latest". */
export interface ApplyToControlPlaneVariables {
  envId: string;
  version?: string;
}

/**
 * Writes a version into the environment's own Control Plane tenant, leaving the Data Plane alone.
 *
 * Promotion and revert already do this as part of their work; this is the same write on its own, for
 * putting a tenant back in step when one of those failed part way through.
 */
export default function useApplyToControlPlane(): UseMutationResult<
  ImportResponse | undefined,
  Error,
  ApplyToControlPlaneVariables
> {
  const {http} = useThunderID();
  const baseUrl: string | undefined = useEnvManagerUrl();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('promotions');
  const {showToast} = useToast();

  return useMutation<ImportResponse | undefined, Error, ApplyToControlPlaneVariables>({
    mutationFn: async (variables: ApplyToControlPlaneVariables): Promise<ImportResponse | undefined> => {
      const response: {data: {controlPlane?: ImportResponse}} = await http.request({
        url: `${baseUrl}/environments/${variables.envId}/control-plane`,
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'same-origin',
        data: {version: variables.version},
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data?.controlPlane;
    },
    onSuccess: (data: ImportResponse | undefined, variables: ApplyToControlPlaneVariables) => {
      queryClient.invalidateQueries({queryKey: [PromotionQueryKeys.ENVIRONMENTS]}).catch(() => {
        // Ignore invalidation errors.
      });

      // The import reports per-resource outcomes, and a partial failure is the interesting case: the
      // tenant is then in neither the old state nor the new one.
      const failed: number = data?.summary?.failed ?? 0;
      if (failed > 0) {
        showToast(
          t('controlPlane.partial', '{{failed}} of {{total}} resources could not be written', {
            failed,
            total: data?.summary?.totalDocuments ?? failed,
          }),
          'warning',
        );
        return;
      }
      showToast(
        t('controlPlane.success', 'Control Plane updated from version {{version}}: {{imported}} resources', {
          version: variables.version ?? 'latest',
          imported: data?.summary?.imported ?? 0,
        }),
        'success',
      );
    },
    onError: (error: Error) => {
      showToast(error.message || t('controlPlane.error', 'Failed to update the Control Plane'), 'error');
    },
  });
}
