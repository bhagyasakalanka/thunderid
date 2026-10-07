// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {renderWithProviders, screen} from '@thunderid/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

let mockReadOnly = false;

vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useEnvironment: () => ({readOnly: mockReadOnly}),
}));
vi.mock('@thunderid/components', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/components')>()),
  useEnvironmentList: (_type: string, live: object, toPage: (resources: unknown[]) => unknown) =>
    mockReadOnly
      ? {
          data: toPage([
            {
              id: 'vc-applied',
              handle: 'applied',
              ouId: 'ou-1',
              format: 'dc+sd-jwt',
              vct: 'urn:applied',
              name: 'Applied',
            },
          ]),
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        }
      : live,
}));
vi.mock('../../api/useGetVerifiableCredentials', () => ({
  default: () => ({
    data: [{id: 'vc-1', handle: 'pid', ouId: 'ou-1', format: 'dc+sd-jwt', vct: 'urn:pid', name: 'PID'}],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));
vi.mock('../../components/VerifiableCredentialDeleteDialog', () => ({default: () => null}));
vi.mock('../../components/CredentialOfferDialog', () => ({default: () => null}));

const {default: VerifiableCredentialsListPage} = await import('../VerifiableCredentialsListPage');

describe('VerifiableCredentialsListPage', () => {
  beforeEach(() => {
    mockReadOnly = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('offers create, edit and delete in write mode', async () => {
    renderWithProviders(<VerifiableCredentialsListPage />);

    expect(await screen.findByText('PID')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Add Template'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Delete'})).toBeInTheDocument();
    expect(screen.queryByText('Applied')).toBeNull();
  });

  it('lists only the applied resources, read-only, in read-only mode', async () => {
    mockReadOnly = true;
    renderWithProviders(<VerifiableCredentialsListPage />);

    expect(await screen.findByText('Applied')).toBeInTheDocument();
    expect(screen.queryByText('PID')).toBeNull();
    expect(screen.queryByRole('button', {name: 'Add Template'})).toBeNull();
    expect(screen.queryByRole('button', {name: 'Delete'})).toBeNull();
    expect(screen.queryByRole('button', {name: 'Edit'})).toBeNull();
  });
});
