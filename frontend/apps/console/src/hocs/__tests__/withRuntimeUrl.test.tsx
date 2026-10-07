// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {act, cleanup, render, screen, waitFor} from '@testing-library/react';
import {RuntimeContext, useEnvironment} from '@thunderid/contexts';
import {useContext} from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import withRuntimeUrl, {SELECTED_ENVIRONMENT_KEY} from '../withRuntimeUrl';

const SERVER_URL = 'https://cp.example.com';
const mockRequest = vi.fn();
let mockSignedIn = true;

vi.mock('@thunderid/react', () => ({
  useThunderID: () => ({http: {request: mockRequest}, isSignedIn: mockSignedIn}),
}));

vi.mock('@thunderid/contexts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@thunderid/contexts')>();
  return {
    ...actual,
    useConfig: () => ({getServerUrl: () => SERVER_URL}),
  };
});

const gateways = [
  {id: 'gw-1', name: 'dev', baseUrl: 'https://dev.example.com', isDefault: true},
  {id: 'gw-2', name: 'prod', baseUrl: 'https://prod.example.com'},
];

function Probe() {
  const {environments, selected, readOnly, select, setReadOnly} = useEnvironment();
  return (
    <>
      <span data-testid="environments">{environments.map((environment) => environment.name).join(',')}</span>
      <span data-testid="selected">{selected?.name ?? ''}</span>
      <span data-testid="readOnly">{String(readOnly)}</span>
      <span data-testid="runtime">{useContext(RuntimeContext)?.runtimeUrl ?? 'server URL'}</span>
      <button type="button" onClick={() => select('gw-2')}>
        prod
      </button>
      <button type="button" onClick={() => setReadOnly(true)}>
        read-only
      </button>
      <button type="button" onClick={() => setReadOnly(false)}>
        write
      </button>
    </>
  );
}

const WithRuntimeUrl = withRuntimeUrl(Probe);

function renderIt() {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}});
  return render(
    <QueryClientProvider client={client}>
      <WithRuntimeUrl />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockSignedIn = true;
  mockRequest.mockReset();
  mockRequest.mockResolvedValue({data: gateways});
  window.localStorage.removeItem(SELECTED_ENVIRONMENT_KEY);
});

afterEach(() => {
  cleanup();
  window.localStorage.removeItem(SELECTED_ENVIRONMENT_KEY);
});

describe('withRuntimeUrl', () => {
  it('starts in write mode on the default gateway, and builds endpoints from its URL', async () => {
    renderIt();

    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('dev'));
    expect(screen.getByTestId('environments')).toHaveTextContent('dev,prod');
    expect(screen.getByTestId('readOnly')).toHaveTextContent('false');
    expect(screen.getByTestId('runtime')).toHaveTextContent('https://dev.example.com');
    expect(mockRequest).toHaveBeenCalledWith({url: `${SERVER_URL}/gateways`, method: 'GET'});
  });

  it('switches to read-only mode on the gateway chosen, and remembers the gateway', async () => {
    renderIt();
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('dev'));

    act(() => {
      screen.getByRole('button', {name: 'prod'}).click();
    });
    expect(screen.getByTestId('readOnly')).toHaveTextContent('false');
    expect(screen.getByTestId('runtime')).toHaveTextContent('https://dev.example.com');

    act(() => {
      screen.getByRole('button', {name: 'read-only'}).click();
    });
    expect(screen.getByTestId('readOnly')).toHaveTextContent('true');
    expect(screen.getByTestId('runtime')).toHaveTextContent('https://prod.example.com');
    expect(window.localStorage.getItem(SELECTED_ENVIRONMENT_KEY)).toBe('gw-2');

    act(() => {
      screen.getByRole('button', {name: 'write'}).click();
    });
    expect(screen.getByTestId('readOnly')).toHaveTextContent('false');
  });

  it('starts in write mode on the gateway remembered, and on the default once that gateway is gone', async () => {
    window.localStorage.setItem(SELECTED_ENVIRONMENT_KEY, 'gw-2');
    renderIt();
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('prod'));
    expect(screen.getByTestId('readOnly')).toHaveTextContent('false');
    cleanup();

    window.localStorage.setItem(SELECTED_ENVIRONMENT_KEY, 'gw-removed');
    renderIt();
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('dev'));
  });

  it('goes back to write mode on sign-out, so the next sign-in starts there', async () => {
    const client = new QueryClient({defaultOptions: {queries: {retry: false}}});
    const tree = () => (
      <QueryClientProvider client={client}>
        <WithRuntimeUrl />
      </QueryClientProvider>
    );
    const {rerender} = render(tree());
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('dev'));
    act(() => {
      screen.getByRole('button', {name: 'read-only'}).click();
    });
    expect(screen.getByTestId('readOnly')).toHaveTextContent('true');

    mockSignedIn = false;
    rerender(tree());
    mockSignedIn = true;
    rerender(tree());

    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('dev'));
    expect(screen.getByTestId('readOnly')).toHaveTextContent('false');
  });

  it('asks for nothing while signed out, and keeps the server URL', () => {
    mockSignedIn = false;
    renderIt();

    expect(screen.getByTestId('environments')).toHaveTextContent('');
    expect(screen.getByTestId('runtime')).toHaveTextContent('server URL');
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('offers no environment, and keeps the server URL, on a deployment with no gateway API', async () => {
    mockRequest.mockRejectedValue(Object.assign(new Error('not found'), {response: {status: 404}}));
    renderIt();

    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    expect(screen.getByTestId('environments')).toHaveTextContent('');
    expect(screen.getByTestId('runtime')).toHaveTextContent('server URL');
  });

  it('offers no gateway, and keeps the server URL, when none is registered', async () => {
    mockRequest.mockResolvedValue({data: []});
    renderIt();

    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    expect(screen.getByTestId('environments')).toHaveTextContent('');
    expect(screen.getByTestId('readOnly')).toHaveTextContent('false');
    expect(screen.getByTestId('runtime')).toHaveTextContent('server URL');
  });
});
