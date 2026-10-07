// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import userEvent from '@testing-library/user-event';
import {render, screen} from '@thunderid/test-utils';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import type {Application} from '../../models/application';
import ApplicationEditPage from '../ApplicationEditPage';

const {environment, mockUseGetApplication} = vi.hoisted(() => ({
  // What the selected environment shows: a gateway view test sets readOnly and applied.
  environment: {readOnly: false, applied: undefined as unknown, missing: false},
  mockUseGetApplication: vi.fn(),
}));

vi.mock('@thunderid/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@thunderid/components')>();
  return {
    ...actual,
    ResourceAvatar: () => null,
    EnvironmentDeploymentNotice: () =>
      environment.readOnly ? <div data-testid="environment-deployment-notice" /> : null,
    useEnvironmentResource: (_type: string, _id: string, live: {data: unknown}) => {
      if (environment.missing) return {...live, data: undefined, presence: {source: 'missing'}};
      return environment.applied ? {...live, data: environment.applied} : live;
    },
  };
});

vi.mock('@thunderid/contexts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@thunderid/contexts')>();
  return {
    ...actual,
    useEnvironment: () => ({...actual.useEnvironment(), readOnly: environment.readOnly}),
  };
});

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({applicationId: 'app-1'}),
    useLocation: () => ({state: null}),
  };
});

vi.mock('../../api/useGetApplication', () => ({
  default: (id: string): unknown => mockUseGetApplication(id) as unknown,
}));

vi.mock('../../api/useUpdateApplication', () => ({
  default: () => ({mutateAsync: vi.fn(), isPending: false, error: null, reset: vi.fn()}),
}));

// Each tab reports whether it was handed a read-only application.
function readOnlyTab(testId: string) {
  return {
    default: ({application}: {application: Application}) => (
      <div data-testid={testId} data-read-only={String(application.isReadOnly === true)} />
    ),
  };
}

vi.mock('../../components/edit-application/integration-guides/IntegrationGuides', () => readOnlyTab('overview-tab'));
vi.mock('../../components/edit-application/access/EditAccessSettings', () => readOnlyTab('access-tab'));
vi.mock('../../components/edit-application/credentials/EditCredentialsSettings', () => readOnlyTab('credentials-tab'));
vi.mock('../../components/edit-application/flows-settings/EditFlowsSettings', () => readOnlyTab('flows-tab'));
vi.mock('../../components/edit-application/customization-settings/EditCustomizationSettings', () =>
  readOnlyTab('customization-tab'),
);
vi.mock('../../components/edit-application/token-settings/EditTokenSettingsTabs', () => readOnlyTab('token-tab'));
vi.mock('../../components/edit-application/advanced-settings/EditAdvancedSettings', () => readOnlyTab('advanced-tab'));

const liveApplication: Application = {
  id: 'app-1',
  name: 'Live App',
  description: 'Live description',
  inboundAuthConfig: [
    {
      type: 'oauth2',
      config: {
        clientId: 'client-1',
        grantTypes: ['authorization_code'],
        responseTypes: ['code'],
        redirectUris: ['https://example.com/callback'],
        pkceRequired: true,
        publicClient: false,
        tokenEndpointAuthMethod: 'client_secret_basic',
      },
    },
  ],
} as Application;

describe('ApplicationEditPage in an environment', () => {
  beforeEach(() => {
    environment.readOnly = false;
    environment.applied = undefined;
    environment.missing = false;
    mockUseGetApplication.mockReturnValue({data: liveApplication, isLoading: false, error: null, refetch: vi.fn()});
  });

  it('shows the live application, editable, in the draft', async () => {
    const user = userEvent.setup();
    render(<ApplicationEditPage />);

    expect(screen.getByText('Live App')).toBeInTheDocument();
    expect(screen.getByText('Live App').parentElement?.querySelector('button')).not.toBeNull();
    expect(screen.queryByTestId('environment-deployment-notice')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', {name: /advanced/i}));
    expect(screen.getByTestId('advanced-tab')).toHaveAttribute('data-read-only', 'false');
  });

  it('shows the application the gateway applied, read-only, in a gateway view', async () => {
    const user = userEvent.setup();
    environment.readOnly = true;
    environment.applied = {...liveApplication, name: 'Applied App'};

    render(<ApplicationEditPage />);

    expect(screen.getByText('Applied App')).toBeInTheDocument();
    expect(screen.queryByText('Live App')).not.toBeInTheDocument();
    expect(screen.getByTestId('environment-deployment-notice')).toBeInTheDocument();
    // No inline name or description edit, and not the system-resource alert.
    expect(screen.getByText('Applied App').parentElement?.querySelector('button')).toBeNull();
    expect(screen.queryByText(/This resource is read-only/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('overview-tab')).toHaveAttribute('data-read-only', 'true');

    for (const [tab, testId] of [
      [/access/i, 'access-tab'],
      [/credentials/i, 'credentials-tab'],
      [/flows/i, 'flows-tab'],
      [/customization/i, 'customization-tab'],
      [/token/i, 'token-tab'],
      [/advanced/i, 'advanced-tab'],
    ] as const) {
      await user.click(screen.getByRole('tab', {name: tab}));
      expect(screen.getByTestId(testId)).toHaveAttribute('data-read-only', 'true');
    }
  });

  it('shows the not-found state, not the live application, when the gateway does not run it', () => {
    environment.readOnly = true;
    environment.missing = true;

    render(<ApplicationEditPage />);

    expect(screen.queryByText('Live App')).not.toBeInTheDocument();
    expect(screen.getByTestId('environment-deployment-notice')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /back/i})).toBeInTheDocument();
  });

  it('still shows the system-resource alert for a read-only application', () => {
    mockUseGetApplication.mockReturnValue({
      data: {...liveApplication, isReadOnly: true},
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ApplicationEditPage />);

    expect(screen.getByText(/This resource is read-only/i)).toBeInTheDocument();
  });
});
