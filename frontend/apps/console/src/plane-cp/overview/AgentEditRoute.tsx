// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import AgentOverview from '@/features/agents/components/edit-agent/overview/AgentOverview';
import AgentEditPage from '@/features/agents/pages/AgentEditPage';
import useDefaultGatewayBaseUrl from '@/features/promotions/api/useDefaultGatewayBaseUrl';
import type {JSX} from 'react';

/**
 * The agent edit page as this plane serves it, for the reason the application edit route gives: the
 * Overview tab's endpoints belong to the data plane that answers for this configuration, so they are
 * printed against the default gateway's address and omitted until one is registered.
 */
export default function AgentEditRoute(): JSX.Element {
  const runtimeBaseUrl: string | undefined = useDefaultGatewayBaseUrl();

  if (!runtimeBaseUrl) {
    return <AgentEditPage />;
  }

  return (
    <AgentEditPage renderAgentOverview={(props) => <AgentOverview {...props} runtimeBaseUrl={runtimeBaseUrl} />} />
  );
}
