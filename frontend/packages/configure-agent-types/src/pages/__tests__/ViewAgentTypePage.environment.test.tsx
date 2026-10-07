// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {render, screen, userEvent} from '@thunderid/test-utils';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import type {ApiAgentType} from '../../models/agent-type';
import ViewAgentTypePage from '../ViewAgentTypePage';

const {environment, mockUseGetAgentType} = vi.hoisted(() => ({
  // What the selected environment shows: a gateway view test sets readOnly and applied.
  environment: {readOnly: false, applied: undefined as unknown, missing: false},
  mockUseGetAgentType: vi.fn(),
}));

vi.mock('@thunderid/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@thunderid/components')>();
  return {
    ...actual,
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
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {...actual, useNavigate: () => vi.fn(), useParams: () => ({id: 'schema-1'})};
});

vi.mock('@/api/useGetAgentType', () => ({
  default: (id?: string): unknown => mockUseGetAgentType(id) as unknown,
}));

vi.mock('@/api/useUpdateAgentType', () => ({
  default: () => ({mutateAsync: vi.fn(), isPending: false, reset: vi.fn()}),
}));

vi.mock('@/components/edit-agent-type/schema-settings/EditSchemaSettings', () => ({
  default: ({
    properties,
    disabled = false,
    onPropertiesChange,
  }: {
    properties: {name: string}[];
    disabled?: boolean;
    onPropertiesChange: (props: unknown[]) => void;
  }) => (
    <div data-testid="edit-schema-settings" data-disabled={String(disabled)}>
      {properties.map((property) => (
        <span key={property.name}>{property.name}</span>
      ))}
      <button type="button" onClick={() => onPropertiesChange([])}>
        Clear Properties
      </button>
    </div>
  ),
}));

const liveAgentType: ApiAgentType = {
  id: 'schema-1',
  handle: 'default',
  displayName: 'Default',
  ouId: 'ou-1',
  schema: {email: {type: 'string'}},
};

describe('ViewAgentTypePage in an environment', () => {
  beforeEach(() => {
    environment.readOnly = false;
    environment.applied = undefined;
    environment.missing = false;
    mockUseGetAgentType.mockReturnValue({data: liveAgentType, isLoading: false, error: null});
  });

  it('shows the live schema, editable and without a notice, in the draft', async () => {
    const user = userEvent.setup();
    render(<ViewAgentTypePage />);

    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.getByTestId('edit-schema-settings')).toHaveAttribute('data-disabled', 'false');
    expect(screen.queryByTestId('environment-deployment-notice')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'Clear Properties'}));
    expect(screen.getByRole('button', {name: 'Save'})).toBeEnabled();
  });

  it('shows the not-found state, not the live schema, when the gateway does not run it', () => {
    environment.readOnly = true;
    environment.missing = true;

    render(<ViewAgentTypePage />);

    expect(screen.getByText('Agent type not found')).toBeInTheDocument();
    expect(screen.queryByText('email')).not.toBeInTheDocument();
    expect(screen.getByTestId('environment-deployment-notice')).toBeInTheDocument();
  });

  it('shows the schema the gateway applied, read-only, in a gateway view', async () => {
    const user = userEvent.setup();
    environment.readOnly = true;
    environment.applied = {...liveAgentType, schema: {nickname: {type: 'string'}}};

    render(<ViewAgentTypePage />);

    expect(screen.getByText('nickname')).toBeInTheDocument();
    expect(screen.queryByText('email')).not.toBeInTheDocument();
    expect(screen.getByTestId('environment-deployment-notice')).toBeInTheDocument();
    expect(screen.getByTestId('edit-schema-settings')).toHaveAttribute('data-disabled', 'true');

    await user.click(screen.getByRole('button', {name: 'Clear Properties'}));
    expect(screen.getByRole('button', {name: 'Save'})).toBeDisabled();
  });
});
