// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import toThemesPage from '../toThemesPage';

describe('toThemesPage', () => {
  it('maps each theme to a list item with its default scheme and that scheme primary color', () => {
    const page = toThemesPage([
      {
        id: 't1',
        handle: 'brand',
        displayName: 'Brand',
        theme: {
          defaultColorScheme: 'dark',
          colorSchemes: {light: {palette: {primary: {main: '#fff'}}}, dark: {palette: {primary: {main: '#123456'}}}},
        },
      },
      {id: 't2', handle: 'plain', displayName: 'Plain', theme: {}, isReadOnly: true},
    ]);

    expect(page.totalResults).toBe(2);
    expect(page.themes[0]).toMatchObject({id: 't1', defaultColorScheme: 'dark', primaryColor: '#123456'});
    expect(page.themes[1]).toMatchObject({id: 't2', defaultColorScheme: '', primaryColor: '', isReadOnly: true});
  });

  it('pages the themes by limit and offset', () => {
    const resources = ['a', 'b', 'c'].map((id) => ({id, handle: id, displayName: id, theme: {}}));

    const page = toThemesPage(resources, 2, 1);

    expect(page.startIndex).toBe(2);
    expect(page.count).toBe(2);
    expect(page.themes.map((theme) => theme.id)).toEqual(['b', 'c']);
  });
});
