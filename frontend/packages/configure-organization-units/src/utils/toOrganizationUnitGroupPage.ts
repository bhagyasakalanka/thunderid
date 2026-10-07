// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {Group, GroupListResponse} from '../models/group';

/**
 * Builds a page of an organization unit's groups from the groups a gateway runs, each as
 * `GET /groups/{id}` returns it, as `GET /organization-units/{id}/groups` lists them.
 *
 * @param resources - The groups the gateway runs
 * @param organizationUnitId - The unit whose groups to list
 * @param params - The page to build
 * @returns The page, in the shape the list returns
 */
export default function toOrganizationUnitGroupPage(
  resources: unknown[],
  organizationUnitId: string,
  params: {limit: number; offset: number},
): GroupListResponse {
  const groups: Group[] = (resources as Group[])
    .filter((group: Group) => group.ouId === organizationUnitId)
    .map(({id, name, ouId}: Group): Group => ({id, name, ouId}));
  const page: Group[] = groups.slice(params.offset, params.offset + params.limit);

  return {totalResults: groups.length, startIndex: params.offset + 1, count: page.length, groups: page};
}
