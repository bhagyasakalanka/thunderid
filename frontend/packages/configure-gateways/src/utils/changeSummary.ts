// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {humanize} from './groupByResource';
import type {Change, LineOp} from '../models/deploy';

/** The resource types a project holds; every other type is shared by the whole organization. */
const PROJECT_TYPES: readonly string[] = ['application', 'agent'];

/** Whether a change is to a resource the whole organization shares, rather than one a project holds. */
export const isShared = (change: Change): boolean => !PROJECT_TYPES.includes(change.resourceType);

/** How many fields a summary names before it stops. */
const NAMED = 3;

// A changed line that sets a key, as `  redirectUris:` or `- clientId: x`.
const KEY = /^\s*(?:-\s+)?([A-Za-z_]\w*)\s*:(?:\s|$)/;

/**
 * The fields an updated resource's change touches, spelled out, the first few of them: what the row says
 * changed. Empty when no changed line names a field.
 */
export function changedFields(lines: LineOp[] | undefined): string[] {
  const fields: string[] = [];
  (lines ?? [])
    .filter((line: LineOp) => line.kind !== ' ')
    .forEach((line: LineOp) => {
      const key = KEY.exec(line.text)?.[1];
      if (key && !fields.includes(key)) fields.push(key);
    });
  return fields.slice(0, NAMED).map(humanize);
}
