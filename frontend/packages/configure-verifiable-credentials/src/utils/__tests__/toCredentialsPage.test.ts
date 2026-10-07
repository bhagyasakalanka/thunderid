// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import toCredentialsPage from '../toCredentialsPage';

describe('toCredentialsPage', () => {
  it('maps each applied credential configuration to a list row', () => {
    expect(
      toCredentialsPage([
        {
          id: 'vc-1',
          handle: 'pid',
          ouId: 'ou-1',
          ouHandle: 'default',
          name: 'PID',
          description: 'Person identification',
          format: 'dc+sd-jwt',
          vct: 'urn:pid',
          claims: [{name: 'given_name'}],
        },
      ]),
    ).toEqual([
      {id: 'vc-1', handle: 'pid', ouId: 'ou-1', ouHandle: 'default', name: 'PID', format: 'dc+sd-jwt', vct: 'urn:pid'},
    ]);
  });

  it('returns an empty list when the gateway runs no credential configurations', () => {
    expect(toCredentialsPage([])).toEqual([]);
  });
});
