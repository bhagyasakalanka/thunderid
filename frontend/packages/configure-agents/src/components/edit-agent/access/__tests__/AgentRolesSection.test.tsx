// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {render, screen} from '@thunderid/test-utils';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import AgentRolesSection from '../AgentRolesSection';

const {mockUseGetAgentRoles, mockEnvironment} = vi.hoisted(() => ({
  mockUseGetAgentRoles: vi.fn(),
  mockEnvironment: {gateway: undefined as {id: string} | undefined, configuration: undefined as unknown},
}));

vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useEnvironment: () => ({gateway: mockEnvironment.gateway, readOnly: Boolean(mockEnvironment.gateway)}),
}));

vi.mock('@thunderid/components', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/components')>()),
  useAppliedConfiguration: () => ({data: mockEnvironment.configuration, isLoading: false, error: null}),
}));

vi.mock('../../../../api/useGetAgentRoles', () => ({
  default: (...args: unknown[]): unknown => mockUseGetAgentRoles(...args) as unknown,
}));

describe('AgentRolesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnvironment.gateway = undefined;
    mockEnvironment.configuration = undefined;
  });

  it('shows a loading indicator while roles are loading', () => {
    mockUseGetAgentRoles.mockReturnValue({data: undefined, isLoading: true});
    render(<AgentRolesSection agentId="agent-1" />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows an error message instead of the empty-state placeholder when the request fails', () => {
    mockUseGetAgentRoles.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Boom'),
      refetch: vi.fn(),
    });
    render(<AgentRolesSection agentId="agent-1" />);

    expect(screen.getByText('Failed to load roles for this agent.')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('This agent does not have any roles assigned.')).not.toBeInTheDocument();
  });

  it('renders role names once loaded', () => {
    mockUseGetAgentRoles.mockReturnValue({
      data: {totalResults: 1, startIndex: 1, count: 1, roles: ['order-service-reader']},
      isLoading: false,
    });

    render(<AgentRolesSection agentId="agent-1" />);

    expect(screen.getByText('order-service-reader')).toBeInTheDocument();
  });

  it('renders roles as a read-only input, matching the Allowed User Types display', () => {
    mockUseGetAgentRoles.mockReturnValue({
      data: {totalResults: 1, startIndex: 1, count: 1, roles: ['order-service-reader']},
      isLoading: false,
    });

    render(<AgentRolesSection agentId="agent-1" />);

    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('readonly');
    const chip = screen.getByText('order-service-reader').closest('.MuiChip-root');
    expect(chip).not.toBeNull();
    expect(chip?.querySelector('svg')).not.toBeInTheDocument();
  });

  it('does not show a dropdown arrow, since this list is not expandable', () => {
    mockUseGetAgentRoles.mockReturnValue({
      data: {totalResults: 1, startIndex: 1, count: 1, roles: ['order-service-reader']},
      isLoading: false,
    });

    render(<AgentRolesSection agentId="agent-1" />);

    expect(document.querySelector('.MuiAutocomplete-popupIndicator')).not.toBeInTheDocument();
  });

  it('does not show the empty-state placeholder once the agent has roles', () => {
    mockUseGetAgentRoles.mockReturnValue({
      data: {totalResults: 1, startIndex: 1, count: 1, roles: ['order-service-reader']},
      isLoading: false,
    });

    render(<AgentRolesSection agentId="agent-1" />);

    expect(screen.queryByPlaceholderText('This agent does not have any roles assigned.')).not.toBeInTheDocument();
  });

  it('shows a placeholder when the agent has no roles', () => {
    mockUseGetAgentRoles.mockReturnValue({
      data: {totalResults: 0, startIndex: 1, count: 0, roles: []},
      isLoading: false,
    });

    render(<AgentRolesSection agentId="agent-1" />);

    expect(screen.getByPlaceholderText('This agent does not have any roles assigned.')).toBeInTheDocument();
  });

  it('links to the Roles management page from within the description', () => {
    mockUseGetAgentRoles.mockReturnValue({
      data: {totalResults: 0, startIndex: 1, count: 0, roles: []},
      isLoading: false,
    });

    render(<AgentRolesSection agentId="agent-1" />);

    expect(screen.getByRole('link', {name: 'Roles page'})).toHaveAttribute('href', '/roles');
  });
  it('in read-only mode, shows the roles from the configuration the gateway runs', () => {
    mockUseGetAgentRoles.mockReturnValue({
      data: {totalResults: 1, startIndex: 1, count: 1, roles: ['live-role']},
      isLoading: false,
    });
    mockEnvironment.gateway = {id: 'gw-1'};
    mockEnvironment.configuration = {
      gatewayId: 'gw-1',
      resources: [
        {
          resourceType: 'group',
          id: 'g1',
          resource: {id: 'g1', name: 'applied-agents', ouId: 'ou-1'},
          parts: {members: {members: [{id: 'agent-1', type: 'agent'}]}},
        },
        {
          resourceType: 'role',
          id: 'r1',
          resource: {id: 'r1', name: 'applied-role'},
          parts: {assignments: {assignments: [{id: 'g1', type: 'group'}]}},
        },
      ],
    };

    render(<AgentRolesSection agentId="agent-1" />);

    expect(screen.getByText('applied-role')).toBeInTheDocument();
    expect(screen.queryByText('live-role')).not.toBeInTheDocument();
  });
});
