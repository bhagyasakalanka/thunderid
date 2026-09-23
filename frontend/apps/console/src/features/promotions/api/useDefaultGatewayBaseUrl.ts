// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import useGetGateways from './useGetGateways';
import type {Gateway} from '../models/promotion';

/**
 * Resolves where the default gateway's data plane serves, or undefined when that is not known yet.
 *
 * The default gateway is the one the Control Plane administers directly, which the gateway carries
 * as `managedByControlPlane` and exactly one of them holds. Configuration authored here is that
 * gateway's configuration, so its data plane is the host that answers for what is authored on this
 * console.
 *
 * Undefined is a real answer, not a failure: an organization with no gateway registered yet has
 * nowhere for its applications to be reached, and a caller shows nothing rather than guessing.
 */
export default function useDefaultGatewayBaseUrl(): string | undefined {
  const {data} = useGetGateways();
  const gateways: Gateway[] = data?.gateways ?? [];
  const managed: Gateway | undefined = gateways.find((gateway: Gateway) => gateway.managedByControlPlane);
  const baseUrl: string | undefined = managed?.target?.baseUrl;

  return baseUrl ? baseUrl.replace(/\/+$/, '') : undefined;
}
