// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {User} from '@thunderid/types';
import type {UserListResponse} from '../models/users';

/**
 * Builds the users list from the users a gateway runs, each as `GET /users/{id}` returns it.
 *
 * The live list is read whole and paged in the table, so every user is listed.
 *
 * @param resources - The users the gateway runs
 * @returns The list, in the shape `GET /users` returns
 */
export default function toUserListPage(resources: unknown[]): UserListResponse {
  const users: User[] = resources as User[];

  return {totalResults: users.length, startIndex: 1, count: users.length, users};
}
