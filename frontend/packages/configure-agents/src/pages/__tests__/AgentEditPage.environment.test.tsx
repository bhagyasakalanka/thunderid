// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import userEvent from '@testing-library/user-event';
import {render, screen} from '@thunderid/test-utils';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import type {Agent} from '../../models/agent';
import AgentEditPage from '../AgentEditPage';

const {environment, mockUseGetAgent} = vi.hoisted(() => ({
  // What the selected environment shows: a gateway view test sets readOnly and applied.
  environment: {readOnly: false, applied: undefined as unknown, missing: false},
  mockUseGetAgent: vi.fn(),
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

vi.mock('@thunderid/configure-agent-types', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/configure-agent-types')>()),
  useGetAgentTypes: () => ({data: {types: []}, isLoading: false}),
  useGetAgentType: () => ({data: undefined, isLoading: false}),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({agentId: 'agent-1'}),
    useLocation: () => ({state: null}),
  };
});

vi.mock('../../api/useGetAgent', () => ({
  default: (id: string): unknown => mockUseGetAgent(id) as unknown,
}));

vi.mock('../../api/useUpdateAgent', () => ({
  default: () => ({mutateAsync: vi.fn(), isPending: false, isError: false, reset: vi.fn()}),
}));

// Each tab reports whether it was handed a read-only agent.
function readOnlyTab(testId: string) {
  return {
    default: ({agent}: {agent: Agent}) => (
      <div data-testid={testId} data-read-only={String(agent.isReadOnly === true)} />
    ),
  };
}

vi.mock('../../components/edit-agent/overview/AgentOverview', () => readOnlyTab('overview-tab'));
vi.mock('../../components/edit-agent/credentials/EditCredentialsSettings', () => readOnlyTab('credentials-tab'));
vi.mock('../../components/edit-agent/access/EditAccessSettings', () => readOnlyTab('access-tab'));
vi.mock('../../components/edit-agent/flows/EditFlowsSettings', () => readOnlyTab('flows-tab'));
vi.mock('../../components/edit-agent/tokens/EditTokensSettings', () => readOnlyTab('tokens-tab'));
vi.mock('../../components/edit-agent/advanced-settings/EditAdvancedSettings', () => readOnlyTab('advanced-tab'));
vi.mock('../../components/edit-agent/attributes/EditAgentAttributes', () => ({
  default: ({agent, onFieldChange}: {agent: Agent; onFieldChange: (field: string, value: unknown) => void}) => (
    <div data-testid="attributes-tab" data-read-only={String(agent.isReadOnly === true)}>
      <button type="button" onClick={() => onFieldChange('attributes', {department: 'sales'})}>
        Edit an attribute
      </button>
    </div>
  ),
}));

const liveAgent: Agent = {
  id: 'agent-1',
  ouId: 'ou-1',
  type: 'default',
  name: 'Live Agent',
  description: 'Live description',
  inboundAuthConfig: [
    {
      type: 'oauth2',
      config: {
        grantTypes: ['authorization_code'],
        responseTypes: ['code'],
        clientId: 'client-1',
        redirectUris: ['https://example.com/callback'],
      },
    },
  ],
  allowedUserTypes: ['person'],
} as unknown as Agent;

describe('AgentEditPage in an environment', () => {
  beforeEach(() => {
    environment.readOnly = false;
    environment.applied = undefined;
    environment.missing = false;
    mockUseGetAgent.mockReturnValue({data: liveAgent, isLoading: false, error: null, refetch: vi.fn()});
  });

  it('shows the live agent, editable, in the draft', async () => {
    const user = userEvent.setup();
    render(<AgentEditPage />);

    expect(screen.getByText('Live Agent')).toBeInTheDocument();
    expect(screen.getByText('Live Agent').parentElement?.querySelector('button')).not.toBeNull();
    expect(screen.queryByTestId('environment-deployment-notice')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', {name: /attributes/i}));
    expect(screen.getByTestId('attributes-tab')).toHaveAttribute('data-read-only', 'false');
    await user.click(screen.getByRole('button', {name: 'Edit an attribute'}));
    expect(screen.getByRole('button', {name: 'Save'})).toBeEnabled();
  });

  it('shows the not-found state, not the live agent, when the gateway does not run it', () => {
    environment.readOnly = true;
    environment.missing = true;

    render(<AgentEditPage />);

    expect(screen.getByText('Agent not found')).toBeInTheDocument();
    expect(screen.queryByText('Live Agent')).not.toBeInTheDocument();
    expect(screen.getByTestId('environment-deployment-notice')).toBeInTheDocument();
  });

  it('shows the agent the gateway applied, read-only, in a gateway view', async () => {
    const user = userEvent.setup();
    environment.readOnly = true;
    environment.applied = {...liveAgent, name: 'Applied Agent'};

    render(<AgentEditPage />);

    expect(screen.getByText('Applied Agent')).toBeInTheDocument();
    expect(screen.queryByText('Live Agent')).not.toBeInTheDocument();
    expect(screen.getByTestId('environment-deployment-notice')).toBeInTheDocument();
    // No inline name edit, and not the system-resource alert.
    expect(screen.getByText('Applied Agent').parentElement?.querySelector('button')).toBeNull();
    expect(screen.queryByText(/This resource is read-only/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('overview-tab')).toHaveAttribute('data-read-only', 'true');

    for (const [tab, testId] of [
      [/credentials/i, 'credentials-tab'],
      [/access/i, 'access-tab'],
      [/flows/i, 'flows-tab'],
      [/tokens/i, 'tokens-tab'],
      [/advanced/i, 'advanced-tab'],
      [/attributes/i, 'attributes-tab'],
    ] as const) {
      await user.click(screen.getByRole('tab', {name: tab}));
      expect(screen.getByTestId(testId)).toHaveAttribute('data-read-only', 'true');
    }

    await user.click(screen.getByRole('button', {name: 'Edit an attribute'}));
    expect(screen.getByRole('button', {name: 'Save'})).toBeDisabled();
  });
});
