// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import type {ApiUserType} from '../../types/user-types';
import toUserTypeListPage from '../toUserTypeListPage';

describe('toUserTypeListPage', () => {
  it('lists every user type the gateway runs, without its schema', () => {
    const employee: ApiUserType = {
      id: 'ut-1',
      handle: 'employee',
      displayName: 'Employee',
      ouId: 'ou-1',
      allowSelfRegistration: true,
      schema: {email: {type: 'string'}},
      isReadOnly: true,
    };

    const page = toUserTypeListPage([employee]);

    expect(page).toEqual({
      totalResults: 1,
      startIndex: 1,
      count: 1,
      types: [
        {
          id: 'ut-1',
          handle: 'employee',
          displayName: 'Employee',
          ouId: 'ou-1',
          ouHandle: undefined,
          allowSelfRegistration: true,
          systemAttributes: undefined,
          isReadOnly: true,
        },
      ],
    });
    expect(page.types[0]).not.toHaveProperty('schema');
  });

  it('builds an empty list when the gateway runs no user types', () => {
    expect(toUserTypeListPage([])).toEqual({totalResults: 0, startIndex: 1, count: 0, types: []});
  });
});
