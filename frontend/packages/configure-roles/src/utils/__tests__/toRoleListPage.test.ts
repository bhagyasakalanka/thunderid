// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import toRoleListPage from '../toRoleListPage';

const ROLES = [
  {id: 'r-1', name: 'Admin', ouId: 'ou-1', permissions: [{resourceServerId: 'rs-1', permissions: ['read']}]},
  {id: 'r-2', name: 'Viewer', description: 'Reads', ouId: 'ou-1'},
  {id: 'r-3', name: 'Editor', ouId: 'ou-2', isReadOnly: true},
];

describe('toRoleListPage', () => {
  it('lists the roles as the list returns them, without their permissions', () => {
    const page = toRoleListPage(ROLES, {limit: 10, offset: 0});

    expect(page.totalResults).toBe(3);
    expect(page.startIndex).toBe(1);
    expect(page.count).toBe(3);
    expect(page.roles[0]).toEqual({
      id: 'r-1',
      name: 'Admin',
      description: undefined,
      ouId: 'ou-1',
      ouHandle: undefined,
      isReadOnly: undefined,
    });
    expect(page.roles[0]).not.toHaveProperty('permissions');
  });

  it('pages the roles', () => {
    const page = toRoleListPage(ROLES, {limit: 2, offset: 2});

    expect(page.totalResults).toBe(3);
    expect(page.startIndex).toBe(3);
    expect(page.count).toBe(1);
    expect(page.roles.map((role) => role.id)).toEqual(['r-3']);
  });
});
