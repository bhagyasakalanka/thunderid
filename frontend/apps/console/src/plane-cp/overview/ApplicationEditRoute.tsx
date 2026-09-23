// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import IntegrationGuides from '@/features/applications/components/edit-application/integration-guides/IntegrationGuides';
import ApplicationEditPage from '@/features/applications/pages/ApplicationEditPage';
import useDefaultGatewayBaseUrl from '@/features/promotions/api/useDefaultGatewayBaseUrl';
import type {JSX} from 'react';

/**
 * The application edit page as this plane serves it.
 *
 * The Overview tab prints the endpoints a client calls at runtime. This plane answers none of them:
 * the application is authored here and served by a data plane. So the tab is shown against the
 * default gateway's address, which is where the configuration authored here is applied, and left out
 * entirely until a gateway is registered rather than printing this console's own address, which
 * would send a developer to a host that serves nothing they need.
 */
export default function ApplicationEditRoute(): JSX.Element {
  const runtimeBaseUrl: string | undefined = useDefaultGatewayBaseUrl();

  if (!runtimeBaseUrl) {
    return <ApplicationEditPage />;
  }

  return (
    <ApplicationEditPage
      renderIntegrationGuides={(props) => <IntegrationGuides {...props} runtimeBaseUrl={runtimeBaseUrl} />}
    />
  );
}
