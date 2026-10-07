// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, it, expect} from 'vitest';
import {FlowType} from '../../models/flows';
import toFlowsPage from '../toFlowsPage';

const flow = (id: string, flowType: FlowType) => ({
  id,
  name: `Flow ${id}`,
  handle: `flow-${id}`,
  flowType,
  activeVersion: 1,
  nodes: [{id: 'start'}],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
});

describe('toFlowsPage', () => {
  it('maps each flow to a list item without its nodes', () => {
    const page = toFlowsPage([flow('a', FlowType.AUTHENTICATION)]);

    expect(page).toEqual({
      totalResults: 1,
      startIndex: 1,
      count: 1,
      flows: [
        {
          id: 'a',
          name: 'Flow a',
          handle: 'flow-a',
          flowType: FlowType.AUTHENTICATION,
          activeVersion: 1,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-02T00:00:00Z',
          isReadOnly: undefined,
        },
      ],
    });
  });

  it('filters by flow type and pages by limit and offset', () => {
    const resources = [
      flow('a', FlowType.AUTHENTICATION),
      flow('b', FlowType.REGISTRATION),
      flow('c', FlowType.AUTHENTICATION),
      flow('d', FlowType.AUTHENTICATION),
    ];

    const page = toFlowsPage(resources, {flowType: FlowType.AUTHENTICATION, limit: 2, offset: 1});

    expect(page.totalResults).toBe(3);
    expect(page.startIndex).toBe(2);
    expect(page.flows.map((f) => f.id)).toEqual(['c', 'd']);
  });

  it('returns an empty page when the gateway runs no flows', () => {
    expect(toFlowsPage([])).toEqual({totalResults: 0, startIndex: 1, count: 0, flows: []});
  });
});
