// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {UseQueryResult} from '@tanstack/react-query';
import {useAppliedConfiguration, type AppliedConfiguration} from '@thunderid/components';
import {useEnvironment} from '@thunderid/contexts';

/**
 * Shows a list of what an agent belongs to as the console's mode has it. In write mode the live
 * read is shown; in read-only mode the list is built from the configuration the gateway runs.
 *
 * @param live - The live read of the list
 * @param toPage - Builds the list from the configuration the gateway runs
 * @returns The read to show
 */
export default function useAgentMemberships<T>(
  live: UseQueryResult<T>,
  toPage: (configuration: AppliedConfiguration) => T,
): UseQueryResult<T> {
  const {gateway} = useEnvironment();
  const configuration: UseQueryResult<AppliedConfiguration> = useAppliedConfiguration(gateway?.id);

  if (!gateway) {
    return live;
  }
  return {
    ...configuration,
    data: configuration.data ? toPage(configuration.data) : undefined,
  } as unknown as UseQueryResult<T>;
}
