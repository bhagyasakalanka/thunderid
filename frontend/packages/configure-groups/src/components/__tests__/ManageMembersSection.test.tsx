// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {renderWithProviders} from '@thunderid/test-utils';
import type * as OxygenUI from '@wso2/oxygen-ui';
import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import ManageMembersSection from '../edit-group/members-settings/ManageMembersSection';

interface MockDataGridProps {
  rows?: {id: string; [key: string]: unknown}[];
  columns?: {
    field?: string;
    renderCell?: (params: {row: Record<string, unknown>; field: string; value: unknown; id: string}) => React.ReactNode;
  }[];
  loading?: boolean;
}

vi.mock('@wso2/oxygen-ui', async () => {
  const actual = await vi.importActual<typeof OxygenUI>('@wso2/oxygen-ui');
  return {
    ...actual,
    DataGrid: {
      ...(actual.DataGrid ?? {}),
      DataGrid: ({rows = [], columns = [], loading = false}: MockDataGridProps) => (
        <div data-testid="members-grid" data-loading={loading}>
          {rows.map((row) => (
            <div key={row.id} data-testid={`member-${row.id}`}>
              {columns.map((column) => {
                if (!column?.field || !column.renderCell) return null;
                return (
                  <span key={`${row.id}-${column.field}`}>
                    {column.renderCell({row, field: column.field, value: row[column.field], id: String(row.id)})}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      ),
    },
  };
});

const {mockUseEnvironmentResource} = vi.hoisted(() => ({mockUseEnvironmentResource: vi.fn()}));

vi.mock('@thunderid/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@thunderid/components')>();
  return {
    ...actual,
    useEnvironmentResource: (...args: Parameters<typeof actual.useEnvironmentResource>): unknown =>
      mockUseEnvironmentResource(...args) ?? {...args[2], presence: {source: 'live', isLoading: false}},
  };
});

const mockUseGetGroupMembers = vi.fn();
vi.mock('../../api/useGetGroupMembers', () => ({
  default: (...args: unknown[]): unknown => mockUseGetGroupMembers(...args),
}));

describe('ManageMembersSection', () => {
  const defaultProps = {
    groupId: 'g1',
    onRemoveMember: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEnvironmentResource.mockReturnValue(undefined);
    mockUseGetGroupMembers.mockReturnValue({
      data: {
        totalResults: 3,
        startIndex: 0,
        count: 3,
        members: [
          {id: 'u1', type: 'user'},
          {id: 'g2', type: 'group'},
          {id: 'a1', type: 'app'},
        ],
      },
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the section title', () => {
    renderWithProviders(<ManageMembersSection {...defaultProps} />);

    expect(screen.getByText('Members')).toBeInTheDocument();
  });

  it('should render members in the data grid', () => {
    renderWithProviders(<ManageMembersSection {...defaultProps} />);

    expect(screen.getByTestId('member-u1')).toBeInTheDocument();
    expect(screen.getByTestId('member-g2')).toBeInTheDocument();
    expect(screen.getByTestId('member-a1')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseGetGroupMembers.mockReturnValue({
      data: null,
      isLoading: true,
    });
    renderWithProviders(<ManageMembersSection {...defaultProps} />);

    expect(screen.getByTestId('members-grid')).toHaveAttribute('data-loading', 'true');
  });

  it('should render header action when provided', () => {
    renderWithProviders(<ManageMembersSection {...defaultProps} headerAction={<button type="button">Add</button>} />);

    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('should call useGetGroupMembers with groupId and pagination params', () => {
    renderWithProviders(<ManageMembersSection {...defaultProps} />);

    expect(mockUseGetGroupMembers).toHaveBeenCalledWith('g1', {limit: 10, offset: 0});
  });

  it('should call onRemoveMember when remove button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ManageMembersSection {...defaultProps} />);

    // The actions column renderCell creates an IconButton with aria-label "Remove"
    const removeButtons = screen.getAllByRole('button', {name: /remove/i});
    expect(removeButtons.length).toBeGreaterThan(0);
    await user.click(removeButtons[0]);

    expect(defaultProps.onRemoveMember).toHaveBeenCalledWith({id: 'u1', type: 'user'});
  });

  it('reads the members as the gateway applied them, paged here', () => {
    const applied = Array.from({length: 12}, (_, index) => ({id: `applied-${index}`, type: 'user'}));
    mockUseEnvironmentResource.mockReturnValue({
      data: {totalResults: 12, startIndex: 1, count: 12, members: applied},
      isLoading: false,
      presence: {source: 'applied', isLoading: false},
    });
    renderWithProviders(<ManageMembersSection {...defaultProps} isReadOnly />);

    expect(mockUseEnvironmentResource).toHaveBeenCalledWith('group', 'g1', expect.anything(), 'members');
    expect(screen.getByTestId('member-applied-0')).toBeInTheDocument();
    expect(screen.getByTestId('member-applied-9')).toBeInTheDocument();
    expect(screen.queryByTestId('member-applied-10')).not.toBeInTheDocument();
    expect(screen.queryByTestId('member-u1')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: /remove/i})).not.toBeInTheDocument();
  });
});
