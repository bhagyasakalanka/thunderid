// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useConfig} from '@thunderid/contexts';

/**
 * Resolves the environment manager's base URL, which is where promotion lives.
 *
 * Promotion is not part of the product. A gateway is a flat resource of the organization, and which
 * gateway may be promoted into which comes from the organization's environment hierarchy, which a
 * separate service holds. This returns that service's URL when one is configured.
 *
 * Undefined means no such service is configured, and the promotion views are left out rather than
 * offering an action with nothing behind it. That is the normal case for a deployment that promotes
 * by other means, or not at all.
 */
export default function usePromotionServiceUrl(): string | undefined {
  const {config} = useConfig();
  if (config.plane !== 'cp') {
    return undefined;
  }
  const url: string = config.env_manager?.public_url?.trim() ?? '';

  return url ? url.replace(/\/+$/, '') : undefined;
}
