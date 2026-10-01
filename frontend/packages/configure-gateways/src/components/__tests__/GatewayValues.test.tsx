// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import userEvent from '@testing-library/user-event';
import {renderWithProviders, screen, waitFor, within} from '@thunderid/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {apiError, createHttpRouter, SERVER_URL, type HttpCall, versionHash} from '../../__tests__/http';
import GatewaySecretsCard from '../GatewaySecretsCard';
import GatewayVariablesCard from '../GatewayVariablesCard';

const mockHttpRequest = vi.fn<(call: HttpCall) => Promise<unknown>>();
vi.mock('@thunderid/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@thunderid/react')>();
  return {...actual, useThunderID: () => ({http: {request: mockHttpRequest}})};
});

vi.mock('@thunderid/contexts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@thunderid/contexts')>();
  return {...actual, useConfig: () => ({getServerUrl: () => SERVER_URL})};
});

const variables = {
  totalResults: 2,
  startIndex: 1,
  count: 2,
  variables: [
    {name: 'API_URL', value: 'https://api.example.com', description: 'Payments API'},
    {name: 'REGION', value: 'eu-west'},
  ],
  links: [],
};

const secrets = {
  totalResults: 1,
  startIndex: 1,
  count: 1,
  secrets: [{name: 'CLIENT_SECRET', exists: true, description: 'Payments client'}],
  links: [],
};

beforeEach(() => {
  mockHttpRequest.mockReset();
});

describe('GatewayVariablesCard', () => {
  it('lists the variables the gateway holds', async () => {
    mockHttpRequest.mockImplementation(createHttpRouter({'GET /gateways/gw-1/variables': variables}));
    renderWithProviders(<GatewayVariablesCard gatewayId="gw-1" />);

    expect(await screen.findByText('API_URL')).toBeInTheDocument();
    expect(screen.getByText('https://api.example.com')).toBeInTheDocument();
    expect(screen.getByText('Payments API')).toBeInTheDocument();
    expect(screen.getByText('REGION')).toBeInTheDocument();
  });

  it('reads every page, so no group is split across pages', async () => {
    const page = (call: HttpCall) => {
      const offset = Number(new URL(call.url).searchParams.get('offset'));
      const names = Array.from({length: 150}, (_, i) => `VAR_${String(i).padStart(3, '0')}`).slice(
        offset,
        offset + 100,
      );
      return {
        totalResults: 150,
        startIndex: offset + 1,
        count: names.length,
        variables: names.map((name) => ({name, value: 'x'})),
        links: [],
      };
    };
    mockHttpRequest.mockImplementation(createHttpRouter({'GET /gateways/gw-1/variables': page}));
    renderWithProviders(<GatewayVariablesCard gatewayId="gw-1" />);

    expect(await screen.findByText('VAR_149')).toBeInTheDocument();
    expect(screen.getByText('VAR_000')).toBeInTheDocument();
    expect(mockHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({url: `${SERVER_URL}/gateways/gw-1/variables?limit=100&offset=0`}),
    );
    expect(mockHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({url: `${SERVER_URL}/gateways/gw-1/variables?limit=100&offset=100`}),
    );
  });

  it('names each variable by the field it fills, under its resource and the type of resource', async () => {
    mockHttpRequest.mockImplementation(
      createHttpRouter({
        'GET /gateways/gw-1/variables': variables,
        'GET /configuration-versions/latest': {
          version: versionHash(3),
          references: [
            {name: 'API_URL', kind: 'variable', resourceType: 'connection', resourceName: 'Payments', field: 'host'},
            {name: 'API_URL', kind: 'secret', resourceType: 'application', resourceName: 'Wrong kind', field: 'x'},
          ],
        },
      }),
    );
    renderWithProviders(<GatewayVariablesCard gatewayId="gw-1" />);

    expect(await screen.findByRole('heading', {name: 'Payments'})).toBeInTheDocument();
    expect(screen.getByText('Host')).toBeInTheDocument();
    expect(screen.getByText('API_URL')).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Connections'})).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Other'})).toBeInTheDocument();
    expect(screen.queryByText(/Wrong kind/)).not.toBeInTheDocument();
  });

  it('lists a variable the configuration needs but the gateway lacks, and sets only its value', async () => {
    const user = userEvent.setup();
    mockHttpRequest.mockImplementation(
      createHttpRouter({
        'GET /gateways/gw-1/variables': variables,
        'GET /configuration-versions/latest': {
          version: versionHash(3),
          references: [
            {
              name: 'APPLICATION_ORDERS_CLIENT_ID',
              kind: 'variable',
              resourceType: 'application',
              resourceName: 'Orders',
              field: 'clientId',
            },
          ],
        },
        'POST /gateways/gw-1/variables': {name: 'APPLICATION_ORDERS_CLIENT_ID', value: 'orders-client'},
      }),
    );
    renderWithProviders(<GatewayVariablesCard gatewayId="gw-1" />);

    expect(await screen.findByRole('heading', {name: 'Orders'})).toBeInTheDocument();
    expect(screen.getByText('Client ID')).toBeInTheDocument();
    expect(screen.getByText('Not set')).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Set value'}));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Set variable')).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue('APPLICATION_ORDERS_CLIENT_ID')).toBeDisabled();
    await user.type(within(dialog).getByLabelText(/Value/), 'orders-client');
    await user.click(within(dialog).getByRole('button', {name: 'Add'}));

    await waitFor(() =>
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `${SERVER_URL}/gateways/gw-1/variables`,
          method: 'POST',
          data: expect.objectContaining({name: 'APPLICATION_ORDERS_CLIENT_ID', value: 'orders-client'}) as unknown,
        }),
      ),
    );
  });

  it('sets a list variable one item per line, saved as a JSON list, and shows it one per line', async () => {
    const user = userEvent.setup();
    let held = variables;
    mockHttpRequest.mockImplementation(
      createHttpRouter({
        'GET /gateways/gw-1/variables': () => held,
        'GET /configuration-versions/latest': {
          version: versionHash(3),
          references: [
            {
              name: 'APPLICATION_ORDERS_REDIRECT_URIS',
              kind: 'variable',
              resourceType: 'application',
              resourceName: 'Orders',
              field: 'redirectUris',
              list: true,
            },
          ],
        },
        'POST /gateways/gw-1/variables': (call: HttpCall) => {
          const data = call.data as {name: string; value: string};
          held = {...variables, totalResults: 3, variables: [...variables.variables, data]};
          return data;
        },
      }),
    );
    renderWithProviders(<GatewayVariablesCard gatewayId="gw-1" />);

    expect(await screen.findByText('Redirect URIs')).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Set value'}));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('One per line.')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/Value/), 'https://one.test/cb{Enter}https://two.test/cb');
    await user.click(within(dialog).getByRole('button', {name: 'Add'}));

    await waitFor(() =>
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `${SERVER_URL}/gateways/gw-1/variables`,
          method: 'POST',
          data: expect.objectContaining({
            name: 'APPLICATION_ORDERS_REDIRECT_URIS',
            value: '["https://one.test/cb","https://two.test/cb"]',
          }) as unknown,
        }),
      ),
    );
    expect(await screen.findByText('https://one.test/cb')).toBeInTheDocument();
    expect(screen.getByText('https://two.test/cb')).toBeInTheDocument();
  });

  it('groups a value by the configuration as it stands, marking one no captured version refers to', async () => {
    const orders = (name: string, field: string) => ({
      name,
      kind: 'variable',
      resourceType: 'application',
      resourceId: 'app-1',
      resourceName: 'Orders',
      field,
    });
    mockHttpRequest.mockImplementation(
      createHttpRouter({
        'GET /gateways/gw-1/variables': {
          totalResults: 2,
          startIndex: 1,
          count: 2,
          variables: [
            {name: 'APPLICATION_ORDERS_CLIENT_ID', value: 'orders-id'},
            {name: 'APPLICATION_NEW_CLIENT_ID', value: 'new-id'},
          ],
        },
        'GET /configuration-versions/latest': {
          version: versionHash(3),
          references: [orders('APPLICATION_ORDERS_CLIENT_ID', 'clientId')],
        },
        'GET /configuration-versions/current': {
          version: versionHash(0),
          references: [
            orders('APPLICATION_ORDERS_CLIENT_ID', 'clientId'),
            {...orders('APPLICATION_NEW_CLIENT_ID', 'clientId'), resourceId: 'app-2', resourceName: 'New app'},
          ],
        },
      }),
    );
    renderWithProviders(<GatewayVariablesCard gatewayId="gw-1" />);

    expect(await screen.findByRole('heading', {name: 'New app'})).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Orders'})).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Applications'})).toBeInTheDocument();
    expect(screen.queryByRole('heading', {name: 'Other'})).not.toBeInTheDocument();
    expect(screen.getAllByText('Not captured yet')).toHaveLength(1);
    const uncapturedRow = screen.getByText('APPLICATION_NEW_CLIENT_ID').closest('tr');
    expect(uncapturedRow).not.toBeNull();
    expect(within(uncapturedRow as HTMLElement).getByText('Not captured yet')).toBeInTheDocument();
  });

  it('checks a name before adding a variable', async () => {
    const user = userEvent.setup();
    mockHttpRequest.mockImplementation(
      createHttpRouter({
        'GET /gateways/gw-1/variables': variables,
        'POST /gateways/gw-1/variables': (call: HttpCall) => call.data,
      }),
    );
    renderWithProviders(<GatewayVariablesCard gatewayId="gw-1" />);

    await user.click(await screen.findByRole('button', {name: 'Add variable'}));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Name/), '1BAD');
    await user.type(within(dialog).getByLabelText(/Value/), 'x');

    expect(within(dialog).getByText(/Use only letters, digits and underscores/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', {name: 'Add'})).toBeDisabled();

    await user.clear(within(dialog).getByLabelText(/Name/));
    await user.type(within(dialog).getByLabelText(/Name/), 'TIMEOUT');
    await user.type(within(dialog).getByLabelText(/Description/), 'Seconds');
    await user.click(within(dialog).getByRole('button', {name: 'Add'}));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mockHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({method: 'POST', data: {name: 'TIMEOUT', value: 'x', description: 'Seconds'}}),
    );
  });

  it('shows why the gateway refused a variable, until the form changes', async () => {
    const user = userEvent.setup();
    mockHttpRequest.mockImplementation((call: HttpCall) =>
      call.method === 'POST'
        ? Promise.reject(apiError(409, 'VAR-1009'))
        : createHttpRouter({'GET /gateways/gw-1/variables': variables})(call),
    );
    renderWithProviders(<GatewayVariablesCard gatewayId="gw-1" />);

    await user.click(await screen.findByRole('button', {name: 'Add variable'}));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Name/), 'REGION');
    await user.type(within(dialog).getByLabelText(/Value/), 'us');
    await user.click(within(dialog).getByRole('button', {name: 'Add'}));

    expect(await within(dialog).findByText('The gateway already holds something by that name.')).toBeInTheDocument();
    expect(screen.queryByText('raw server text')).not.toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/Name/), '2');
    expect(within(dialog).queryByText(/already holds something/)).not.toBeInTheDocument();
  });

  it('edits the value and description of a variable', async () => {
    const user = userEvent.setup();
    mockHttpRequest.mockImplementation(
      createHttpRouter({
        'GET /gateways/gw-1/variables': variables,
        'PUT /gateways/gw-1/variables/API_URL': (call: HttpCall) => ({name: 'API_URL', ...(call.data as object)}),
      }),
    );
    renderWithProviders(<GatewayVariablesCard gatewayId="gw-1" />);

    await user.click(await screen.findByRole('button', {name: 'Edit API_URL'}));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText(/Name/)).toBeDisabled();
    const value = within(dialog).getByLabelText(/Value/);
    await user.clear(value);
    await user.type(value, 'https://new.example.com');
    await user.click(within(dialog).getByRole('button', {name: 'Save'}));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mockHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PUT',
        data: {value: 'https://new.example.com', description: 'Payments API'},
      }),
    );
  });

  it('deletes a variable once confirmed', async () => {
    const user = userEvent.setup();
    mockHttpRequest.mockImplementation(
      createHttpRouter({'GET /gateways/gw-1/variables': variables, 'DELETE /gateways/gw-1/variables/REGION': null}),
    );
    renderWithProviders(<GatewayVariablesCard gatewayId="gw-1" />);

    await user.click(await screen.findByRole('button', {name: 'Delete REGION'}));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Delete the variable REGION from this gateway?');
    await user.click(within(dialog).getByRole('button', {name: 'Delete'}));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mockHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({url: `${SERVER_URL}/gateways/gw-1/variables/REGION`, method: 'DELETE'}),
    );
  });

  it('says so when the gateway cannot be reached', async () => {
    mockHttpRequest.mockRejectedValue(apiError(502, 'GTW-5001'));
    renderWithProviders(<GatewayVariablesCard gatewayId="gw-1" />);

    expect(await screen.findByText(/The gateway could not be reached/)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Add variable'})).toBeDisabled();
  });
});

describe('GatewaySecretsCard', () => {
  it('lists the secrets the gateway holds without their values', async () => {
    mockHttpRequest.mockImplementation(createHttpRouter({'GET /gateways/gw-1/secrets': secrets}));
    renderWithProviders(<GatewaySecretsCard gatewayId="gw-1" />);

    expect(await screen.findByText('CLIENT_SECRET')).toBeInTheDocument();
    expect(screen.getByText('Payments client')).toBeInTheDocument();
    expect(screen.getByText('Set')).toBeInTheDocument();
  });

  it('lists a secret the configuration needs but the gateway lacks, and sets only its value', async () => {
    const user = userEvent.setup();
    mockHttpRequest.mockImplementation(
      createHttpRouter({
        'GET /gateways/gw-1/secrets': secrets,
        'GET /configuration-versions/latest': {
          version: versionHash(3),
          references: [
            {
              name: 'APPLICATION_ORDERS_CLIENT_SECRET',
              kind: 'secret',
              resourceType: 'application',
              resourceName: 'Orders',
              field: 'clientSecret',
            },
          ],
        },
        'POST /gateways/gw-1/secrets': {name: 'APPLICATION_ORDERS_CLIENT_SECRET', exists: true},
      }),
    );
    renderWithProviders(<GatewaySecretsCard gatewayId="gw-1" />);

    expect(await screen.findByText('Client secret')).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Applications'})).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Set value'}));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Set secret')).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue('APPLICATION_ORDERS_CLIENT_SECRET')).toBeDisabled();
    await user.type(within(dialog).getByLabelText(/Value/), 's3cret');
    await user.click(within(dialog).getByRole('button', {name: 'Add'}));

    await waitFor(() =>
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `${SERVER_URL}/gateways/gw-1/secrets`,
          method: 'POST',
          data: expect.objectContaining({name: 'APPLICATION_ORDERS_CLIENT_SECRET', value: 's3cret'}) as unknown,
        }),
      ),
    );
  });

  it('adds a secret through a password field', async () => {
    const user = userEvent.setup();
    mockHttpRequest.mockImplementation(
      createHttpRouter({
        'GET /gateways/gw-1/secrets': secrets,
        'POST /gateways/gw-1/secrets': {name: 'SIGNING_KEY', exists: true},
      }),
    );
    renderWithProviders(<GatewaySecretsCard gatewayId="gw-1" />);

    await user.click(await screen.findByRole('button', {name: 'Add secret'}));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Name/), 'SIGNING_KEY');
    const value = within(dialog).getByLabelText(/^Value/);
    expect(value).toHaveAttribute('type', 'password');
    await user.type(value, 'k3y');
    await user.click(within(dialog).getByRole('button', {name: 'Add'}));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mockHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({method: 'POST', data: {name: 'SIGNING_KEY', value: 'k3y'}}),
    );
  });

  it('replaces the value of a secret', async () => {
    const user = userEvent.setup();
    mockHttpRequest.mockImplementation(
      createHttpRouter({
        'GET /gateways/gw-1/secrets': secrets,
        'PUT /gateways/gw-1/secrets/CLIENT_SECRET': {name: 'CLIENT_SECRET', exists: true},
      }),
    );
    renderWithProviders(<GatewaySecretsCard gatewayId="gw-1" />);

    await user.click(await screen.findByRole('button', {name: 'Replace the value of CLIENT_SECRET'}));
    const dialog = await screen.findByRole('dialog');
    const value = within(dialog).getByLabelText(/New value/);
    expect(value).toHaveValue('');
    expect(value).toHaveAttribute('type', 'password');
    await user.type(value, 'rotated');
    await user.click(within(dialog).getByRole('button', {name: 'Replace'}));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mockHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({method: 'PUT', data: {value: 'rotated', description: 'Payments client'}}),
    );
  });

  it('deletes a secret once confirmed', async () => {
    const user = userEvent.setup();
    mockHttpRequest.mockImplementation(
      createHttpRouter({
        'GET /gateways/gw-1/secrets': secrets,
        'DELETE /gateways/gw-1/secrets/CLIENT_SECRET': null,
      }),
    );
    renderWithProviders(<GatewaySecretsCard gatewayId="gw-1" />);

    await user.click(await screen.findByRole('button', {name: 'Delete CLIENT_SECRET'}));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', {name: 'Delete'}));

    await waitFor(() =>
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({url: `${SERVER_URL}/gateways/gw-1/secrets/CLIENT_SECRET`, method: 'DELETE'}),
      ),
    );
  });

  it('says so when the gateway cannot be reached', async () => {
    mockHttpRequest.mockRejectedValue(apiError(502));
    renderWithProviders(<GatewaySecretsCard gatewayId="gw-1" />);

    expect(await screen.findByText(/The gateway could not be reached/)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Add secret'})).toBeDisabled();
  });
});
