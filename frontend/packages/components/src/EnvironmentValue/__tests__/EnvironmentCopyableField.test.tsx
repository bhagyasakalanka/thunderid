// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {EnvironmentProvider, type Environment} from '@thunderid/contexts';
import {renderWithProviders, screen, waitFor} from '@thunderid/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {createHttpRouter, type HttpCall} from './http';
import EnvironmentCopyableField from '../EnvironmentCopyableField';
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

vi.mock('@thunderid/logger/react', () => ({
  useLogger: () => ({error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn()}),
}));

vi.mock('@thunderid/contexts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@thunderid/contexts')>();
  return {...actual, useConfig: () => ({getServerUrl: () => 'https://localhost:8090'})};
});

const staging: Environment = {id: 'gw-2', name: 'staging'};

const references: ValueReference[] = [
  {name: 'APP_CLIENT_ID', kind: 'variable', resourceType: 'application', resourceId: 'app-1', field: 'clientId'},
  {name: 'APP_SECRET', kind: 'secret', resourceType: 'application', resourceId: 'app-1', field: 'clientSecret'},
];

function renderField(field: string, environment: Environment | null = staging) {
  return renderWithProviders(
    <EnvironmentProvider
      environments={environment ? [environment] : []}
      selectedId={environment?.id}
      readOnly
      onSelect={vi.fn()}
    >
      <EnvironmentCopyableField
        resourceType="application"
        resourceId="app-1"
        field={field}
        label="Client ID"
        value="own-client"
      />
    </EnvironmentProvider>,
  );
}

function serve(variables: {name: string; value: string}[]) {
  mockHttpRequest.mockImplementation(
    createHttpRouter({
      'GET /configuration-versions/current': {references},
      'GET /gateways/gw-2/variables': {totalResults: variables.length, variables},
    }),
  );
}

beforeEach(() => {
  mockHttpRequest.mockReset();
});

describe('EnvironmentCopyableField', () => {
  it('shows the resource its own value, and asks nothing, without an environment', () => {
    renderField('clientId', null);

    expect(screen.getByText('own-client')).toBeInTheDocument();
    expect(mockHttpRequest).not.toHaveBeenCalled();
  });

  it('shows the value the selected environment holds', async () => {
    serve([{name: 'APP_CLIENT_ID', value: 'staging-client'}]);
    renderField('clientId');

    expect(await screen.findByText('staging-client')).toBeInTheDocument();
    expect(screen.queryByText('own-client')).not.toBeInTheDocument();
  });

  it('says the value is not set in an environment that lacks it', async () => {
    serve([]);
    renderField('clientId');

    expect(await screen.findByText('Not set in staging')).toBeInTheDocument();
  });

  it('never shows a secret, keeping the resource its own value in its place', async () => {
    serve([]);
    renderField('clientSecret');

    await waitFor(() => expect(mockHttpRequest).toHaveBeenCalled());
    expect(screen.getByText('own-client')).toBeInTheDocument();
  });
});
