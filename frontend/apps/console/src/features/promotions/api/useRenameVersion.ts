// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useToast} from '@thunderid/contexts';
import {useThunderID} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import useGatewayApiUrl from './useGatewayApiUrl';
import PromotionQueryKeys from '../constants/promotion-query-keys';
import type {Version} from '../models/promotion';

/** Variables for renaming a captured version. */
export interface RenameVersionVariables {
  seq: number;
  note: string;
}

/**
 * Renames a captured version.
 *
 * Only the note changes. What the version captured stays as it was, because a gateway running it is
 * running those resources.
 */
export default function useRenameVersion(): UseMutationResult<Version, Error, RenameVersionVariables> {
  const {http} = useThunderID();
  const baseUrl: string | undefined = useGatewayApiUrl();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('promotions');
  const {showToast} = useToast();

  return useMutation<Version, Error, RenameVersionVariables>({
    mutationFn: async (variables: RenameVersionVariables): Promise<Version> => {
      const response: {data: Version} = await http.request({
        url: `${baseUrl}/versions/${variables.seq}`,
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        credentials: 'same-origin',
        data: {note: variables.note},
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [PromotionQueryKeys.VERSIONS]}).catch(() => {
        // Ignore invalidation errors.
      });
      queryClient.invalidateQueries({queryKey: [PromotionQueryKeys.GATEWAYS]}).catch(() => {
        // Ignore invalidation errors.
      });
      showToast(t('rename.success', 'Version renamed'), 'success');
    },
    onError: () => {
      showToast(t('rename.error', 'Failed to rename the version. Please try again.'), 'error');
    },
  });
}
