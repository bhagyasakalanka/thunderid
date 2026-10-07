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
              id: 'vp-applied',
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
vi.mock('../../api/useGetVerifiablePresentations', () => ({
  default: () => ({
    data: [{id: 'vp-1', handle: 'pid', ouId: 'ou-1', format: 'dc+sd-jwt', vct: 'urn:pid', name: 'PID'}],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));
vi.mock('../../components/VerifiablePresentationDeleteDialog', () => ({default: () => null}));
vi.mock('../../components/VerificationDialog', () => ({default: () => null}));

const {default: VerifiablePresentationsListPage} = await import('../VerifiablePresentationsListPage');

describe('VerifiablePresentationsListPage', () => {
  beforeEach(() => {
    mockReadOnly = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('offers create, edit and delete in write mode', async () => {
    renderWithProviders(<VerifiablePresentationsListPage />);

    expect(await screen.findByText('PID')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Add Definition'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Delete'})).toBeInTheDocument();
    expect(screen.queryByText('Applied')).toBeNull();
  });

  it('lists only the applied resources, read-only, in read-only mode', async () => {
    mockReadOnly = true;
    renderWithProviders(<VerifiablePresentationsListPage />);

    expect(await screen.findByText('Applied')).toBeInTheDocument();
    expect(screen.queryByText('PID')).toBeNull();
    expect(screen.queryByRole('button', {name: 'Add Definition'})).toBeNull();
    expect(screen.queryByRole('button', {name: 'Delete'})).toBeNull();
    expect(screen.queryByRole('button', {name: 'Edit'})).toBeNull();
  });
});
