// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {AppliedConfiguration, AppliedResource} from '@thunderid/components';
import type {AgentGroup, AgentGroupListResponse, AgentRoleListResponse} from '../models/agent';

/** A member of a group, or an assignee of a role, as the group's members or the role's assignments list it. */
interface Assignee {
  id: string;
}

function holds(part: unknown, key: 'members' | 'assignments', ids: string[]): boolean {
  const assignees: Assignee[] = (part as Record<string, Assignee[] | undefined> | undefined)?.[key] ?? [];
  return assignees.some((assignee: Assignee) => ids.includes(assignee.id));
}

function ofType(configuration: AppliedConfiguration, resourceType: string): AppliedResource[] {
  return configuration.resources.filter((applied: AppliedResource) => applied.resourceType === resourceType);
}

/**
 * Builds an agent's groups page from the configuration a gateway runs: every group whose members
 * include the agent, cut by the same limit and offset the live read applies on the server.
 *
 * @param configuration - The configuration the gateway runs
 * @param agentId - The agent
 * @param limit - Maximum number of groups on the page
 * @param offset - Number of groups skipped before the page
 * @returns The page, in the live read's shape
 */
export function toAgentGroupsPage(
  configuration: AppliedConfiguration,
  agentId: string,
  limit = 30,
  offset = 0,
): AgentGroupListResponse {
  const groups: AgentGroup[] = ofType(configuration, 'group')
    .filter((applied: AppliedResource) => holds(applied.parts?.['members'], 'members', [agentId]))
    .map((applied: AppliedResource): AgentGroup => {
      const group = applied.resource as AgentGroup;
      return {id: group.id, name: group.name, ouId: group.ouId};
    });
  const page: AgentGroup[] = groups.slice(offset, offset + limit);
  return {totalResults: groups.length, startIndex: offset + 1, count: page.length, groups: page};
}

/**
 * Builds an agent's roles page from the configuration a gateway runs: the name of every role
 * assigned to the agent directly or through one of its groups, as the live read returns them.
 *
 * @param configuration - The configuration the gateway runs
 * @param agentId - The agent
 * @param limit - Maximum number of roles on the page
 * @param offset - Number of roles skipped before the page
 * @returns The page, in the live read's shape
 */
export function toAgentRolesPage(
  configuration: AppliedConfiguration,
  agentId: string,
  limit = 30,
  offset = 0,
): AgentRoleListResponse {
  const assigneeIds: string[] = [
    agentId,
    ...toAgentGroupsPage(configuration, agentId, Number.MAX_SAFE_INTEGER).groups.map((group: AgentGroup) => group.id),
  ];
  const roles: string[] = ofType(configuration, 'role')
    .filter((applied: AppliedResource) => holds(applied.parts?.['assignments'], 'assignments', assigneeIds))
    .map((applied: AppliedResource) => (applied.resource as {name: string}).name);
  const page: string[] = roles.slice(offset, offset + limit);
  return {totalResults: roles.length, startIndex: offset + 1, count: page.length, roles: page};
}
