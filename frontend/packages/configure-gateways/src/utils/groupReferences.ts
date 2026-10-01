// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {ValueReference} from '../models/gateway';

/**
 * A value named in a group: its name and kind, and every place a version refers to it. A value with
 * no reference known has none.
 */
export interface ReferencedValue {
  name: string;
  kind: ValueReference['kind'];
  references: ValueReference[];
}

/**
 * Values gathered under the resource type that refers to them. A value without a known reference is
 * under `resourceType` null.
 */
export interface ReferenceGroup {
  resourceType: string | null;
  values: ReferencedValue[];
}

/**
 * Groups values by the resource type that refers to them, in the order the types first appear, with
 * values no reference names last. A value several resource types refer to is under the first.
 */
export default function groupReferences(
  values: {name: string; kind: ValueReference['kind']}[],
  references: ValueReference[] = [],
): ReferenceGroup[] {
  const groups = new Map<string | null, ReferencedValue[]>();
  values.forEach((value) => {
    const own = references.filter(
      (reference: ValueReference) => reference.name === value.name && reference.kind === value.kind,
    );
    const resourceType = own[0]?.resourceType ?? null;
    groups.set(resourceType, [...(groups.get(resourceType) ?? []), {...value, references: own}]);
  });
  const ordered = [...groups.entries()].sort(([a], [b]) => (a === null ? 1 : 0) - (b === null ? 1 : 0));
  return ordered.map(([resourceType, grouped]) => ({resourceType, values: grouped}));
}
