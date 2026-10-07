// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import userEvent from '@testing-library/user-event';
import {render, screen} from '@thunderid/test-utils';
import type {NavigateFunction, Params} from 'react-router';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import type {TrustedIssuer} from '../../models/trusted-issuer';
import TrustedIssuerDetailPage from '../TrustedIssuerDetailPage';

const {mockMutate, mockRefetch, mockDeleteMutate, mockEnvironment} = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockRefetch: vi.fn(),
  mockDeleteMutate: vi.fn(),
  mockEnvironment: {readOnly: false, applied: undefined as Record<string, unknown> | undefined, missing: false},
}));

vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useEnvironment: () => ({readOnly: mockEnvironment.readOnly}),
}));

vi.mock('@thunderid/components', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/components')>()),
  useEnvironmentResource: (_type: string, _id: string | undefined, live: Record<string, unknown>) => {
    if (mockEnvironment.missing) return {...live, data: undefined, presence: {source: 'missing'}};
    return mockEnvironment.applied
      ? {...live, data: mockEnvironment.applied, presence: {source: 'applied'}}
      : {...live, presence: {source: 'live'}};
  },
  EnvironmentDeploymentNotice: ({
    resourceType,
    resourceId = undefined,
  }: {
    resourceType: string;
    resourceId?: string;
  }) => <div data-testid="environment-notice">{`${resourceType}/${resourceId}`}</div>,
}));

const TRUSTED_ISSUER: TrustedIssuer = {
  id: 'ti-1',
  name: 'Acme Okta',
  issuer: 'https://acme.okta.com',
  jwksEndpoint: 'https://acme.okta.com/keys',
  idJagEnabled: true,
};

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useParams: vi.fn(),
  };
});

vi.mock('../../api/useTrustedIssuer', () => ({
  default: vi.fn(),
}));

vi.mock('../../api/useUpdateTrustedIssuer', () => ({
  default: () => ({mutate: mockMutate, isPending: false}),
}));

vi.mock('../../api/useDeleteConnection', () => ({
  default: () => ({mutate: mockDeleteMutate, isPending: false}),
}));

vi.mock('../../components/ConnectionDeleteDialog', () => ({
  default: function StubConnectionDeleteDialog({open, onConfirm}: {open: boolean; onConfirm: () => void}) {
    return open ? (
      <div data-testid="stub-delete-dialog">
        <button type="button" onClick={onConfirm}>
          Simulate delete confirm
        </button>
      </div>
    ) : null;
  },
}));

const {useNavigate, useParams} = await import('react-router');
const {default: useTrustedIssuer} = await import('../../api/useTrustedIssuer');

describe('TrustedIssuerDetailPage', () => {
  let mockNavigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockNavigate = vi.fn();
    mockMutate.mockReset();
    mockRefetch.mockReset();
    mockDeleteMutate.mockReset();
    mockEnvironment.readOnly = false;
    mockEnvironment.applied = undefined;
    mockEnvironment.missing = false;
    vi.mocked(useNavigate).mockReturnValue(mockNavigate as unknown as NavigateFunction);
    vi.mocked(useParams).mockReturnValue({id: 'ti-1'} as unknown as Params);
    vi.mocked(useTrustedIssuer).mockReturnValue({
      data: TRUSTED_ISSUER,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useTrustedIssuer>);
  });

  it('should not render a client id field', () => {
    render(<TrustedIssuerDetailPage />);

    expect(screen.queryByLabelText(/^Client ID/)).not.toBeInTheDocument();
  });

  it('should render the ID-JAG card title and enabled note when assertions are accepted', () => {
    render(<TrustedIssuerDetailPage />);

    expect(
      screen.getByRole('heading', {name: 'Identity Assertion JWT Authorization Grant (ID-JAG)'}),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Identity assertions from this issuer are accepted via the ID-JAG protocol.'),
    ).toBeInTheDocument();
  });

  it('should not render capability chips next to the page title', () => {
    render(<TrustedIssuerDetailPage />);

    expect(screen.queryByText('Token exchange')).not.toBeInTheDocument();
    expect(screen.queryByText('Inactive')).not.toBeInTheDocument();
    expect(screen.queryByText('ID-JAG')).not.toBeInTheDocument();
  });

  it('should hide the ID-JAG enabled note when assertions are not accepted', () => {
    vi.mocked(useTrustedIssuer).mockReturnValue({
      data: {...TRUSTED_ISSUER, idJagEnabled: false},
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useTrustedIssuer>);

    render(<TrustedIssuerDetailPage />);

    expect(
      screen.queryByText('Identity assertions from this issuer are accepted via the ID-JAG protocol.'),
    ).not.toBeInTheDocument();
  });

  it('should show the unsaved changes bar and save the updated name', async () => {
    const user = userEvent.setup();
    render(<TrustedIssuerDetailPage />);

    expect(screen.queryByTestId('save-bar')).not.toBeInTheDocument();

    const nameField = screen.getByLabelText(/^Name/);
    await user.clear(nameField);
    await user.type(nameField, 'Updated Acme Okta');

    expect(await screen.findByText('You have unsaved changes')).toBeInTheDocument();

    await user.click(screen.getByText('Save changes'));

    expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({name: 'Updated Acme Okta'}), expect.any(Object));
  });

  it('should navigate back to connections when Back is clicked', async () => {
    const user = userEvent.setup();
    render(<TrustedIssuerDetailPage />);

    await user.click(screen.getByRole('button', {name: /back to connections/i}));

    expect(mockNavigate).toHaveBeenCalledWith('/connections');
  });

  it('should navigate to connections when the trusted issuer is deleted', async () => {
    const user = userEvent.setup();
    mockDeleteMutate.mockImplementation((_id: string, opts: {onSuccess: () => void}) => {
      opts.onSuccess();
    });
    render(<TrustedIssuerDetailPage />);

    await user.click(screen.getByTestId('trusted-issuer-delete-button'));
    await user.click(screen.getByRole('button', {name: /simulate delete confirm/i}));

    expect(mockDeleteMutate).toHaveBeenCalledWith('ti-1', expect.any(Object));
    expect(mockNavigate).toHaveBeenCalledWith('/connections');
  });

  describe('in a gateway view', () => {
    beforeEach(() => {
      mockEnvironment.readOnly = true;
    });

    it('shows the issuer from the connection the gateway applied, with the deployment notice', () => {
      mockEnvironment.applied = {
        id: 'ti-1',
        type: 'oidc',
        name: 'Acme Okta as applied',
        issuer: 'https://applied.okta.com',
        jwksEndpoint: 'https://applied.okta.com/keys',
        idJagEnabled: true,
      };
      render(<TrustedIssuerDetailPage />);

      expect(screen.getByRole('heading', {name: 'Acme Okta as applied'})).toBeInTheDocument();
      expect(screen.getByLabelText(/^Issuer URI/)).toHaveValue('https://applied.okta.com');
      expect(screen.getByTestId('environment-notice')).toHaveTextContent('connection/ti-1');
    });

    it('shows the not-found state with the deployment notice when the gateway does not run the issuer', () => {
      mockEnvironment.missing = true;
      render(<TrustedIssuerDetailPage />);

      expect(screen.getByText('Trusted issuer not found')).toBeInTheDocument();
      expect(screen.getByTestId('environment-notice')).toHaveTextContent('connection/ti-1');
      expect(screen.queryByRole('heading', {name: 'Acme Okta'})).not.toBeInTheDocument();
    });

    it('disables the fields and hides the delete', () => {
      render(<TrustedIssuerDetailPage />);

      expect(screen.getByLabelText(/^Name/)).toBeDisabled();
      expect(screen.queryByTestId('trusted-issuer-delete-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('save-bar')).not.toBeInTheDocument();
    });
  });
});
