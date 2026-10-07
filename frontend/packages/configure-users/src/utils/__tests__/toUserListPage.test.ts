// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import toUserListPage from '../toUserListPage';

describe('toUserListPage', () => {
  it('lists every user the gateway runs', () => {
    const users = [
      {id: 'u-1', ouId: 'ou-1', type: 'person'},
      {id: 'u-2', ouId: 'ou-2', type: 'person'},
    ];

    expect(toUserListPage(users)).toEqual({totalResults: 2, startIndex: 1, count: 2, users});
  });

  it('builds an empty list when the gateway runs no users', () => {
    expect(toUserListPage([])).toEqual({totalResults: 0, startIndex: 1, count: 0, users: []});
  });
});
