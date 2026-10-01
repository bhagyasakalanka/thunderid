// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {ValueReference} from '../models/gateway';

/** One resource's values: the resource is known by its name, or its id when it has none. */
export interface ResourceValues {
  key: string;
  label: string | null;
  names: string[];
}

/** The resources of one type, or the values no reference explains under a null type. */
export interface ResourceTypeValues {
  resourceType: string | null;
  resources: ResourceValues[];
}

const byLabel = (a: string, b: string): number => a.localeCompare(b, undefined, {sensitivity: 'base'});

/**
 * Groups value names by the type of resource that refers to them and then by the resource. A value
 * referred to from more than one resource goes with the first. Values no reference explains come
 * last, under a null type.
 */
export default function groupByResource(
  names: string[],
  byName: ReadonlyMap<string, ValueReference[]>,
): ResourceTypeValues[] {
  const types = new Map<string | null, Map<string, ResourceValues>>();
  [...names].sort().forEach((name: string) => {
    const reference = byName.get(name)?.[0];
    const resourceType = reference?.resourceType ?? null;
    const identity = reference ? (reference.resourceId ?? reference.resourceName ?? '') : '';
    const key = `${resourceType ?? ''}/${identity}`;
    const resources = types.get(resourceType) ?? new Map<string, ResourceValues>();
    const resource = resources.get(key) ?? {
      key,
      label: reference ? (reference.resourceName ?? reference.resourceId ?? null) : null,
      names: [],
    };
    resource.names.push(name);
    resources.set(key, resource);
    types.set(resourceType, resources);
  });

  return [...types.entries()]
    .sort(([a], [b]) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return byLabel(a, b);
    })
    .map(([resourceType, resources]) => ({
      resourceType,
      resources: [...resources.values()].sort((a, b) => byLabel(a.label ?? '', b.label ?? '')),
    }));
}
