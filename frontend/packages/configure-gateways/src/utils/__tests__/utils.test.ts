// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import {apiError} from '../../__tests__/http';
import formatTimestamp from '../formatTimestamp';
import generateGatewayKey from '../generateGatewayKey';
import getApplyErrorMessage from '../getApplyErrorMessage';
import getGatewayValuesErrorMessage, {isGatewayUnreachable} from '../getGatewayValuesErrorMessage';
import groupByResource from '../groupByResource';
import groupReferences from '../groupReferences';
import {fromListText, isListValue, parseListValue, toListText} from '../listValue';
import {hasMissingValues, isMissingValuesError} from '../missingValues';
import {
  validateGatewayValueDescription,
  validateGatewayValueName,
  validateGatewayValueValue,
} from '../validateGatewayValue';
import withContext from '../withContext';

const t = (key: string, options?: Record<string, unknown>): string => {
  if (key === 'errors.GTW-5001') return 'The gateway could not apply the configuration.';
  if (key.includes('errors.')) return '';
  return `${key}|${options?.['defaultValue'] as string}`;
};

describe('formatTimestamp', () => {
  it('renders a dash when there is no timestamp', () => {
    expect(formatTimestamp(undefined)).toBe('-');
  });

  it('formats a valid timestamp for the locale', () => {
    expect(formatTimestamp('2026-01-02T03:04:05Z')).toBe(new Date('2026-01-02T03:04:05Z').toLocaleString());
  });

  it('keeps a value that is not a date as it is', () => {
    expect(formatTimestamp('not-a-date')).toBe('not-a-date');
  });
});

describe('generateGatewayKey', () => {
  it('generates distinct url-safe keys from 32 random bytes', () => {
    const first = generateGatewayKey();
    const second = generateGatewayKey();

    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first).not.toBe(second);
  });
});

describe('getApplyErrorMessage', () => {
  it('says the gateway could not be reached for a bare 502', () => {
    expect(getApplyErrorMessage(apiError(502), t)).toMatch(/^apply\.unreachable\|The gateway could not be reached/);
  });

  it('resolves a coded 502 through the error catalog', () => {
    expect(getApplyErrorMessage(apiError(502, 'GTW-5001'), t)).toBe('The gateway could not apply the configuration.');
  });

  it('falls back to the generic message for any other failure', () => {
    expect(getApplyErrorMessage(new Error('boom'), t)).toBe(
      'apply.error|The configuration could not be applied. Please try again.',
    );
  });
});

describe('missing values', () => {
  it('finds missing values only when a name is listed', () => {
    expect(hasMissingValues(undefined)).toBe(false);
    expect(hasMissingValues({variables: [], secrets: []})).toBe(false);
    expect(hasMissingValues({secrets: ['S']})).toBe(true);
    expect(hasMissingValues({variables: ['A']})).toBe(true);
  });

  it('recognises an apply refused for missing values', () => {
    expect(isMissingValuesError(apiError(409, 'GTW-1017'))).toBe(true);
    expect(isMissingValuesError(apiError(409, 'GTW-1004'))).toBe(false);
    expect(isMissingValuesError(new Error('boom'))).toBe(false);
    expect(isMissingValuesError(null)).toBe(false);
  });
});

describe('getGatewayValuesErrorMessage', () => {
  it('says the gateway could not be reached for any 502', () => {
    expect(isGatewayUnreachable(apiError(502, 'GTW-5001'))).toBe(true);
    expect(getGatewayValuesErrorMessage(apiError(502, 'GTW-5001'), t, 'variables.error', 'x')).toMatch(
      /^values\.unreachable\|The gateway could not be reached/,
    );
  });

  it('resolves any other failure through the error catalog', () => {
    expect(getGatewayValuesErrorMessage(apiError(404), t, 'variables.error', 'Failed')).toBe('variables.error|Failed');
  });
});

describe('validateGatewayValue', () => {
  it('applies the name rules of the gateway store', () => {
    expect(validateGatewayValueName('')).toBe('required');
    expect(validateGatewayValueName('_OK_1')).toBeUndefined();
    expect(validateGatewayValueName('1BAD')).toBe('pattern');
    expect(validateGatewayValueName('has-dash')).toBe('pattern');
    expect(validateGatewayValueName('A'.repeat(256))).toBe('tooLong');
  });

  it('applies the value and description limits of the gateway store', () => {
    expect(validateGatewayValueValue('')).toBe('required');
    expect(validateGatewayValueValue('x'.repeat(8192))).toBeUndefined();
    expect(validateGatewayValueValue('x'.repeat(8193))).toBe('tooLong');
    expect(validateGatewayValueDescription('')).toBeUndefined();
    expect(validateGatewayValueDescription('x'.repeat(1001))).toBe('tooLong');
  });
});

describe('groupReferences', () => {
  const ordersSecret = {
    name: 'ORDERS_SECRET',
    kind: 'secret' as const,
    resourceType: 'application',
    resourceName: 'Orders',
    field: 'clientSecret',
  };
  const alicePassword = {
    name: 'ALICE_PASSWORD',
    kind: 'secret' as const,
    resourceType: 'user',
    resourceName: 'alice',
    field: 'password',
  };

  it('groups values by the resource type that refers to them, with unknown ones last', () => {
    const groups = groupReferences(
      [
        {name: 'HAND_WRITTEN', kind: 'secret'},
        {name: 'ORDERS_SECRET', kind: 'secret'},
        {name: 'ALICE_PASSWORD', kind: 'secret'},
      ],
      [ordersSecret, alicePassword],
    );

    expect(groups.map((group) => group.resourceType)).toEqual(['application', 'user', null]);
    expect(groups[0].values).toEqual([{name: 'ORDERS_SECRET', kind: 'secret', references: [ordersSecret]}]);
    expect(groups[2].values).toEqual([{name: 'HAND_WRITTEN', kind: 'secret', references: []}]);
  });

  it('matches a reference only to a value of its own kind', () => {
    const groups = groupReferences([{name: 'ORDERS_SECRET', kind: 'variable'}], [ordersSecret]);

    expect(groups).toEqual([{resourceType: null, values: [{name: 'ORDERS_SECRET', kind: 'variable', references: []}]}]);
  });
});

describe('listValue', () => {
  it('reads a JSON list of strings and nothing else', () => {
    expect(parseListValue('["https://a.test/cb", "https://b.test/cb"]')).toEqual([
      'https://a.test/cb',
      'https://b.test/cb',
    ]);
    expect(parseListValue('https://a.test/cb')).toBeUndefined();
    expect(parseListValue('[1, 2]')).toBeUndefined();
    expect(parseListValue('[not json')).toBeUndefined();
  });

  it('edits a list one item per line and saves it as a JSON list without blank lines', () => {
    expect(toListText('["https://a.test/cb","https://b.test/cb"]')).toBe('https://a.test/cb\nhttps://b.test/cb');
    expect(toListText('https://a.test/cb')).toBe('https://a.test/cb');
    expect(fromListText(' https://a.test/cb \n\nhttps://b.test/cb\n')).toBe(
      '["https://a.test/cb","https://b.test/cb"]',
    );
  });

  it('treats a value as a list when any reference to it is a list item', () => {
    const reference = {name: 'URIS', kind: 'variable' as const, resourceType: 'application'};
    expect(isListValue([reference, {...reference, list: true}])).toBe(true);
    expect(isListValue([reference])).toBe(false);
    expect(isListValue(undefined)).toBe(false);
  });
});

describe('withContext', () => {
  const same = (n: number) => Array.from({length: n}, (_, i) => ({kind: ' ' as const, text: `s${String(i)}`}));

  it('keeps three lines of context around a change and folds the rest into counted gaps', () => {
    const lines = [...same(5), {kind: '+' as const, text: 'new'}, ...same(5)];
    const shown = withContext(lines);
    expect(shown[0]).toEqual({gap: 2, index: 1});
    expect(shown.filter((entry) => 'line' in entry)).toHaveLength(7);
    expect(shown[shown.length - 1]).toEqual({gap: 2, index: 11});
  });

  it('shows a document that is all change in full', () => {
    expect(
      withContext([
        {kind: '+', text: 'a'},
        {kind: '+', text: 'b'},
      ]),
    ).toHaveLength(2);
  });
});

describe('groupByResource', () => {
  const ref = (name: string, resourceType: string, resourceId: string, resourceName?: string) => ({
    name,
    kind: 'variable' as const,
    resourceType,
    resourceId,
    resourceName,
  });

  it('groups names by resource type and then resource, with unexplained names last', () => {
    const byName = new Map([
      ['B_ID', [ref('B_ID', 'application', 'app-b', 'Beta')]],
      ['A_SECRET', [ref('A_SECRET', 'application', 'app-a', 'Alpha')]],
      ['A_ID', [ref('A_ID', 'application', 'app-a', 'Alpha')]],
      ['HOST', [ref('HOST', 'connection', 'conn-1')]],
    ]);

    expect(groupByResource(['STRAY', 'HOST', 'B_ID', 'A_SECRET', 'A_ID'], byName)).toEqual([
      {
        resourceType: 'application',
        resources: [
          {key: 'application/app-a', label: 'Alpha', names: ['A_ID', 'A_SECRET']},
          {key: 'application/app-b', label: 'Beta', names: ['B_ID']},
        ],
      },
      {resourceType: 'connection', resources: [{key: 'connection/conn-1', label: 'conn-1', names: ['HOST']}]},
      {resourceType: null, resources: [{key: '/', label: null, names: ['STRAY']}]},
    ]);
  });
});
