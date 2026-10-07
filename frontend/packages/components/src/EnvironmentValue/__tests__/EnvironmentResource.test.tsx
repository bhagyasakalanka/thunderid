// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery} from '@tanstack/react-query';
import {EnvironmentProvider, type Environment} from '@thunderid/contexts';
import {renderWithProviders, screen, userEvent} from '@thunderid/test-utils';
import type {JSX} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {createHttpRouter, type HttpCall} from './http';
import EnvironmentDeploymentNotice from '../EnvironmentDeploymentNotice';
import EnvironmentModeBanner from '../EnvironmentModeBanner';
import {useEnvironmentList, useEnvironmentResource} from '../useEnvironmentResource';

const mockHttpRequest = vi.fn<(call: HttpCall) => Promise<unknown>>();
vi.mock('@thunderid/react', () => ({
  useThunderID: () => ({http: {request: mockHttpRequest}}),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string, options?: Record<string, string>): string =>
      (fallback ?? key).replace(/{{(\w+)}}/g, (_match: string, name: string) => options?.[name] ?? ''),
  }),
}));

vi.mock('@thunderid/contexts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@thunderid/contexts')>();
  return {...actual, useConfig: () => ({getServerUrl: () => 'https://localhost:8090'})};
});

const staging: Environment = {id: 'gw-2', name: 'staging'};

const APPLIED = {
  gatewayId: 'gw-2',
  version: 'abcdef0123',
  resources: [
    {
      resourceType: 'group',
      id: 'g-1',
      resource: {id: 'g-1', name: 'Admins as applied'},
      parts: {members: {totalResults: 1, members: [{id: 'u-1'}]}},
    },
    {resourceType: 'group', id: 'g-2', resource: {id: 'g-2', name: 'Support as applied'}},
    {resourceType: 'application', id: 'app-1', resource: {id: 'app-1', name: 'Orders', clientId: 'var:ORDERS_CLIENT_ID'}},
  ],
};

function Probe({id, part = undefined}: {id: string; part?: string}): JSX.Element {
  const live = useQuery<{name: string}>({
    queryKey: ['live', id, part],
    queryFn: () => Promise.resolve({name: `${id} live`}),
  });
  const shown = useEnvironmentResource<{name?: string; totalResults?: number}>('group', id, live, part);
  return (
    <>
      <span data-testid="name">{shown.data?.name ?? shown.data?.totalResults ?? ''}</span>
      <span data-testid="source">{shown.isLoading ? 'loading' : shown.presence.source}</span>
    </>
  );
}

function ListProbe(): JSX.Element {
  const live = useQuery<{groups: {name: string}[]}>({
    queryKey: ['live-list'],
    queryFn: () => Promise.resolve({groups: [{name: 'live group'}]}),
  });
  const shown = useEnvironmentList('group', live, (resources) => ({groups: resources as {name: string}[]}));
  return <span data-testid="list">{shown.data?.groups.map((group) => group.name).join(',') ?? ''}</span>;
}

function renderIn(readOnly: boolean, element: JSX.Element, onReadOnlyChange = vi.fn()) {
  return renderWithProviders(
    <EnvironmentProvider
      environments={[staging]}
      selectedId="gw-2"
      readOnly={readOnly}
      onSelect={vi.fn()}
      onReadOnlyChange={onReadOnlyChange}
    >
      {element}
    </EnvironmentProvider>,
  );
}

beforeEach(() => {
  mockHttpRequest.mockReset();
  mockHttpRequest.mockImplementation(
    createHttpRouter({
      'GET /gateways/gw-2/applied-configuration': APPLIED,
      'GET /gateways/gw-2/variables': {totalResults: 1, variables: [{name: 'ORDERS_CLIENT_ID', value: 'orders-on-staging'}]},
      'GET /gateways/gw-2/secrets': {totalResults: 0, secrets: []},
    }),
  );
});

describe('useEnvironmentResource', () => {
  it('shows the page its own read in write mode, and asks the gateway nothing', async () => {
    renderIn(false, <Probe id="g-1" />);

    expect(await screen.findByText('g-1 live')).toBeInTheDocument();
    expect(screen.getByTestId('source')).toHaveTextContent('live');
    expect(mockHttpRequest).not.toHaveBeenCalled();
  });

  it('shows a resource the gateway runs from what it applied, in read-only mode', async () => {
    renderIn(true, <Probe id="g-1" />);

    expect(await screen.findByText('Admins as applied')).toBeInTheDocument();
    expect(screen.getByTestId('source')).toHaveTextContent('applied');
  });

  it('shows a part of a resource the gateway runs', async () => {
    renderIn(true, <Probe id="g-1" part="members" />);

    expect(await screen.findByText('1')).toBeInTheDocument();
  });

  it('shows nothing for a resource the gateway does not run', async () => {
    renderIn(true, <Probe id="g-new" />);

    expect(await screen.findByText('missing')).toBeInTheDocument();
    expect(screen.getByTestId('name')).toHaveTextContent('');
  });
});

describe('useEnvironmentList', () => {
  it('shows the values the gateway holds in place of the references', async () => {
    function AppList(): JSX.Element {
      const live = useQuery<{apps: {clientId?: string}[]}>({queryKey: ['live-apps'], queryFn: () => Promise.resolve({apps: []})});
      const shown = useEnvironmentList('application', live, (resources) => ({apps: resources as {clientId?: string}[]}));
      return <span data-testid="apps">{shown.data?.apps.map((app) => app.clientId).join(',') ?? ''}</span>;
    }
    renderIn(true, <AppList />);

    expect(await screen.findByText('orders-on-staging')).toBeInTheDocument();
  });

  it('lists what the gateway runs in read-only mode, and the page read in write mode', async () => {
    const {unmount} = renderIn(true, <ListProbe />);
    expect(await screen.findByText('Admins as applied,Support as applied')).toBeInTheDocument();
    unmount();

    renderIn(false, <ListProbe />);
    expect(await screen.findByText('live group')).toBeInTheDocument();
  });
});

describe('EnvironmentDeploymentNotice', () => {
  it('says a resource the gateway does not run is not there, and offers write mode', async () => {
    const onReadOnlyChange = vi.fn();
    renderIn(true, <EnvironmentDeploymentNotice resourceType="group" resourceId="g-new" />, onReadOnlyChange);

    expect(await screen.findByText(/Not in staging/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', {name: 'Switch to Write mode'}));
    expect(onReadOnlyChange).toHaveBeenCalledWith(false);
  });

  it('says nothing for a resource the gateway runs, in write mode, or when the gateway cannot be asked', async () => {
    const {unmount} = renderIn(true, <EnvironmentDeploymentNotice resourceType="group" resourceId="g-1" />);
    await screen.findByTestId('environment-mode-banner').catch(() => undefined);
    expect(screen.queryByTestId('environment-not-deployed')).not.toBeInTheDocument();
    unmount();

    renderIn(false, <EnvironmentDeploymentNotice resourceType="group" resourceId="g-new" />);
    expect(screen.queryByTestId('environment-not-deployed')).not.toBeInTheDocument();
  });
});

describe('EnvironmentModeBanner', () => {
  it('names the gateway and the version in read-only mode, and offers write mode', async () => {
    const onReadOnlyChange = vi.fn();
    renderIn(true, <EnvironmentModeBanner />, onReadOnlyChange);

    expect(await screen.findByText(/Read-only: staging, version abcdef0/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', {name: 'Switch to Write mode'}));
    expect(onReadOnlyChange).toHaveBeenCalledWith(false);
  });

  it('says when nothing has been applied to the gateway', async () => {
    mockHttpRequest.mockImplementation(
      createHttpRouter({'GET /gateways/gw-2/applied-configuration': {gatewayId: 'gw-2', resources: []}}),
    );
    renderIn(true, <EnvironmentModeBanner />);

    expect(await screen.findByText(/Nothing has been applied to staging yet/)).toBeInTheDocument();
  });

  it('shows nothing in write mode', () => {
    renderIn(false, <EnvironmentModeBanner />);

    expect(screen.queryByTestId('environment-mode-banner')).not.toBeInTheDocument();
  });
});

describe('useEnvironmentList identity', () => {
  it('keeps the same page while it says the same thing', async () => {
    const pages: unknown[] = [];
    function Recorder(): JSX.Element {
      const live = useQuery<{groups: unknown[]}>({queryKey: ['live-id'], queryFn: () => Promise.resolve({groups: []})});
      const shown = useEnvironmentList('group', live, (resources) => ({groups: resources}));
      if (shown.data) pages.push(shown.data);
      return <span data-testid="count">{pages.length}</span>;
    }
    const {rerender} = renderIn(true, <Recorder />);
    await screen.findByText('1');
    rerender(
      <EnvironmentProvider environments={[staging]} selectedId="gw-2" readOnly onSelect={vi.fn()}>
        <Recorder />
      </EnvironmentProvider>,
    );

    expect(pages.length).toBeGreaterThan(1);
    expect(new Set(pages).size).toBe(1);
  });
});
