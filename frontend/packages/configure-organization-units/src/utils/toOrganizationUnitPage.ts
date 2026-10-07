// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {OrganizationUnit} from '../models/organization-unit';
import type {OrganizationUnitListResponse} from '../models/responses';

/**
 * Builds a page of organization units from the ones a gateway runs, each as
 * `GET /organization-units/{id}` returns it: the root units, as `GET /organization-units` lists them,
 * or the children of one unit, as `GET /organization-units/{id}/ous` lists them.
 *
 * A unit whose parent the gateway does not run is listed as a root, so that it is still reached.
 *
 * @param resources - The organization units the gateway runs
 * @param parentId - The unit whose children to list, or `null` for the root units
 * @param params - The page to build
 * @returns The page, in the shape the list returns
 */
export default function toOrganizationUnitPage(
  resources: unknown[],
  parentId: string | null,
  params: {limit: number; offset: number},
): OrganizationUnitListResponse {
  const units: OrganizationUnit[] = resources as OrganizationUnit[];
  const ids = new Set<string>(units.map((unit: OrganizationUnit) => unit.id));
  const listed: OrganizationUnit[] = units.filter((unit: OrganizationUnit) =>
    parentId === null ? !unit.parent || !ids.has(unit.parent) : unit.parent === parentId,
  );
  const page: OrganizationUnit[] = listed.slice(params.offset, params.offset + params.limit);

  return {totalResults: listed.length, startIndex: params.offset + 1, count: page.length, organizationUnits: page};
}
