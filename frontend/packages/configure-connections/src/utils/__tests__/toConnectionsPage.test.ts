// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import toConnectionsPage from '../toConnectionsPage';

describe('toConnectionsPage', () => {
  it('maps each connection to a list instance with the category of its type, ordered by type and name', () => {
    const page = toConnectionsPage([
      {id: 's1', name: 'Twilio', type: 'twilio', accountSid: 'AC1'},
      {id: 'g1', name: 'Google', type: 'google', clientId: 'x'},
      {id: 'o2', name: 'beta', type: 'oidc', idJagEnabled: true},
      {id: 'o1', name: 'Alpha', type: 'oidc'},
    ]);

    expect(page.totalResults).toBe(4);
    expect(page.startIndex).toBe(1);
    expect(page.connections).toEqual([
      {id: 'g1', name: 'Google', description: undefined, type: 'google', categories: ['identity-provider']},
      {id: 'o1', name: 'Alpha', description: undefined, type: 'oidc', categories: ['identity-provider']},
      {
        id: 'o2',
        name: 'beta',
        description: undefined,
        type: 'oidc',
        categories: ['identity-provider'],
        idJagEnabled: true,
      },
      {id: 's1', name: 'Twilio', description: undefined, type: 'twilio', categories: ['sms-provider']},
    ]);
  });

  it('filters by category and pages by limit and offset', () => {
    const resources = [
      {id: 'a', name: 'A', type: 'oidc'},
      {id: 'b', name: 'B', type: 'oidc'},
      {id: 'p', name: 'PDP', type: 'authzen-pdp'},
    ];

    expect(toConnectionsPage(resources, {category: 'authorization-pdp'}).connections.map((c) => c.id)).toEqual(['p']);
    const page = toConnectionsPage(resources, {limit: 1, offset: 1});
    expect(page.count).toBe(1);
    expect(page.totalResults).toBe(3);
    expect(page.connections[0].id).toBe('a');
  });

  it('leaves out a connection of a type the list does not serve', () => {
    expect(toConnectionsPage([{id: 'x', name: 'X', type: 'unknown'}]).connections).toEqual([]);
  });
});
