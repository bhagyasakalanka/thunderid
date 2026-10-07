// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import toLayoutsPage from '../toLayoutsPage';

describe('toLayoutsPage', () => {
  it('maps each layout to a list item, keeping its layout configuration', () => {
    const page = toLayoutsPage([{id: 'l1', handle: 'centered', displayName: 'Centered', layout: {screens: {}}}]);

    expect(page).toEqual({
      totalResults: 1,
      startIndex: 1,
      count: 1,
      links: [],
      layouts: [{id: 'l1', handle: 'centered', displayName: 'Centered', layout: {screens: {}}}],
    });
  });

  it('pages the layouts by limit and offset', () => {
    const resources = ['a', 'b', 'c'].map((id) => ({id, handle: id, displayName: id, layout: {}}));

    expect(toLayoutsPage(resources, 1, 2).layouts.map((layout) => layout.id)).toEqual(['c']);
    expect(toLayoutsPage([]).layouts).toEqual([]);
  });
});
