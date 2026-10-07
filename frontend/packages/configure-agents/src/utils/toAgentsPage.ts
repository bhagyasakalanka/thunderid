// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {Agent, AgentListResponse, BasicAgent} from '../models/agent';

/**
 * Builds the agents list page from the agents a gateway runs, each in its GET-by-id shape, with the
 * same paging the live list read applies on the server.
 *
 * @param resources - The agents the gateway runs
 * @param limit - Maximum number of agents on the page
 * @param offset - Number of agents skipped before the page
 * @returns The page, in the live list read's shape
 */
export default function toAgentsPage(resources: unknown[], limit = 30, offset = 0): AgentListResponse {
  const agents: BasicAgent[] = (resources as Agent[]).map(
    (agent: Agent): BasicAgent => ({
      id: agent.id,
      ouId: agent.ouId,
      ouHandle: agent.ouHandle,
      type: agent.type,
      name: agent.name,
      description: agent.description,
      logoUrl: agent.logoUrl,
      clientId: agent.clientId ?? agent.inboundAuthConfig?.find((config) => config.config?.clientId)?.config?.clientId,
      isReadOnly: agent.isReadOnly,
    }),
  );
  const page: BasicAgent[] = agents.slice(offset, offset + limit);
  return {totalResults: agents.length, startIndex: offset + 1, count: page.length, agents: page};
}
