// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import toPresentationsPage from '../toPresentationsPage';

describe('toPresentationsPage', () => {
  it('maps each applied presentation definition to a list row', () => {
    expect(
      toPresentationsPage([
        {
          id: 'vp-1',
          handle: 'age',
          ouId: 'ou-1',
          name: 'Age check',
          description: 'Over 18',
          format: 'dc+sd-jwt',
          vct: 'urn:pid',
          mandatoryClaims: ['age_over_18'],
        },
      ]),
    ).toEqual([
      {
        id: 'vp-1',
        handle: 'age',
        ouId: 'ou-1',
        ouHandle: undefined,
        name: 'Age check',
        format: 'dc+sd-jwt',
        vct: 'urn:pid',
      },
    ]);
  });

  it('returns an empty list when the gateway runs no presentation definitions', () => {
    expect(toPresentationsPage([])).toEqual([]);
  });
});
