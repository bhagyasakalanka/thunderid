// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import userEvent from '@testing-library/user-event';
import {render, screen} from '@thunderid/test-utils';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import ManageAssignmentsSection from '../ManageAssignmentsSection';

vi.mock('../../../../api/useGetRoleAssignments');
vi.mock('@thunderid/hooks', () => ({
  useDataGridLocaleText: vi.fn(),
}));

const {applied} = vi.hoisted(() => ({
  // The role's assignments as a gateway applied them, set by a gateway view test.
  applied: {current: undefined as unknown},
}));

vi.mock('@thunderid/components', () => ({
  useEnvironmentResource: (_type: string, _id: string, live: Record<string, unknown>) =>
    applied.current
      ? {...live, data: applied.current, presence: {source: 'applied', isLoading: false}}
      : {...live, presence: {source: 'live', isLoading: false}},
  SettingsCard: ({
    title,
    description,
    children,
    headerAction = undefined,
  }: {
    title: string;
    description: string;
    children: React.ReactNode;
    headerAction?: React.ReactNode;
  }) => (
    <div data-testid="settings-card">
      <h3>{title}</h3>
      <p>{description}</p>
      {headerAction}
      {children}
    </div>
  ),
}));

vi.mock('@wso2/oxygen-ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@wso2/oxygen-ui')>();
  return {
    ...actual,
    DataGrid: {
      DataGrid: ({
        rows,
        columns,
        getRowId = undefined,
      }: {
        rows: Record<string, unknown>[];
        columns: {
          field: string;
          renderCell?: (params: {row: Record<string, unknown>}) => React.ReactElement;
          valueGetter?: (value: unknown, row: Record<string, unknown>) => string;
        }[];
        getRowId?: (row: Record<string, unknown>) => string;
      }) => (
        <div role="grid" data-testid="data-grid">
          {rows.map((row) => {
            const rowId = getRowId ? getRowId(row) : (row.id as string);
            return (
              <div key={rowId} role="row" data-row-id={rowId}>
                {columns.map((col) => {
                  if (col.renderCell) return <div key={col.field}>{col.renderCell({row})}</div>;
                  if (col.valueGetter) return <div key={col.field}>{col.valueGetter(null, row)}</div>;
                  return <div key={col.field}>{row[col.field] as string}</div>;
                })}
              </div>
            );
          })}
        </div>
      ),
    },
  };
});

const {default: useGetRoleAssignments} = await import('../../../../api/useGetRoleAssignments');
const {useDataGridLocaleText} = await import('@thunderid/hooks');

describe('ManageAssignmentsSection', () => {
  const mockOnRemoveAssignment = vi.fn();
  const mockOnAssignmentTabChange = vi.fn();

  const defaultProps = {
    roleId: 'role-1',
    onRemoveAssignment: mockOnRemoveAssignment,
    activeAssignmentTab: 0,
    onAssignmentTabChange: mockOnAssignmentTabChange,
  };

  const mockUserAssignments = {
    totalResults: 2,
    startIndex: 0,
    count: 2,
    assignments: [
      {id: 'user-1', type: 'user' as const, display: 'Alice'},
      {id: 'user-2', type: 'user' as const, display: 'Bob'},
    ],
  };

  const mockGroupAssignments = {
    totalResults: 1,
    startIndex: 0,
    count: 1,
    assignments: [{id: 'group-1', type: 'group' as const, display: 'Engineering'}],
  };
  const mockAppAssignments = {
    totalResults: 1,
    startIndex: 0,
    count: 1,
    assignments: [{id: 'app-1', type: 'app' as const, display: 'Orders API'}],
  };

  const renderComponent = (props = {}) => render(<ManageAssignmentsSection {...defaultProps} {...props} />);

  beforeEach(() => {
    vi.mocked(useDataGridLocaleText).mockReturnValue({});

    vi.mocked(useGetRoleAssignments).mockImplementation(
      (params: {type?: string}) =>
        ({
          data:
            params.type === 'user'
              ? mockUserAssignments
              : params.type === 'group'
                ? mockGroupAssignments
                : mockAppAssignments,
          isLoading: false,
          error: null,
        }) as unknown as ReturnType<typeof useGetRoleAssignments>,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    applied.current = undefined;
  });

  describe('Rendering', () => {
    it('should render SettingsCard with title and description', () => {
      renderComponent();

      expect(screen.getByRole('heading', {name: 'Assigned Users, Groups, Apps & Agents'})).toBeInTheDocument();
      expect(screen.getByText('Manage users, groups, apps, and agents assigned to this role')).toBeInTheDocument();
    });

    it('should render Users tab showing user assignments', () => {
      renderComponent();

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should render Groups tab content when activeAssignmentTab is 1', () => {
      renderComponent({activeAssignmentTab: 1});

      expect(screen.getByText('Engineering')).toBeInTheDocument();
    });

    it('should render Apps tab content when activeAssignmentTab is 2', () => {
      renderComponent({activeAssignmentTab: 2});

      expect(screen.getByText('Orders API')).toBeInTheDocument();
    });

    it('should render headerAction when provided', () => {
      renderComponent({headerAction: <button type="button">Add</button>});

      expect(screen.getByRole('button', {name: 'Add'})).toBeInTheDocument();
    });

    it('should display avatar initial from display name', () => {
      renderComponent();

      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('should display user ID in the row', () => {
      renderComponent();

      expect(screen.getByText('user-1')).toBeInTheDocument();
      expect(screen.getByText('user-2')).toBeInTheDocument();
    });

    it('should use ID as fallback when display name is missing', () => {
      vi.mocked(useGetRoleAssignments).mockImplementation(
        (params: {type?: string}) =>
          ({
            data:
              params.type === 'user'
                ? {
                    totalResults: 1,
                    startIndex: 0,
                    count: 1,
                    assignments: [{id: 'user-no-name', type: 'user'}],
                  }
                : mockGroupAssignments,
            isLoading: false,
            error: null,
          }) as unknown as ReturnType<typeof useGetRoleAssignments>,
      );

      renderComponent();

      const matches = screen.getAllByText('user-no-name');
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('User Interactions', () => {
    it('should call onAssignmentTabChange when Groups tab is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByText('Groups'));

      expect(mockOnAssignmentTabChange).toHaveBeenCalledWith(1);
    });

    it('should call onRemoveAssignment when delete button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const removeButtons = screen.getAllByRole('button', {name: 'Remove'});
      await user.click(removeButtons[0]);

      expect(mockOnRemoveAssignment).toHaveBeenCalledTimes(1);
      expect(mockOnRemoveAssignment).toHaveBeenCalledWith({id: 'user-1', type: 'user', display: 'Alice'});
    });

    it('should render a delete button for each row', () => {
      renderComponent();

      const removeButtons = screen.getAllByRole('button', {name: 'Remove'});
      expect(removeButtons).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty assignments', () => {
      vi.mocked(useGetRoleAssignments).mockImplementation(
        () =>
          ({
            data: {totalResults: 0, startIndex: 0, count: 0, assignments: []},
            isLoading: false,
            error: null,
          }) as unknown as ReturnType<typeof useGetRoleAssignments>,
      );

      renderComponent();

      expect(screen.getByRole('grid')).toBeInTheDocument();
      expect(screen.queryByRole('row')).not.toBeInTheDocument();
    });

    it('should handle loading state', () => {
      vi.mocked(useGetRoleAssignments).mockImplementation(
        () =>
          ({
            data: undefined,
            isLoading: true,
            error: null,
          }) as unknown as ReturnType<typeof useGetRoleAssignments>,
      );

      renderComponent();

      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Gateway view', () => {
    it('should show the assignments of the tab type as the gateway applied them', () => {
      applied.current = {
        totalResults: 3,
        startIndex: 1,
        count: 3,
        assignments: [
          {id: 'applied-user', type: 'user', display: 'Applied User'},
          {id: 'applied-group', type: 'group', display: 'Applied Group'},
          {id: 'applied-app', type: 'app', display: 'Applied App'},
        ],
      };
      renderComponent({isReadOnly: true});

      expect(screen.getByText('Applied User')).toBeInTheDocument();
      expect(screen.queryByText('Applied Group')).not.toBeInTheDocument();
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', {name: /remove/i})).not.toBeInTheDocument();
    });

    it('should page the applied assignments here', () => {
      applied.current = {
        totalResults: 12,
        startIndex: 1,
        count: 12,
        assignments: Array.from({length: 12}, (_, index) => ({id: `u-${index}`, type: 'user', display: `User ${index}`})),
      };
      renderComponent();

      expect(screen.getByText('User 9')).toBeInTheDocument();
      expect(screen.queryByText('User 10')).not.toBeInTheDocument();
    });
  });
});
