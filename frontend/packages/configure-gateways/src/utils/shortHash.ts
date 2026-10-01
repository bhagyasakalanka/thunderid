// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/** How many characters of a version's hash are shown; the server takes as few to name it. */
export const SHORT_HASH_LENGTH = 7;

/** The part of a version's hash that is shown. */
export default function shortHash(hash: string): string {
  return hash.slice(0, SHORT_HASH_LENGTH);
}
