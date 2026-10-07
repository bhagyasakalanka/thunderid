// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {Role, RoleListResponse, RoleSummary} from '../models/role';

/**
 * Builds a page of the roles list from the roles a gateway runs, each as `GET /roles/{id}` returns
 * it, paged as `GET /roles` pages it.
 *
 * @param resources - The roles the gateway runs
 * @param params - The page to build
 * @returns The page, in the shape `GET /roles` returns
 */
export default function toRoleListPage(
  resources: unknown[],
  params: {limit: number; offset: number},
): RoleListResponse {
  const roles: RoleSummary[] = (resources as Role[]).map(
    ({id, name, description, ouId, ouHandle, isReadOnly}: Role): RoleSummary => ({
      id,
      name,
      description,
      ouId,
      ouHandle,
      isReadOnly,
    }),
  );
  const page: RoleSummary[] = roles.slice(params.offset, params.offset + params.limit);

  return {totalResults: roles.length, startIndex: params.offset + 1, count: page.length, roles: page};
}
