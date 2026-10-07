// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, it, expect} from 'vitest';
import toApplicationsPage from '../toApplicationsPage';

const application = (id: string, clientId?: string) => ({
  id,
  name: `App ${id}`,
  description: `Description ${id}`,
  template: 'react',
  inboundAuthConfig: clientId ? [{type: 'oauth2', config: {clientId}}] : undefined,
});

describe('toApplicationsPage', () => {
  it('maps each application to a list item, taking the client id from its OAuth config', () => {
    const page = toApplicationsPage([application('a', 'client-a'), application('b')]);

    expect(page.totalResults).toBe(2);
    expect(page.count).toBe(2);
    expect(page.applications[0]).toMatchObject({
      id: 'a',
      name: 'App a',
      description: 'Description a',
      template: 'react',
      clientId: 'client-a',
    });
    expect(page.applications[1].clientId).toBeUndefined();
  });

  it('pages the applications by limit and offset', () => {
    const page = toApplicationsPage([application('a'), application('b'), application('c')], 1, 1);

    expect(page.totalResults).toBe(3);
    expect(page.count).toBe(1);
    expect(page.applications.map((app) => app.id)).toEqual(['b']);
  });

  it('returns an empty page when the gateway runs no applications', () => {
    expect(toApplicationsPage([])).toEqual({totalResults: 0, count: 0, applications: []});
  });
});
