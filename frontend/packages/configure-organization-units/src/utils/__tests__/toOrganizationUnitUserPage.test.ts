// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import toOrganizationUnitUserPage from '../toOrganizationUnitUserPage';

const USERS = [
  {id: 'u-1', ouId: 'ou-1', type: 'person'},
  {id: 'u-2', ouId: 'ou-2', type: 'person'},
  {id: 'u-3', ouId: 'ou-1', type: 'person'},
];

describe('toOrganizationUnitUserPage', () => {
  it('lists the users of the unit', () => {
    const page = toOrganizationUnitUserPage(USERS, 'ou-1', {limit: 30, offset: 0});

    expect(page.users.map((user) => user.id)).toEqual(['u-1', 'u-3']);
    expect(page).toMatchObject({totalResults: 2, startIndex: 1, count: 2});
  });

  it('pages the users', () => {
    const page = toOrganizationUnitUserPage(USERS, 'ou-1', {limit: 1, offset: 1});

    expect(page.users.map((user) => user.id)).toEqual(['u-3']);
    expect(page).toMatchObject({totalResults: 2, startIndex: 2, count: 1});
  });
});
