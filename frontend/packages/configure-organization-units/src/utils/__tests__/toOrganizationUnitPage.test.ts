// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import toOrganizationUnitPage from '../toOrganizationUnitPage';

const UNITS = [
  {id: 'ou-1', handle: 'root', name: 'Root', parent: null},
  {id: 'ou-2', handle: 'eng', name: 'Engineering', parent: 'ou-1'},
  {id: 'ou-3', handle: 'sales', name: 'Sales', parent: 'ou-1'},
  {id: 'ou-4', handle: 'orphan', name: 'Orphan', parent: 'not-applied'},
  {id: 'ou-5', handle: 'other', name: 'Other'},
];

describe('toOrganizationUnitPage', () => {
  it('lists the root units, with a unit whose parent is not run as a root', () => {
    const page = toOrganizationUnitPage(UNITS, null, {limit: 30, offset: 0});

    expect(page.organizationUnits.map((unit) => unit.id)).toEqual(['ou-1', 'ou-4', 'ou-5']);
    expect(page).toMatchObject({totalResults: 3, startIndex: 1, count: 3});
  });

  it('lists the children of a unit', () => {
    const page = toOrganizationUnitPage(UNITS, 'ou-1', {limit: 30, offset: 0});

    expect(page.organizationUnits.map((unit) => unit.id)).toEqual(['ou-2', 'ou-3']);
    expect(page.totalResults).toBe(2);
  });

  it('pages the units', () => {
    const page = toOrganizationUnitPage(UNITS, 'ou-1', {limit: 1, offset: 1});

    expect(page.organizationUnits.map((unit) => unit.id)).toEqual(['ou-3']);
    expect(page).toMatchObject({totalResults: 2, startIndex: 2, count: 1});
  });

  it('lists no children of a leaf unit', () => {
    expect(toOrganizationUnitPage(UNITS, 'ou-2', {limit: 30, offset: 0})).toEqual({
      totalResults: 0,
      startIndex: 1,
      count: 0,
      organizationUnits: [],
    });
  });
});
