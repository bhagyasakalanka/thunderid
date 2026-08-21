// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useConfig} from '@thunderid/contexts';
import useEnvManagerUrl from './useEnvManagerUrl';

/**
 * Resolves where promotion is carried out.
 *
 * On its own, the Control Plane can move a version between any two of an organization's gateways: the
 * set is flat, so every other gateway is a possible target and the operator picks one. That is what an
 * on-premise deployment gets, and it is served by the Control Plane itself.
 *
 * With an environment manager connected, that service answers instead. It holds the organization's
 * environment hierarchy, so it is the one that knows which moves the hierarchy actually permits, and
 * the targets offered narrow from "any gateway" to the ones it allows.
 *
 * Undefined only on a plane that promotes nothing at all.
 */
export default function usePromotionServiceUrl(): string | undefined {
  const {config} = useConfig();
  const controlPlaneUrl: string | undefined = useEnvManagerUrl();
  const configured: string = config.env_manager?.public_url?.trim() ?? '';

  return configured ? configured.replace(/\/+$/, '') : controlPlaneUrl;
}
