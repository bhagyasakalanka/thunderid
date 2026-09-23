// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  ConnectionConfigureWizardPage,
  ConnectionCreateWizardPage,
  ConnectionDetailPage,
} from '@thunderid/configure-connections';
import type {JSX} from 'react';
import useGatewayRedirectUri from './useGatewayRedirectUri';

/**
 * The connection pages as this plane serves them.
 *
 * Each shows the redirect URI an operator gives the provider, and that callback is answered by the
 * gateway's data plane rather than by this server, so the address comes from the gateway.
 */
export function ConnectionCreateRoute(): JSX.Element {
  return <ConnectionCreateWizardPage redirectUri={useGatewayRedirectUri()} />;
}

export function ConnectionConfigureRoute(): JSX.Element | null {
  return <ConnectionConfigureWizardPage redirectUri={useGatewayRedirectUri()} />;
}

export function ConnectionDetailRoute(): JSX.Element | null {
  return <ConnectionDetailPage redirectUri={useGatewayRedirectUri()} />;
}
