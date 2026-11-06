// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {render, screen, within} from '@thunderid/test-utils';
import {describe, expect, it, vi} from 'vitest';
import {fakeHttp, SERVER, type Call} from '../../__tests__/fakeHttp';
import ChangeList from '../../components/ChangeList';
import ResourceNamesProvider from '../../components/ResourceNamesProvider';
import type {Change} from '../../models/deploy';

const http = fakeHttp({
  'GET /gateways/gw-dev/applied-configuration': {
    gatewayId: 'gw-dev',
    resources: [
      {
        resourceType: 'theme',
        id: '01a1b0f8-daf7-4c1e',
        resource: {id: '01a1b0f8-daf7-4c1e', displayName: 'Shared Teal'},
      },
      {resourceType: 'agent', id: 'ag-77', resource: {id: 'ag-77', attributes: {name: 'Calendar Agent'}}},
    ],
  },
});
vi.mock('@thunderid/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/react')>()),
  useThunderID: () => ({http: {request: (call: Call) => http.request(call)}}),
}));
vi.mock('@thunderid/contexts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@thunderid/contexts')>();
  return {...actual, useConfig: () => ({...actual.useConfig(), getServerUrl: () => SERVER})};
});

const changes: Change[] = [
  {key: 'theme/01a1b0f8-daf7-4c1e', resourceType: 'theme', id: '01a1b0f8-daf7-4c1e', change: 'updated'},
  {key: 'agent/ag-77', resourceType: 'agent', id: 'ag-77', change: 'updated'},
  {key: 'user_type/9f3c2d1e-aaaa', resourceType: 'user_type', id: '9f3c2d1e-aaaa', change: 'added'},
  {key: 'layout/l-1', resourceType: 'layout', id: 'l-1', name: 'Centered', change: 'added'},
];

describe('useChangeName', () => {
  it("names a change without a name as the environment's map names it, else by its kind and the start of its id", async () => {
    render(
      <ResourceNamesProvider targetIds={['gw-dev']}>
        <ChangeList changes={changes} selected={new Set()} onToggle={vi.fn()} onToggleAll={vi.fn()} />
      </ResourceNamesProvider>,
    );

    expect(
      await within(screen.getByTestId('change-theme/01a1b0f8-daf7-4c1e')).findByText('Shared Teal'),
    ).toBeInTheDocument();
    expect(within(screen.getByTestId('change-agent/ag-77')).getByText('Calendar Agent')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('change-user_type/9f3c2d1e-aaaa')).getByText('User type 9f3c2d1e'),
    ).toBeInTheDocument();
    expect(within(screen.getByTestId('change-layout/l-1')).getByText('Centered')).toBeInTheDocument();
  });
});
