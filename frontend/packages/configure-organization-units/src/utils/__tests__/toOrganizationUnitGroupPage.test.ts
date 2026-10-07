// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import toOrganizationUnitGroupPage from '../toOrganizationUnitGroupPage';

const GROUPS = [
  {id: 'g-1', name: 'Admins', ouId: 'ou-1', members: [{id: 'u-1', type: 'user'}]},
  {id: 'g-2', name: 'Support', ouId: 'ou-2'},
  {id: 'g-3', name: 'Sales', ouId: 'ou-1'},
];

describe('toOrganizationUnitGroupPage', () => {
  it('lists the groups of the unit, without their members', () => {
    const page = toOrganizationUnitGroupPage(GROUPS, 'ou-1', {limit: 30, offset: 0});

    expect(page.groups).toEqual([
      {id: 'g-1', name: 'Admins', ouId: 'ou-1'},
      {id: 'g-3', name: 'Sales', ouId: 'ou-1'},
    ]);
    expect(page).toMatchObject({totalResults: 2, startIndex: 1, count: 2});
  });

  it('pages the groups', () => {
    const page = toOrganizationUnitGroupPage(GROUPS, 'ou-1', {limit: 1, offset: 1});

    expect(page.groups.map((group) => group.id)).toEqual(['g-3']);
    expect(page).toMatchObject({totalResults: 2, startIndex: 2, count: 1});
  });
});
