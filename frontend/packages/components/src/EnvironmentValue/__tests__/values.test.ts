// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import {MASKED_SECRET, resolveReferences} from '../values';

const variables = new Map<string, string>([
  ['CLIENT_ID', 'orders-client'],
  ['REDIRECT_URIS', '["https://one.test/cb","https://two.test/cb"]'],
]);
const secrets = new Set<string>(['CLIENT_SECRET']);

describe('resolveReferences', () => {
  it('puts in the values a gateway holds, wherever they are', () => {
    expect(
      resolveReferences(
        {
          clientId: 'var:CLIENT_ID',
          clientSecret: 'sec:CLIENT_SECRET',
          inbound: [{config: {redirectUris: ['var:REDIRECT_URIS', 'https://kept.test/cb']}}],
          name: 'Orders',
          count: 2,
          none: null,
        },
        variables,
        secrets,
      ),
    ).toEqual({
      clientId: 'orders-client',
      clientSecret: MASKED_SECRET,
      inbound: [{config: {redirectUris: ['https://one.test/cb', 'https://two.test/cb', 'https://kept.test/cb']}}],
      name: 'Orders',
      count: 2,
      none: null,
    });
  });

  it('leaves a reference the gateway does not hold as it is, and text that only contains one', () => {
    expect(resolveReferences('var:MISSING', variables, secrets)).toBe('var:MISSING');
    expect(resolveReferences('sec:MISSING', variables, secrets)).toBe('sec:MISSING');
    expect(resolveReferences('see var:CLIENT_ID here', variables, secrets)).toBe('see var:CLIENT_ID here');
  });

  it('keeps a list variable whole where a single value belongs, and a plain variable as one item', () => {
    expect(resolveReferences({uris: 'var:REDIRECT_URIS'}, variables, secrets)).toEqual({
      uris: '["https://one.test/cb","https://two.test/cb"]',
    });
    expect(resolveReferences(['var:CLIENT_ID'], variables, secrets)).toEqual(['orders-client']);
  });
});
