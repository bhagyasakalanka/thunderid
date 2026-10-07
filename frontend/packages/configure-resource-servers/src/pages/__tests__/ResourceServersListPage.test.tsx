// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {renderWithProviders, screen} from '@thunderid/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import ResourceServersListPage from '../ResourceServersListPage';

let mockEnvironmentReadOnly = false;

vi.mock('@thunderid/contexts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@thunderid/contexts')>();
  return {...actual, useEnvironment: () => ({...actual.useEnvironment(), readOnly: mockEnvironmentReadOnly})};
});

vi.mock('@thunderid/logger/react', () => ({
  useLogger: () => ({error: vi.fn(), info: vi.fn(), debug: vi.fn()}),
}));

vi.mock('../../components/ResourceServersList', () => ({
  default: () => <div data-testid="resource-servers-list" />,
}));

describe('ResourceServersListPage', () => {
  beforeEach(() => {
    mockEnvironmentReadOnly = false;
  });

  it('offers to add a resource server in the draft', () => {
    renderWithProviders(<ResourceServersListPage />);

    expect(screen.getByRole('button', {name: 'Add resource server'})).toBeInTheDocument();
  });

  it('offers no create in a gateway view', () => {
    mockEnvironmentReadOnly = true;
    renderWithProviders(<ResourceServersListPage />);

    expect(screen.getByTestId('resource-servers-list')).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Add resource server'})).not.toBeInTheDocument();
  });
});
