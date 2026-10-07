// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {LayoutListItem, LayoutListResponse, LayoutResponse} from '@thunderid/design';

/**
 * Builds the layouts list page from the layouts a gateway runs, each in its GET-by-id shape, cut
 * by the same limit and offset the live list read applies on the server.
 *
 * @param resources - The layouts the gateway runs
 * @param limit - Maximum number of layouts on the page
 * @param offset - Number of layouts skipped before the page
 * @returns The page, in the live list read's shape
 */
export default function toLayoutsPage(resources: unknown[], limit = 30, offset = 0): LayoutListResponse {
  const layouts: LayoutListItem[] = (resources as LayoutResponse[]).map(
    (layout: LayoutResponse): LayoutListItem => ({
      id: layout.id,
      handle: layout.handle,
      displayName: layout.displayName,
      layout: layout.layout ?? null,
    }),
  );
  const page: LayoutListItem[] = layouts.slice(offset, offset + limit);
  return {totalResults: layouts.length, startIndex: offset + 1, count: page.length, layouts: page, links: []};
}
