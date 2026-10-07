// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {AppliedConfiguration} from '@thunderid/components';
import {describe, expect, it} from 'vitest';
import {toAgentGroupsPage, toAgentRolesPage} from '../toAgentMemberships';

const configuration: AppliedConfiguration = {
  gatewayId: 'gw-1',
  resources: [
    {
      resourceType: 'group',
      id: 'g1',
      resource: {id: 'g1', name: 'agents', ouId: 'ou-1'},
      parts: {members: {members: [{id: 'agent-1', type: 'agent'}]}},
    },
    {
      resourceType: 'group',
      id: 'g2',
      resource: {id: 'g2', name: 'others', ouId: 'ou-1'},
      parts: {members: {members: [{id: 'user-1', type: 'user'}]}},
    },
    {resourceType: 'group', id: 'g3', resource: {id: 'g3', name: 'empty', ouId: 'ou-1'}},
    {
      resourceType: 'role',
      id: 'r1',
      resource: {id: 'r1', name: 'direct'},
      parts: {assignments: {assignments: [{id: 'agent-1', type: 'agent'}]}},
    },
    {
      resourceType: 'role',
      id: 'r2',
      resource: {id: 'r2', name: 'through-group'},
      parts: {assignments: {assignments: [{id: 'g1', type: 'group'}]}},
    },
    {
      resourceType: 'role',
      id: 'r3',
      resource: {id: 'r3', name: 'unrelated'},
      parts: {assignments: {assignments: [{id: 'g2', type: 'group'}]}},
    },
  ],
};

describe('toAgentGroupsPage', () => {
  it('lists the groups whose members include the agent', () => {
    expect(toAgentGroupsPage(configuration, 'agent-1')).toEqual({
      totalResults: 1,
      startIndex: 1,
      count: 1,
      groups: [{id: 'g1', name: 'agents', ouId: 'ou-1'}],
    });
  });

  it('returns an empty page for an agent in no group', () => {
    expect(toAgentGroupsPage(configuration, 'agent-2').groups).toEqual([]);
  });
});

describe('toAgentRolesPage', () => {
  it('lists the roles assigned to the agent directly or through its groups', () => {
    expect(toAgentRolesPage(configuration, 'agent-1').roles).toEqual(['direct', 'through-group']);
  });

  it('pages the roles by limit and offset', () => {
    const page = toAgentRolesPage(configuration, 'agent-1', 1, 1);

    expect(page).toEqual({totalResults: 2, startIndex: 2, count: 1, roles: ['through-group']});
  });
});
