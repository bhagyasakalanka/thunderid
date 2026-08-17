/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {render, screen, within} from '@thunderid/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {SecretList} from '../../models/promotion';
import EnvironmentSecretsPage from '../EnvironmentSecretsPage';

const secretList: SecretList = {
  envId: 'env-1',
  seq: 3,
  checked: true,
  secrets: [
    {
      name: 'APPLICATION_APP_A_CLIENT_SECRET',
      field: 'clientSecret',
      resourceType: 'application',
      resourceName: 'App A',
      kind: 'hash',
      held: false,
    },
    {
      name: 'CONNECTION_TWILIO_AUTH_TOKEN',
      field: 'authToken',
      resourceType: 'connection',
      resourceName: 'Twilio',
      kind: 'value',
      held: true,
    },
  ],
};

const listResult = {data: secretList, isLoading: false, error: null};

vi.mock('../../api/useGetEnvironmentSecrets', () => ({default: () => listResult}));
vi.mock('../../api/useGetEnvironments', () => ({
  default: () => ({data: {environments: [{id: 'env-1', name: 'Dev'}]}}),
}));
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {...actual, useParams: () => ({envId: 'env-1'})};
});

describe('EnvironmentSecretsPage', () => {
  beforeEach(() => {
    listResult.data = secretList;
  });

  it('offers regenerate only for a credential the Data Plane hashes', () => {
    render(<EnvironmentSecretsPage />);

    // A hashed credential is generated here, so both actions apply.
    const hashed = screen.getByText('APPLICATION_APP_A_CLIENT_SECRET').closest('[role="row"]') as HTMLElement;
    expect(within(hashed).getByLabelText(/set value/i)).toBeInTheDocument();
    expect(within(hashed).getByLabelText(/regenerate/i)).toBeInTheDocument();

    // A credential replayed to an external service is issued there, so generating one is meaningless.
    const replayed = screen.getByText('CONNECTION_TWILIO_AUTH_TOKEN').closest('[role="row"]') as HTMLElement;
    expect(within(replayed).getByLabelText(/set value/i)).toBeInTheDocument();
    expect(within(replayed).queryByLabelText(/regenerate/i)).not.toBeInTheDocument();
  });

  it('reports the credentials that are not set', () => {
    render(<EnvironmentSecretsPage />);

    expect(screen.getByText(/1 credential is not set/i)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /generate missing \(1\)/i})).toBeEnabled();
  });

  it('does not claim anything is missing when the secret service could not be reached', () => {
    // Generating on a guess would replace a credential that is in fact working.
    listResult.data = {...secretList, checked: false};
    render(<EnvironmentSecretsPage />);

    expect(screen.queryByText(/credential is not set/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', {name: /generate missing \(0\)/i})).toBeDisabled();
    expect(screen.getAllByText(/unknown/i).length).toBeGreaterThan(0);
  });
});
