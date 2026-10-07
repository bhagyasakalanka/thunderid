// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import toAgentsPage from '../toAgentsPage';

describe('toAgentsPage', () => {
  it('maps each agent to a list item, taking the client id from its OAuth config when needed', () => {
    const page = toAgentsPage([
      {id: 'a1', ouId: 'ou-1', ouHandle: 'root', type: 'bot', name: 'Bot', clientId: 'direct'},
      {
        id: 'a2',
        ouId: 'ou-1',
        type: 'bot',
        name: 'Other',
        inboundAuthConfig: [{type: 'oauth2', config: {clientId: 'from-config'}}],
      },
    ]);

    expect(page.totalResults).toBe(2);
    expect(page.startIndex).toBe(1);
    expect(page.agents[0]).toMatchObject({id: 'a1', ouHandle: 'root', name: 'Bot', clientId: 'direct'});
    expect(page.agents[1].clientId).toBe('from-config');
  });

  it('pages the agents by limit and offset', () => {
    const resources = ['a', 'b', 'c'].map((id) => ({id, ouId: 'ou', type: 'bot', name: id}));

    const page = toAgentsPage(resources, 1, 2);

    expect(page.count).toBe(1);
    expect(page.agents.map((agent) => agent.id)).toEqual(['c']);
    expect(toAgentsPage([]).agents).toEqual([]);
  });
});
