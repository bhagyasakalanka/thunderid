// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMemo} from 'react';
import useGetConfigurationVersion from '../api/useGetConfigurationVersion';
import type {ValueReference} from '../models/gateway';

export interface ValueReferences {
  /** Where the configuration refers to each value, by the value's name. */
  byName: ReadonlyMap<string, ValueReference[]>;
  /** Values the configuration refers to that the latest captured version does not, so no apply carries yet. */
  uncaptured: ReadonlySet<string>;
}

function byNameOf(
  references: ValueReference[] | undefined,
  kind: ValueReference['kind'],
): Map<string, ValueReference[]> {
  const byName = new Map<string, ValueReference[]>();
  (references ?? [])
    .filter((reference: ValueReference) => reference.kind === kind)
    .forEach((reference: ValueReference) => {
      byName.set(reference.name, [...(byName.get(reference.name) ?? []), reference]);
    });
  return byName;
}

/**
 * Says what each value of a kind is for. The configuration as it stands answers first, so a
 * resource's values sit with it as soon as it is written; the latest captured version answers for
 * values only it still refers to. A value the configuration refers to that the latest version does
 * not is marked uncaptured: an apply sends a captured version, so it is not on any gateway's way yet.
 */
export default function useValueReferences(kind: ValueReference['kind']): ValueReferences {
  const {data: current} = useGetConfigurationVersion('current');
  const {data: latest} = useGetConfigurationVersion('latest');

  return useMemo((): ValueReferences => {
    const currentByName = byNameOf(current?.references, kind);
    const latestByName = byNameOf(latest?.references, kind);
    const byName = new Map<string, ValueReference[]>(latestByName);
    currentByName.forEach((references, name) => byName.set(name, references));
    const uncaptured = new Set<string>([...currentByName.keys()].filter((name: string) => !latestByName.has(name)));
    return {byName, uncaptured};
  }, [current, latest, kind]);
}
