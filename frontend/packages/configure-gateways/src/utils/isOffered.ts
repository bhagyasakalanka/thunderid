// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {ResourceChange} from '../models/gateway';

/**
 * Whether a change is one an apply decides on: one that changes something, or one the gateway is set
 * to leave alone, which stays on offer until it is selected again.
 */
export default function isOffered(change: ResourceChange): boolean {
  return change.change !== 'unchanged' || Boolean(change.excluded);
}
