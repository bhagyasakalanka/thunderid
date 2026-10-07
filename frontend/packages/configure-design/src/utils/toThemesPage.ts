// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {ThemeListItem, ThemeListResponse, ThemeResponse} from '@thunderid/design';

/** The part of a theme the list read takes its color scheme and primary color from. */
interface ThemeColorInfo {
  defaultColorScheme?: string;
  colorSchemes?: Record<string, {palette?: {primary?: {main?: string}}}>;
}

/**
 * Builds the themes list page from the themes a gateway runs, each in its GET-by-id shape. As the
 * live list read does, each item carries the default color scheme and that scheme's primary color,
 * and the page is cut by the same limit and offset.
 *
 * @param resources - The themes the gateway runs
 * @param limit - Maximum number of themes on the page
 * @param offset - Number of themes skipped before the page
 * @returns The page, in the live list read's shape
 */
export default function toThemesPage(resources: unknown[], limit = 30, offset = 0): ThemeListResponse {
  const themes: ThemeListItem[] = (resources as ThemeResponse[]).map((theme: ThemeResponse): ThemeListItem => {
    const info: ThemeColorInfo = (theme.theme ?? {}) as unknown as ThemeColorInfo;
    const defaultColorScheme: string = info.defaultColorScheme ?? '';
    return {
      id: theme.id,
      handle: theme.handle,
      displayName: theme.displayName,
      description: theme.description,
      defaultColorScheme,
      primaryColor: defaultColorScheme ? (info.colorSchemes?.[defaultColorScheme]?.palette?.primary?.main ?? '') : '',
      isReadOnly: theme.isReadOnly,
    };
  });
  const page: ThemeListItem[] = themes.slice(offset, offset + limit);
  return {totalResults: themes.length, startIndex: offset + 1, count: page.length, themes: page, links: []};
}
