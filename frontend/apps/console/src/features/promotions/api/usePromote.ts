// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useToast} from '@thunderid/contexts';
import {useThunderID} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import useEnvManagerUrl from './useEnvManagerUrl';
import PromotionQueryKeys from '../constants/promotion-query-keys';
import type {PromoteResult} from '../models/promotion';

/**
 * Variables for a promotion. The selection is the user's explicit choice of which changed
 * resources to promote, and the environment remembers it: anything omitted is held back on later
 * runs too, until it is selected again. Omit the field entirely to promote what the environment
 * already remembers.
 */
export interface PromoteVariables {
  fromEnv: string;
  toEnv: string;
  version?: string;
  selection?: string[];
  apply?: boolean;
  note?: string;
}

/**
 * Promotes configuration from one environment into the next, optionally limited to a selected set of
 * changes and optionally applied to the target's data plane straight away.
 */
export default function usePromote(): UseMutationResult<PromoteResult, Error, PromoteVariables> {
  const {http} = useThunderID();
  const baseUrl: string | undefined = useEnvManagerUrl();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('promotions');
  const {showToast} = useToast();

  return useMutation<PromoteResult, Error, PromoteVariables>({
    mutationFn: async (variables: PromoteVariables): Promise<PromoteResult> => {
      const response: {data: PromoteResult} = await http.request({
        url: `${baseUrl}/promotions`,
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'same-origin',
        data: variables,
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data;
    },
    onSuccess: (result: PromoteResult, variables: PromoteVariables) => {
      queryClient.invalidateQueries({queryKey: [PromotionQueryKeys.ENVIRONMENTS]}).catch(() => {
        // Ignore invalidation errors.
      });
      queryClient.invalidateQueries({queryKey: [PromotionQueryKeys.VERSIONS, variables.toEnv]}).catch(() => {
        // Ignore invalidation errors.
      });
      queryClient.invalidateQueries({queryKey: [PromotionQueryKeys.PROMOTION_PREVIEW]}).catch(() => {
        // Ignore invalidation errors.
      });
      // The promotion writes into the destination's Control Plane tenant, and that write reports a
      // per-resource outcome. A partial failure has to be said out loud: the version is recorded either
      // way, so reporting plain success leaves the tenant looking promoted when most of it is missing.
      const failed: number = result.controlPlane?.summary?.failed ?? 0;
      if (failed > 0) {
        showToast(
          t('promote.partial', '{{failed}} of {{total}} resources could not be written to the Control Plane', {
            failed,
            total: result.controlPlane?.summary?.totalDocuments ?? failed,
          }),
          'warning',
        );
        return;
      }
      showToast(t('promote.success', 'Configuration promoted successfully'), 'success');
    },
    onError: () => {
      showToast(t('promote.error', 'Failed to promote configuration. Please try again.'), 'error');
    },
  });
}
