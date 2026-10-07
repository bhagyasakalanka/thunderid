// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import userEvent from '@testing-library/user-event';
import {EnvironmentProvider, type Environment} from '@thunderid/contexts';
import {renderWithProviders, screen, waitFor, within} from '@thunderid/test-utils';
import type {ReactNode} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {createHttpRouter, SERVER_URL, type HttpCall} from './http';
import EnvironmentValue from '../EnvironmentValue';
import type {ValueReference} from '../models';

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
  return {...actual, useConfig: () => ({getServerUrl: () => SERVER_URL})};
});

const prod: Environment = {id: 'gw-2', name: 'prod', baseUrl: 'https://prod.example.com'};

const references: ValueReference[] = [
  {name: 'APP_CLIENT_ID', kind: 'variable', resourceType: 'application', resourceId: 'app-1', field: 'clientId'},
  {
    name: 'APP_REDIRECT_URIS',
    kind: 'variable',
    resourceType: 'application',
    resourceId: 'app-1',
    field: 'redirectUris',
    list: true,
  },
  {name: 'APP_SECRET', kind: 'secret', resourceType: 'application', resourceId: 'app-1', field: 'clientSecret'},
];

function inEnvironment(node: ReactNode, environment: Environment | null = prod) {
  return renderWithProviders(
    <EnvironmentProvider
      environments={environment ? [environment] : []}
      selectedId={environment?.id}
      readOnly
      onSelect={vi.fn()}
    >
      {node}
    </EnvironmentProvider>,
  );
}

function field(name: string) {
  return (
    <EnvironmentValue resourceType="application" resourceId="app-1" field={name} label={`Label ${name}`}>
      <span>design value</span>
    </EnvironmentValue>
  );
}

function routes(values: {variables?: {name: string; value: string}[]; secrets?: {name: string}[]}, extra = {}) {
  return createHttpRouter({
    'GET /configuration-versions/current': {version: 'current', references},
    'GET /gateways/gw-2/variables': {
      totalResults: values.variables?.length ?? 0,
      startIndex: 1,
      count: values.variables?.length ?? 0,
      variables: values.variables ?? [],
    },
    'GET /gateways/gw-2/secrets': {
      totalResults: values.secrets?.length ?? 0,
      startIndex: 1,
      count: values.secrets?.length ?? 0,
      secrets: (values.secrets ?? []).map((secret) => ({...secret, exists: true})),
    },
    ...extra,
  });
}

beforeEach(() => {
  mockHttpRequest.mockReset();
});

describe('EnvironmentValue', () => {
  it('shows the resource its own field, and asks nothing, without an environment', () => {
    inEnvironment(field('clientId'), null);

    expect(screen.getByText('design value')).toBeInTheDocument();
    expect(mockHttpRequest).not.toHaveBeenCalled();
  });

  it('shows the resource its own field when the configuration does not refer to it', async () => {
    mockHttpRequest.mockImplementation(routes({}));
    inEnvironment(field('backchannelLogoutUri'));

    await waitFor(() => expect(mockHttpRequest).toHaveBeenCalled());
    expect(screen.getByText('design value')).toBeInTheDocument();
  });

  it('shows the value the selected environment holds instead of the resource its own', async () => {
    mockHttpRequest.mockImplementation(routes({variables: [{name: 'APP_CLIENT_ID', value: 'prod-client'}]}));
    inEnvironment(field('clientId'));

    expect(await screen.findByDisplayValue('prod-client')).toBeInTheDocument();
    expect(screen.queryByText('design value')).not.toBeInTheDocument();
    expect(screen.queryByText(/Not set in prod/)).not.toBeInTheDocument();
  });

  it('says a value the environment lacks is not set, and sets it on that environment', async () => {
    const puts: HttpCall[] = [];
    mockHttpRequest.mockImplementation(
      routes(
        {},
        {
          'PUT /gateways/gw-2/variables/APP_CLIENT_ID': (call: HttpCall) => {
            puts.push(call);
            return {name: 'APP_CLIENT_ID', value: 'new-client'};
          },
        },
      ),
    );
    inEnvironment(field('clientId'));

    expect(await screen.findByText(/Not set in prod/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', {name: 'Set value'}));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Label clientId'), 'new-client');
    await userEvent.click(within(dialog).getByRole('button', {name: /save/i}));

    await waitFor(() => expect(puts).toHaveLength(1));
    expect(puts[0].data).toEqual({value: 'new-client'});
  });

  it('shows a list one item per line, and writes it back as a JSON list', async () => {
    const puts: HttpCall[] = [];
    mockHttpRequest.mockImplementation(
      routes(
        {variables: [{name: 'APP_REDIRECT_URIS', value: '["https://a.example.com/cb","https://b.example.com/cb"]'}]},
        {
          'PUT /gateways/gw-2/variables/APP_REDIRECT_URIS': (call: HttpCall) => {
            puts.push(call);
            return {name: 'APP_REDIRECT_URIS', value: (call.data as {value: string}).value};
          },
        },
      ),
    );
    inEnvironment(field('redirectUris'));

    await waitFor(() =>
      expect(screen.getByLabelText('Label redirectUris')).toHaveValue(
        'https://a.example.com/cb\nhttps://b.example.com/cb',
      ),
    );
    await userEvent.click(screen.getByRole('button', {name: 'Edit'}));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Label redirectUris'), '\n\nhttps://c.example.com/cb');
    await userEvent.click(within(dialog).getByRole('button', {name: /save/i}));

    await waitFor(() => expect(puts).toHaveLength(1));
    expect(JSON.parse((puts[0].data as {value: string}).value)).toEqual([
      'https://a.example.com/cb',
      'https://b.example.com/cb',
      'https://c.example.com/cb',
    ]);
  });

  it('never shows a secret, and regenerates it on the environment, showing the new one once', async () => {
    const puts: HttpCall[] = [];
    mockHttpRequest.mockImplementation(
      routes(
        {secrets: [{name: 'APP_SECRET'}]},
        {
          'PUT /gateways/gw-2/secrets/APP_SECRET': (call: HttpCall) => {
            puts.push(call);
            return {name: 'APP_SECRET', exists: true};
          },
        },
      ),
    );
    inEnvironment(field('clientSecret'));

    expect(await screen.findByDisplayValue('••••••••••••••••')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', {name: 'Regenerate'}));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', {name: 'Regenerate'}));

    await waitFor(() => expect(puts).toHaveLength(1));
    const generated = (puts[0].data as {value: string}).value;
    expect(generated).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(await within(dialog).findByDisplayValue(generated)).toBeInTheDocument();
  });

  it('says a secret the environment lacks is not set', async () => {
    mockHttpRequest.mockImplementation(routes({secrets: []}));
    inEnvironment(field('clientSecret'));

    expect(await screen.findByText(/Not set in prod/)).toBeInTheDocument();
  });
});

describe('EnvironmentValue on a gateway other than the default', () => {
  it('says a new resource has its values set on the default gateway only', async () => {
    mockHttpRequest.mockImplementation(routes({}));
    renderWithProviders(
      <EnvironmentProvider
        environments={[{id: 'gw-1', name: 'dev', isDefault: true}, prod]}
        selectedId="gw-2"
        readOnly
        onSelect={vi.fn()}
      >
        {field('clientId')}
      </EnvironmentProvider>,
    );

    expect(await screen.findByText(/set on dev, the default gateway, only/)).toBeInTheDocument();
  });
});
