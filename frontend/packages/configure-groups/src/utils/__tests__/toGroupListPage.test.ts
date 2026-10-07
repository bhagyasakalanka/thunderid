// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import toGroupListPage from '../toGroupListPage';

const GROUPS = [
  {id: 'g-1', name: 'Admins', ouId: 'ou-1', members: [{id: 'u-1', type: 'user'}]},
  {id: 'g-2', name: 'Support', description: 'Helps', ouId: 'ou-1'},
  {id: 'g-3', name: 'Sales', ouId: 'ou-2', isReadOnly: true},
];

describe('toGroupListPage', () => {
  it('lists the groups as the list returns them, without their members', () => {
    const page = toGroupListPage(GROUPS, {limit: 10, offset: 0});

    expect(page.totalResults).toBe(3);
    expect(page.startIndex).toBe(1);
    expect(page.count).toBe(3);
    expect(page.groups[0]).toEqual({
      id: 'g-1',
      name: 'Admins',
      description: undefined,
      ouId: 'ou-1',
      ouHandle: undefined,
      isReadOnly: undefined,
    });
    expect(page.groups[0]).not.toHaveProperty('members');
  });

  it('pages the groups', () => {
    const page = toGroupListPage(GROUPS, {limit: 2, offset: 2});

    expect(page.totalResults).toBe(3);
    expect(page.startIndex).toBe(3);
    expect(page.count).toBe(1);
    expect(page.groups.map((group) => group.id)).toEqual(['g-3']);
  });
});
