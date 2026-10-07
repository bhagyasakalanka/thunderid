// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, it, expect} from 'vitest';
import toResourceServersPage from '../toResourceServersPage';

const server = (id: string): Record<string, unknown> => ({
  id,
  name: `Server ${id}`,
  identifier: `https://${id}.example.com`,
  ouId: 'ou-1',
  delimiter: ':',
  type: 'api',
  authorizationEngine: {type: 'rbac'},
});

describe('toResourceServersPage', () => {
  it('maps each applied resource server to a list row', () => {
    const page = toResourceServersPage([server('a')], 10, 0);

    expect(page).toEqual({
      totalResults: 1,
      startIndex: 1,
      count: 1,
      resourceServers: [
        {
          id: 'a',
          name: 'Server a',
          description: undefined,
          identifier: 'https://a.example.com',
          ouId: 'ou-1',
          delimiter: ':',
          isReadOnly: undefined,
          type: 'api',
        },
      ],
    });
  });

  it('pages the applied resource servers by limit and offset', () => {
    const page = toResourceServersPage([server('a'), server('b'), server('c')], 2, 2);

    expect(page.totalResults).toBe(3);
    expect(page.startIndex).toBe(3);
    expect(page.count).toBe(1);
    expect(page.resourceServers.map((rs) => rs.id)).toEqual(['c']);
  });

  it('returns an empty page when the gateway runs no resource servers', () => {
    expect(toResourceServersPage([], 10, 0)).toEqual({totalResults: 0, startIndex: 1, count: 0, resourceServers: []});
  });
});
