// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {UseQueryResult} from '@tanstack/react-query';
import {useEnvironment, type Environment} from '@thunderid/contexts';
import {useMemo} from 'react';
import type {AppliedConfiguration, AppliedResource, StoredValue} from './models';
import {useAppliedConfiguration, useStoredValues} from './useEnvironmentValues';
import {resolveReferences} from './values';

/**
 * Where a page's resource comes from.
 *
 * - `live`: write mode, or no gateway at all. The resource is this deployment's, as it stands.
 * - `applied`: read-only mode, and the gateway runs the resource: it is shown from what the gateway
 *   applied.
 * - `missing`: read-only mode, and the gateway does not run the resource, so there is nothing to show.
 *
 * @public
 */
export type EnvironmentResourceSource = 'live' | 'applied' | 'missing';

/**
 * Where a page shows a resource from, and what the gateway it is shown for applied.
 *
 * @public
 */
export interface EnvironmentPresence {
  /** The gateway shown, in read-only mode only. */
  gateway?: Environment;
  /** Where the resource is shown from. */
  source: EnvironmentResourceSource;
  /** The hash of the version the gateway applied, when it applied one. */
  version?: string;
  /** Whether what the gateway runs is still being read. */
  isLoading: boolean;
}

/**
 * Reads the configuration a gateway runs with the values it holds put in for the references its
 * resources carry, so a page shows what the gateway runs rather than the names of its values. The
 * values are read once for every page; when they cannot be read the references are shown as they are.
 */
function useAppliedView(gatewayId: string | undefined): UseQueryResult<AppliedConfiguration> {
  const configuration: UseQueryResult<AppliedConfiguration> = useAppliedConfiguration(gatewayId);
  const variables: UseQueryResult<StoredValue[]> = useStoredValues(gatewayId ?? '', 'variable', Boolean(gatewayId));
  const secrets: UseQueryResult<StoredValue[]> = useStoredValues(gatewayId ?? '', 'secret', Boolean(gatewayId));

  const data: AppliedConfiguration | undefined = useMemo(() => {
    if (!configuration.data) {
      return undefined;
    }
    const held = new Map<string, string>(
      (variables.data ?? []).flatMap((variable: StoredValue) =>
        variable.value === undefined ? [] : [[variable.name, variable.value] as [string, string]],
      ),
    );
    const set = new Set<string>(
      (secrets.data ?? []).filter((secret: StoredValue) => secret.exists).map((secret: StoredValue) => secret.name),
    );
    return {
      ...configuration.data,
      resources: configuration.data.resources.map((applied: AppliedResource) => ({
        ...applied,
        resource: resolveReferences(applied.resource, held, set),
        parts: applied.parts ? (resolveReferences(applied.parts, held, set) as Record<string, unknown>) : undefined,
      })),
    };
  }, [configuration.data, variables.data, secrets.data]);

  return {
    ...configuration,
    data,
    isLoading: configuration.isLoading || variables.isLoading || secrets.isLoading,
  } as UseQueryResult<AppliedConfiguration>;
}

/**
 * Finds a resource in the configuration a gateway runs, by its type and its id, or its name for one
 * exported without an id.
 */
function findApplied(
  configuration: AppliedConfiguration | undefined,
  resourceType: string,
  resourceId: string | undefined,
): AppliedResource | undefined {
  return configuration?.resources.find(
    (applied: AppliedResource) => applied.resourceType === resourceType && applied.id === resourceId,
  );
}

/**
 * Works out where a page shows a resource from: in read-only mode, whether the gateway shown runs it.
 * In write mode, or with no gateway, the resource is always shown live and nothing is asked.
 *
 * @public
 */
export function useEnvironmentPresence(resourceType: string, resourceId?: string): EnvironmentPresence {
  const {gateway} = useEnvironment();
  const {data: configuration, isLoading} = useAppliedView(gateway?.id);

  if (!gateway) {
    return {source: 'live', isLoading: false};
  }
  if (isLoading) {
    return {gateway, source: 'live', isLoading: true};
  }
  return {
    gateway,
    source: findApplied(configuration, resourceType, resourceId) ? 'applied' : 'missing',
    version: configuration?.version,
    isLoading: false,
  };
}

/**
 * The resource a page shows, and where it came from.
 *
 * @public
 */
export type EnvironmentResourceResult<T> = UseQueryResult<T> & {presence: EnvironmentPresence};

/**
 * Shows a resource, or a part of it such as a group's members, as the console's mode has it.
 *
 * A page reads the resource as it always does and hands that read here. In write mode that read is
 * what the page shows. In read-only mode the resource is taken from the configuration the gateway
 * shown runs, in the same shape, and a resource the gateway does not run has no data; the page is
 * read-only either way, which `useEnvironment().readOnly` tells it.
 *
 * @param resourceType - The type of the resource, as an export names it, e.g. `application`
 * @param resourceId - The resource's identifier, or its name for one exported without an id
 * @param live - The page's own read of the resource, or of the part
 * @param part - The part, as the resource's own API names it below the resource, e.g. `members`
 * @returns The read to show, with where it came from
 *
 * @public
 */
export function useEnvironmentResource<T>(
  resourceType: string,
  resourceId: string | undefined,
  live: UseQueryResult<T>,
  part?: string,
): EnvironmentResourceResult<T> {
  const {gateway} = useEnvironment();
  const configuration: UseQueryResult<AppliedConfiguration> = useAppliedView(gateway?.id);
  const presence: EnvironmentPresence = useEnvironmentPresence(resourceType, resourceId);

  if (!gateway) {
    return {...live, presence} as EnvironmentResourceResult<T>;
  }
  const applied: AppliedResource | undefined = findApplied(configuration.data, resourceType, resourceId);
  const data: unknown = part ? applied?.parts?.[part] : applied?.resource;
  return {
    ...configuration,
    data,
    presence,
  } as unknown as EnvironmentResourceResult<T>;
}

/**
 * Shows a list page's resources as the console's mode has it.
 *
 * In write mode the page's own read is what it shows. In read-only mode the list is every resource
 * of that type the gateway shown runs, each as the resource's own read returns it, handed to `toPage`
 * to be put in the shape the page's own list read returns.
 *
 * @param resourceType - The type of the resources, as an export names it, e.g. `application`
 * @param live - The page's own read of the list
 * @param toPage - Builds the page's list shape from the gateway's resources
 * @returns The read to show
 *
 * @public
 */
export function useEnvironmentList<T>(
  resourceType: string,
  live: UseQueryResult<T>,
  toPage: (resources: unknown[]) => T,
): UseQueryResult<T> {
  const {gateway} = useEnvironment();
  const configuration: UseQueryResult<AppliedConfiguration> = useAppliedView(gateway?.id);

  let key: string | undefined;
  if (gateway && configuration.data) {
    const resources: unknown[] = configuration.data.resources
      .filter((applied: AppliedResource) => applied.resourceType === resourceType)
      .map((applied: AppliedResource) => applied.resource);
    key = JSON.stringify(toPage(resources));
  }
  // The page is built on every render, so it is kept by what it says: a page that reacts to its list
  // changing must not see a new list on every render.
  const data: T | undefined = useMemo(() => (key === undefined ? undefined : (JSON.parse(key) as T)), [key]);

  if (!gateway) {
    return live;
  }
  return {...configuration, data} as unknown as UseQueryResult<T>;
}
