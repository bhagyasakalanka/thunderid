// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import userEvent from '@testing-library/user-event';
import {renderWithProviders, screen, within} from '@thunderid/test-utils';
import {describe, expect, it, vi} from 'vitest';
import type {Change} from '../../models/deploy';
import DeployChanges from '../DeployChanges';
import MissingValuesFields from '../MissingValuesFields';

const changes: Change[] = [
  {
    key: 'application/app-1',
    resourceType: 'application',
    id: 'app-1',
    name: 'Customer portal',
    change: 'updated',
    lines: [
      {kind: '-', text: 'tokenLifetime: 300'},
      {kind: '+', text: 'tokenLifetime: 600'},
    ],
  },
  {key: 'agent/ag-1', resourceType: 'agent', id: 'ag-1', name: 'Support assistant', change: 'added', failed: true},
  {key: 'flow/f-1', resourceType: 'flow', id: 'f-1', name: 'Sign-in with passkey', change: 'updated'},
  {key: 'flow/f-2', resourceType: 'flow', id: 'f-2', name: 'Unchanged flow', change: 'unchanged'},
];

describe('DeployChanges', () => {
  it("lists the project's changes, then the shared ones, each with its kind and what changed", () => {
    renderWithProviders(
      <DeployChanges
        changes={changes}
        selected={new Set(['application/app-1', 'agent/ag-1', 'flow/f-1'])}
        onToggle={vi.fn()}
        onToggleAll={vi.fn()}
        target="Dev"
      />,
    );

    const project = screen.getByTestId('deploy-changes-project');
    expect(within(project).getByText('Changes · 2')).toBeInTheDocument();
    const app = within(project).getByTestId('change-application/app-1');
    expect(within(app).getByText('Modified')).toBeInTheDocument();
    expect(within(app).getByText(/· Token lifetime$/)).toBeInTheDocument();
    const agent = within(project).getByTestId('change-agent/ag-1');
    expect(within(agent).getByText('Added')).toBeInTheDocument();
    expect(within(agent).getByText('Refused by Dev last time')).toBeInTheDocument();

    const shared = screen.getByTestId('deploy-changes-shared');
    expect(within(shared).getByText('Shared resources · 1')).toBeInTheDocument();
    expect(within(shared).getByText(/ship with the deploy/)).toBeInTheDocument();
    expect(within(shared).getByText('Sign-in with passkey')).toBeInTheDocument();
    expect(screen.getByText('1 resources are already as the version has them.')).toBeInTheDocument();
  });

  it('opens a diff in place and ticks a change or a whole section', async () => {
    const onToggle = vi.fn();
    const onToggleAll = vi.fn();
    renderWithProviders(
      <DeployChanges
        changes={changes}
        selected={new Set(['application/app-1'])}
        onToggle={onToggle}
        onToggleAll={onToggleAll}
        target="Dev"
      />,
    );

    await userEvent.click(screen.getByRole('button', {name: 'Show the changes to Customer portal'}));
    expect(await screen.findByText(/tokenLifetime: 600/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', {name: 'Write Support assistant'}));
    expect(onToggle).toHaveBeenCalledWith('agent/ag-1');
    await userEvent.click(screen.getByRole('checkbox', {name: 'Write every one of Shared resources'}));
    expect(onToggleAll).toHaveBeenCalledWith(['flow/f-1'], true);
  });

  it('says when the target already runs everything', () => {
    renderWithProviders(
      <DeployChanges
        changes={[changes[3]]}
        selected={new Set()}
        onToggle={vi.fn()}
        onToggleAll={vi.fn()}
        target="Dev"
      />,
    );

    expect(screen.getByText('Dev already runs this version as it is.')).toBeInTheDocument();
  });
});

describe('MissingValuesFields for an environment', () => {
  it('groups the values by resource, names each for a person and folds away', async () => {
    renderWithProviders(
      <MissingValuesFields
        target="Prod"
        fields={[
          {
            kind: 'secret',
            name: 'APP_ONE_CLIENT_SECRET',
            list: false,
            references: [
              {
                name: 'APP_ONE_CLIENT_SECRET',
                kind: 'secret',
                resourceType: 'application',
                resourceId: 'app-1',
                resourceName: 'Customer portal',
                field: 'clientSecret',
              },
            ],
          },
        ]}
        values={{}}
        onChange={vi.fn()}
      />,
    );

    const panel = screen.getByTestId('missing-values');
    expect(within(panel).getByText('Values Prod needs · 1 to set')).toBeInTheDocument();
    const group = within(panel).getByTestId('missing-group-application/app-1');
    expect(within(group).getByText(/^Customer portal · /)).toBeInTheDocument();
    expect(within(group).getByLabelText(/Client secret/)).toBeInTheDocument();
    expect(within(group).getByText('APP_ONE_CLIENT_SECRET')).toBeInTheDocument();

    await userEvent.click(within(panel).getByRole('button', {name: /Values Prod needs/}));
    expect(within(panel).getByRole('button', {name: /Values Prod needs/})).toHaveAttribute('aria-expanded', 'false');
  });
});
