// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {UseQueryResult} from '@tanstack/react-query';
import {useAppliedConfiguration, type AppliedConfiguration, type AppliedResource} from '@thunderid/components';
import {useEnvironment} from '@thunderid/contexts';
import {useMemo} from 'react';
import type {OrganizationUnit} from '../models/organization-unit';

/**
 * The organization units the gateway shown runs, each as `GET /organization-units/{id}` returns it.
 *
 * A tree reads its units a level at a time, so it takes them all here, once, and pages each level
 * itself. The list keeps its identity while the configuration does, so a tree built from it is not
 * built again on every render.
 *
 * @returns The read of the units in read-only mode, or `undefined` in write mode
 */
export default function useAppliedOrganizationUnits(): UseQueryResult<OrganizationUnit[]> | undefined {
  const {gateway} = useEnvironment();
  const configuration: UseQueryResult<AppliedConfiguration> = useAppliedConfiguration(gateway?.id);
  const units: OrganizationUnit[] | undefined = useMemo(
    () =>
      configuration.data?.resources
        .filter((applied: AppliedResource) => applied.resourceType === 'organization_unit')
        .map((applied: AppliedResource) => applied.resource as OrganizationUnit),
    [configuration.data],
  );

  if (!gateway) {
    return undefined;
  }
  return {...configuration, data: units} as unknown as UseQueryResult<OrganizationUnit[]>;
}
