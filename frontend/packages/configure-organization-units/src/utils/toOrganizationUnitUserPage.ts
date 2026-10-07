// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {User} from '@thunderid/types';
import type {OrganizationUnitUserListResponse} from '../models/responses';

/**
 * Builds a page of an organization unit's users from the users a gateway runs, each as
 * `GET /users/{id}` returns it, as `GET /organization-units/{id}/users` lists them.
 *
 * @param resources - The users the gateway runs
 * @param organizationUnitId - The unit whose users to list
 * @param params - The page to build
 * @returns The page, in the shape the list returns
 */
export default function toOrganizationUnitUserPage(
  resources: unknown[],
  organizationUnitId: string,
  params: {limit: number; offset: number},
): OrganizationUnitUserListResponse {
  const users: User[] = (resources as User[]).filter((user: User) => user.ouId === organizationUnitId);
  const page: User[] = users.slice(params.offset, params.offset + params.limit);

  return {totalResults: users.length, startIndex: params.offset + 1, count: page.length, users: page};
}
