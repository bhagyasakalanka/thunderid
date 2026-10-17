// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import useDefaultGatewayBaseUrl from '@console/features/promotions/api/useDefaultGatewayBaseUrl';

/**
 * Resolves the redirect URI a provider should be given for connections authored here.
 *
 * A connection's redirect URI is copied into the provider's allowed-redirect list, so it has to
 * name the deployment that receives the callback. This plane serves no gate, so its own address
 * would be wrong, and wrong in a way nothing reports: the provider accepts it, and sign-in fails
 * later on the deployment that does serve one.
 *
 * Undefined until a gateway is registered, which leaves the page showing what it showed before
 * rather than inventing an address.
 */
export default function useGatewayRedirectUri(): string | undefined {
  const baseUrl: string | undefined = useDefaultGatewayBaseUrl();

  return baseUrl ? `${baseUrl}/gate/callback` : undefined;
}
