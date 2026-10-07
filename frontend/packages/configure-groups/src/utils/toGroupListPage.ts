// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {Group, GroupBasic, GroupListResponse} from '../models/group';

/**
 * Builds a page of the groups list from the groups a gateway runs, each as `GET /groups/{id}`
 * returns it, paged as `GET /groups` pages it.
 *
 * @param resources - The groups the gateway runs
 * @param params - The page to build
 * @returns The page, in the shape `GET /groups` returns
 */
export default function toGroupListPage(
  resources: unknown[],
  params: {limit: number; offset: number},
): GroupListResponse {
  const groups: GroupBasic[] = (resources as Group[]).map(
    ({id, name, description, ouId, ouHandle, isReadOnly}: Group): GroupBasic => ({
      id,
      name,
      description,
      ouId,
      ouHandle,
      isReadOnly,
    }),
  );
  const page: GroupBasic[] = groups.slice(params.offset, params.offset + params.limit);

  return {totalResults: groups.length, startIndex: params.offset + 1, count: page.length, groups: page};
}
