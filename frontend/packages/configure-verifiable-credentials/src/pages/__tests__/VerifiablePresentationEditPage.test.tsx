// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import userEvent from '@testing-library/user-event';
import {renderWithProviders, screen} from '@thunderid/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {VerifiablePresentation} from '../../models/vp';

const live: VerifiablePresentation = {
  id: 'vp-1',
  handle: 'pid',
  ouId: 'ou-1',
  ouHandle: 'default',
  name: 'Live request',
  format: 'dc+sd-jwt',
  vct: 'urn:live',
  mandatoryClaims: ['given_name'],
};
const applied: VerifiablePresentation = {...live, name: 'Applied request', vct: 'urn:applied'};

let mockReadOnly = false;
let mockMissing = false;
let mockApplied: VerifiablePresentation | undefined;
const mockUseEnvironmentResource = vi.fn();

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useParams: () => ({vpId: 'vp-1'}),
}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useEnvironment: () => ({readOnly: mockReadOnly}),
}));
vi.mock('@thunderid/components', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/components')>()),
  useEnvironmentResource: (resourceType: string, resourceId: string, result: Record<string, unknown>) => {
    mockUseEnvironmentResource(resourceType, resourceId);
    if (mockMissing) {
      return {...result, data: undefined, presence: {source: 'missing'}};
    }
    return mockApplied
      ? {...result, data: mockApplied, presence: {source: 'applied'}}
      : {...result, presence: {source: 'live'}};
  },
  EnvironmentDeploymentNotice: () => (mockReadOnly ? <div data-testid="environment-notice" /> : null),
}));
vi.mock('@thunderid/configure-organization-units', () => ({
  useHasMultipleOUs: () => ({hasMultipleOUs: false, ouList: [{id: 'ou-1'}]}),
  OrganizationUnitTreePicker: () => null,
}));
vi.mock('../../api/useGetVerifiablePresentation', () => ({
  default: () => ({data: live, isLoading: false, error: null, refetch: vi.fn()}),
}));
vi.mock('../../api/useUpdateVerifiablePresentation', () => ({
  default: () => ({mutate: vi.fn(), isPending: false, isError: false, error: null, reset: vi.fn()}),
}));
vi.mock('../../api/useGetTrustAnchors', () => ({
  default: () => ({data: [], isLoading: false, error: null, refetch: vi.fn()}),
}));
vi.mock('../../components/VerifiablePresentationDeleteDialog', () => ({default: () => null}));

const {default: VerifiablePresentationEditPage} = await import('../VerifiablePresentationEditPage');

describe('VerifiablePresentationEditPage', () => {
  beforeEach(() => {
    mockReadOnly = false;
    mockMissing = false;
    mockApplied = undefined;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('is editable in the draft', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VerifiablePresentationEditPage />);

    expect(screen.getByText('Live request')).toBeInTheDocument();
    expect(screen.queryByTestId('environment-notice')).toBeNull();
    expect(screen.getByRole('button', {name: 'Edit presentation definition name'})).toBeInTheDocument();
    expect(screen.getByRole('tab', {name: 'Advanced'})).toBeInTheDocument();

    await user.click(screen.getByRole('tab', {name: 'Settings'}));
    expect(screen.getByDisplayValue('urn:live')).toBeEnabled();
  });

  it('shows the presentation definition as the gateway applied it, read-only', async () => {
    const user = userEvent.setup();
    mockReadOnly = true;
    mockApplied = applied;
    renderWithProviders(<VerifiablePresentationEditPage />);

    expect(mockUseEnvironmentResource).toHaveBeenCalledWith('presentation_definition', 'vp-1');
    expect(screen.getByTestId('environment-notice')).toBeInTheDocument();
    expect(screen.getByText('Applied request')).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Edit presentation definition name'})).toBeNull();
    expect(screen.queryByRole('button', {name: 'Edit presentation definition description'})).toBeNull();
    expect(screen.queryByRole('tab', {name: 'Advanced'})).toBeNull();

    await user.click(screen.getByRole('tab', {name: 'Settings'}));
    expect(screen.getByDisplayValue('urn:applied')).toBeDisabled();

    await user.click(screen.getByRole('tab', {name: 'Claims'}));
    expect(screen.getByDisplayValue('given_name')).toBeDisabled();
    expect(screen.queryByRole('button', {name: 'Add Claim'})).toBeNull();
  });

  it('shows the not-found state, with the deployment notice, when the gateway does not run it', () => {
    mockReadOnly = true;
    mockMissing = true;
    renderWithProviders(<VerifiablePresentationEditPage />);

    expect(screen.getByText('Presentation definition not found')).toBeInTheDocument();
    expect(screen.getByTestId('environment-notice')).toBeInTheDocument();
  });
});
