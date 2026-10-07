// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {ApiUserType, UserTypeListItem, UserTypeListResponse} from '../types/user-types';

/**
 * Builds the user types list from the user types a gateway runs, each as `GET /user-types/{id}`
 * returns it.
 *
 * The live list is read whole and paged in the table, so every user type is listed.
 *
 * @param resources - The user types the gateway runs
 * @returns The list, in the shape `GET /user-types` returns
 */
export default function toUserTypeListPage(resources: unknown[]): UserTypeListResponse {
  const types: UserTypeListItem[] = (resources as ApiUserType[]).map(
    ({id, handle, displayName, ouId, ouHandle, allowSelfRegistration, systemAttributes, isReadOnly}: ApiUserType) => ({
      id,
      handle,
      displayName,
      ouId,
      ouHandle,
      allowSelfRegistration,
      systemAttributes,
      isReadOnly,
    }),
  );

  return {totalResults: types.length, startIndex: 1, count: types.length, types};
}
