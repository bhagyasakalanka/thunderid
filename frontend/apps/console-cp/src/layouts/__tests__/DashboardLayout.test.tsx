// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useProjectScope} from '@thunderid/contexts';
import {render, screen, userEvent, waitFor, within} from '@thunderid/test-utils';
import {useEffect} from 'react';
import {afterEach, describe, it, expect, vi, beforeEach} from 'vitest';
import SelectedProjectScope from '../../components/SelectedProjectScope';
import {PROJECT_SELECTION_STORAGE_KEY} from '../../hooks/useProjectSelection';
import DashboardLayout from '../DashboardLayout';

const mockNavigate = vi.fn();
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockClearSession = vi.fn();
const mockLoggerError = vi.fn();
const mockLoggerWarn = vi.fn();
const mockUserData = vi.fn();
interface MockUseGetApplicationsResult {
  data?: {
    applications?: {
      clientId?: string;
      name?: string;
      template?: string;
    }[];
  };
  isLoading: boolean;
}

const mockUseGetApplications = vi.fn<(params: unknown) => MockUseGetApplicationsResult>();
let mockDiscovery: {wellKnown?: {end_session_endpoint?: string}} | undefined;
let mockIsTrustedIssuerGenericOidc = false;
let mockProjects: {id: string; displayName: string}[] = [];
let mockProjectChanges: Record<string, number> = {};

let mockPath = '/';
vi.mock('@thunderid/configure-gateways', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@thunderid/configure-gateways')>();
  return {
    environmentColor: actual.environmentColor,
    environmentSectionOf: actual.environmentSectionOf,
    useDeployRoutes: () => actual.defaultDeployRoutePaths,
    usePipeline: () => ({
      data: {stages: [{name: 'Development', gateway: {id: 'gw-dev', name: 'dev', baseUrl: 'https://dev.test'}}]},
    }),
    useProjects: () => ({data: mockProjects, isSuccess: true}),
    useProjectChanges: () => mockProjectChanges,
    useProjectScope: actual.useProjectScope,
    useProjectStatuses: () => ({
      byGateway: {
        'gw-dev': {
          project: {versions: [{hash: 'h37', number: 37, resources: 2}], pending: 4, required: 1},
          shared: {pending: 0, byType: []},
          needed: {differing: 0},
        },
      },
      isLoading: false,
    }),
    useVersions: () => ({data: [{version: 'h42', number: 42}]}),
  };
});

/** What the pages under the layout are scoped to. */
function ScopedOutlet() {
  return (
    <div data-testid="outlet">
      Outlet Content<span data-testid="outlet-project">{useProjectScope().projectId ?? 'none'}</span>
    </div>
  );
}

vi.mock('@thunderid/configure-applications', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/configure-applications')>()),
  useGetApplications: (params: unknown) => mockUseGetApplications(params),
}));

// Mock ThunderID
vi.mock('@thunderid/react', () => ({
  useThunderID: () => ({
    signIn: mockSignIn,
    clearSession: mockClearSession,
    discovery: mockDiscovery,
  }),
  User: ({children}: {children: (user: unknown) => React.ReactNode}) => children(mockUserData()),
  SignOutButton: ({children}: {children: (props: {signOut: () => void}) => React.ReactNode}) =>
    children({signOut: mockSignOut}),
}));

// Mock contexts
vi.mock('@thunderid/contexts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@thunderid/contexts')>();
  return {
    ...actual,
    useConfig: () => ({
      config: {
        brand: {
          product_name: 'ThunderID',
          favicon: {light: 'assets/images/favicon.ico', dark: 'assets/images/favicon-inverted.ico'},
        },
        client: {client_id: 'CONSOLE'},
      },
      isTrustedIssuerGenericOidc: () => mockIsTrustedIssuerGenericOidc,
      getTrustedIssuerClientId: () => 'test-client-id',
      getClientUrl: () => 'https://localhost:5191/console',
      getServerUrl: () => 'https://localhost:8090',
    }),
  };
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock logger
vi.mock('@thunderid/logger/react', () => ({
  useLogger: () => ({
    error: mockLoggerError,
    warn: mockLoggerWarn,
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock Outlet
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    Outlet: () => <ScopedOutlet />,
    Link: ({children, to}: {children: React.ReactNode; to: string}) => (
      <a href={to} data-testid="router-link">
        {children}
      </a>
    ),
    useNavigate: () => mockNavigate,
    useMatch: (pattern: string) => actual.matchPath(pattern, mockPath),
  };
});

describe('DashboardLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockUserData.mockReturnValue({name: 'Test User', email: 'test@example.com'});
    mockIsTrustedIssuerGenericOidc = false;
    mockDiscovery = undefined;
    mockProjects = [];
    mockProjectChanges = {};
    mockPath = '/';
    localStorage.clear();
    mockUseGetApplications.mockReturnValue({
      data: {applications: []},
      isLoading: false,
    });
  });

  it('renders AppShell layout', () => {
    const {rerender} = render(<DashboardLayout />);
    rerender(<DashboardLayout />);

    // Check that the outlet is rendered
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('renders Outlet for nested routes', () => {
    render(<DashboardLayout />);

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toHaveTextContent('Outlet Content');
    expect(screen.getByTestId('outlet-project')).toHaveTextContent('none');
  });

  it('offers no project selector while there are no projects', () => {
    render(<DashboardLayout />);

    expect(screen.queryByTestId('project-switcher')).not.toBeInTheDocument();
  });

  it("selects a project from the header's project selector and opens its environments", async () => {
    mockProjects = [
      {id: 'p-shop', displayName: 'Shop'},
      {id: 'p-billing', displayName: 'Billing'},
    ];
    render(
      <SelectedProjectScope>
        <DashboardLayout />
      </SelectedProjectScope>,
    );

    // No project is selected at first: the console starts at the organization.
    expect(screen.getByTestId('outlet-project')).toHaveTextContent('none');
    await userEvent.click(screen.getByRole('button', {name: 'common:header.openProject'}));
    await userEvent.click(await screen.findByRole('menuitem', {name: 'Billing'}));

    expect(mockNavigate).toHaveBeenCalledWith('/projects/p-billing');
    expect(localStorage.getItem(PROJECT_SELECTION_STORAGE_KEY)).toBe('p-billing');
    await waitFor(() => expect(screen.getByTestId('outlet-project')).toHaveTextContent('p-billing'));
  });

  it("lists the selected project's applications and agents under it, with what is not deployed yet", () => {
    mockProjects = [{id: 'p-shop', displayName: 'Shop'}];
    mockProjectChanges = {application: 2};
    localStorage.setItem(PROJECT_SELECTION_STORAGE_KEY, 'p-shop');
    render(
      <SelectedProjectScope>
        <DashboardLayout />
      </SelectedProjectScope>,
    );

    expect(screen.getByTestId('outlet-project')).toHaveTextContent('p-shop');
    expect(screen.getByText('navigation:categories.project')).toBeInTheDocument();
    expect(screen.getByText('navigation:pages.deploymentPipeline')).toBeInTheDocument();
    expect(screen.getByText('navigation:categories.build')).toBeInTheDocument();
    expect(screen.getAllByText('navigation:pages.applications')).toHaveLength(1);
    expect(screen.getAllByText('navigation:pages.agents')).toHaveLength(1);
    // Nothing of the organization's is listed inside a project.
    expect(screen.queryByText('navigation:pages.home')).not.toBeInTheDocument();
    expect(screen.queryByText('navigation:pages.groups')).not.toBeInTheDocument();
    expect(screen.queryByText('navigation:categories.identities')).not.toBeInTheDocument();
    expect(screen.getByText('navigation:badges.undeployed')).toBeInTheDocument();
  });

  it('keeps the whole label beside an undeployed badge, the badge after it', () => {
    mockProjects = [{id: 'p-shop', displayName: 'Shop'}];
    mockProjectChanges = {application: 1};
    localStorage.setItem(PROJECT_SELECTION_STORAGE_KEY, 'p-shop');
    render(
      <SelectedProjectScope>
        <DashboardLayout />
      </SelectedProjectScope>,
    );

    const label = screen.getByText('navigation:pages.applications').closest('.MuiListItemText-root')!;
    const badge = screen.getByText('navigation:badges.undeployed').closest('.MuiChip-root')!;
    expect(getComputedStyle(label).flexShrink).toBe('0');
    expect(getComputedStyle(label).overflow).toBe('visible');
    expect(getComputedStyle(badge).flexShrink).toBe('0');
    expect(label.compareDocumentPosition(badge) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows the environment's own navigation on its pages, back to the project", () => {
    mockProjects = [{id: 'p-shop', displayName: 'Shop'}];
    localStorage.setItem(PROJECT_SELECTION_STORAGE_KEY, 'p-shop');
    mockPath = '/projects/p-shop/environments/gw-dev/values';
    render(
      <SelectedProjectScope>
        <DashboardLayout />
      </SelectedProjectScope>,
    );

    // The way back names the project, as the header's selector does.
    expect(screen.getAllByText('Shop').length).toBeGreaterThan(1);
    expect(screen.getByText('navigation:categories.environment')).toBeInTheDocument();
    for (const page of [
      'navigation:pages.overview',
      'navigation:pages.variablesAndSecrets',
      'navigation:pages.endpoints',
      'navigation:pages.deployedConfiguration',
      'navigation:pages.deploymentHistory',
    ]) {
      expect(screen.getByText(page)).toBeInTheDocument();
    }
    expect(screen.queryByText('navigation:pages.applications')).not.toBeInTheDocument();
  });

  it("switches between the project's configuration and its environments from the header", async () => {
    mockProjects = [{id: 'p-shop', displayName: 'Shop'}];
    localStorage.setItem(PROJECT_SELECTION_STORAGE_KEY, 'p-shop');
    render(
      <SelectedProjectScope>
        <DashboardLayout />
      </SelectedProjectScope>,
    );

    const switcher = screen.getByTestId('environment-switcher');
    expect(switcher).toHaveTextContent('common:header.projectConfiguration');
    expect(screen.queryByTestId('header-read-only')).not.toBeInTheDocument();
    await userEvent.click(switcher);
    expect(await screen.findByText('v37 · common:header.changesBehind')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('menuitem', {name: /DEVELOPMENT/}));
    expect(mockNavigate).toHaveBeenCalledWith('/projects/p-shop/environments/gw-dev');
  });

  it('shows only the projects entry in the header at the organization level, with no environment switcher', () => {
    mockProjects = [{id: 'p-shop', displayName: 'Shop'}];
    mockPath = '/home';
    render(
      <SelectedProjectScope>
        <DashboardLayout />
      </SelectedProjectScope>,
    );

    expect(screen.getByRole('button', {name: 'common:header.openProject'})).toBeInTheDocument();
    expect(screen.queryByTestId('environment-switcher')).not.toBeInTheDocument();
    expect(screen.queryByTestId('header-read-only')).not.toBeInTheDocument();
  });

  it('names the environment open, and says its configuration is read-only there', () => {
    mockProjects = [{id: 'p-shop', displayName: 'Shop'}];
    localStorage.setItem(PROJECT_SELECTION_STORAGE_KEY, 'p-shop');
    mockPath = '/projects/p-shop/environments/gw-dev';
    render(
      <SelectedProjectScope>
        <DashboardLayout />
      </SelectedProjectScope>,
    );

    expect(screen.getByTestId('environment-switcher')).toHaveTextContent('DEVELOPMENT');
    expect(screen.getByTestId('header-read-only')).toHaveTextContent('common:header.readOnly');
  });

  it('leads out of a project to the organization from the top of its navigation', () => {
    mockProjects = [{id: 'p-shop', displayName: 'Shop'}];
    localStorage.setItem(PROJECT_SELECTION_STORAGE_KEY, 'p-shop');
    render(
      <SelectedProjectScope>
        <DashboardLayout />
      </SelectedProjectScope>,
    );

    expect(screen.getByText('navigation:pages.organizationSettings')).toBeInTheDocument();
  });

  it('keeps a project selected while the remembered one was found stale, as opening its page does', async () => {
    mockProjects = [{id: 'p-shop', displayName: 'Shop'}];
    localStorage.setItem(PROJECT_SELECTION_STORAGE_KEY, 'p-gone');
    // A project's page selects its project in an effect that runs before the layout's.
    function OpenShop(): null {
      useEffect(() => {
        localStorage.setItem(PROJECT_SELECTION_STORAGE_KEY, 'p-shop');
      }, []);
      return null;
    }

    render(
      <SelectedProjectScope>
        <OpenShop />
        <DashboardLayout />
      </SelectedProjectScope>,
    );

    await waitFor(() => expect(localStorage.getItem(PROJECT_SELECTION_STORAGE_KEY)).toBe('p-shop'));
  });

  it('forgets a remembered project that no longer exists', async () => {
    mockProjects = [{id: 'p-shop', displayName: 'Shop'}];
    localStorage.setItem(PROJECT_SELECTION_STORAGE_KEY, 'p-gone');
    render(
      <SelectedProjectScope>
        <DashboardLayout />
      </SelectedProjectScope>,
    );

    await waitFor(() => expect(localStorage.getItem(PROJECT_SELECTION_STORAGE_KEY)).toBe(''));
    expect(screen.getByTestId('outlet-project')).toHaveTextContent('none');
  });

  it('leaves the selected project for the organization', async () => {
    mockProjects = [{id: 'p-shop', displayName: 'Shop'}];
    localStorage.setItem(PROJECT_SELECTION_STORAGE_KEY, 'p-shop');
    render(
      <SelectedProjectScope>
        <DashboardLayout />
      </SelectedProjectScope>,
    );

    await userEvent.click(screen.getByRole('button', {name: 'common:header.leaveProject'}));

    expect(mockNavigate).toHaveBeenCalledWith('/home');
    await waitFor(() => expect(screen.getByTestId('outlet-project')).toHaveTextContent('none'));
    expect(screen.queryByText('navigation:categories.project')).not.toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'common:header.openProject'})).toBeInTheDocument();
  });

  it('switches to another project from the selected one', async () => {
    mockProjects = [
      {id: 'p-shop', displayName: 'Shop'},
      {id: 'p-billing', displayName: 'Billing'},
    ];
    localStorage.setItem(PROJECT_SELECTION_STORAGE_KEY, 'p-shop');
    render(
      <SelectedProjectScope>
        <DashboardLayout />
      </SelectedProjectScope>,
    );

    await userEvent.click(screen.getByRole('combobox', {name: 'common:header.project'}));
    const options = within(await screen.findByRole('listbox')).getAllByRole('option');
    // Only projects are listed: leaving one is the close button's.
    expect(options.map((option) => option.textContent)).toEqual(['Shop', 'Billing']);
    await userEvent.click(options[1]);

    expect(mockNavigate).toHaveBeenCalledWith('/projects/p-billing');
    await waitFor(() => expect(screen.getByTestId('outlet-project')).toHaveTextContent('p-billing'));
  });

  it('renders navigation categories', () => {
    render(<DashboardLayout />);

    // The organization's navigation, grouped as its overview lays it out.
    for (const category of [
      'navigation:categories.administration',
      'navigation:categories.identitySetup',
      'navigation:categories.signInExperience',
      'navigation:categories.apisAndCredentials',
    ]) {
      expect(screen.getByText(category)).toBeInTheDocument();
    }
    expect(screen.getByText('navigation:pages.overview')).toBeInTheDocument();
  });

  it('offers no Deploy in the header or the navigation', () => {
    render(<DashboardLayout />);

    expect(screen.queryByRole('link', {name: /deploy/i})).not.toBeInTheDocument();
    expect(screen.queryByTestId('header-deploy')).not.toBeInTheDocument();
  });

  it('renders navigation items', () => {
    render(<DashboardLayout />);

    // Check for navigation items using translation keys
    expect(screen.getByText('navigation:pages.administrators')).toBeInTheDocument();
    expect(screen.getByText('navigation:pages.userTypes')).toBeInTheDocument();
    expect(screen.getByText('navigation:pages.connections')).toBeInTheDocument();
    // Applications and agents belong to projects, so the organization lists neither.
    expect(screen.queryByText('navigation:pages.applications')).not.toBeInTheDocument();
    expect(screen.queryByText('navigation:pages.agents')).not.toBeInTheDocument();
    expect(screen.getByText('navigation:pages.flows')).toBeInTheDocument();
    expect(screen.getByText('navigation:pages.gateways')).toBeInTheDocument();
  });

  it.each([false, true])('keeps navigation icon sizes consistent when collapseSidebar is %s', (collapseSidebar) => {
    render(<DashboardLayout collapseSidebar={collapseSidebar} />);

    const applicationIcon = screen.getByRole('button', {name: 'navigation:pages.connections'}).querySelector('svg');
    expect(applicationIcon).toBeInTheDocument();

    const navigationIcons = screen.getByRole('navigation').querySelectorAll('.MuiListItemIcon-root svg');
    expect(navigationIcons.length).toBeGreaterThan(0);
    navigationIcons.forEach((icon) => {
      expect(icon).toHaveAttribute('width', applicationIcon?.getAttribute('width'));
      expect(icon).toHaveAttribute('height', applicationIcon?.getAttribute('height'));
    });
  });

  it('renders footer', () => {
    render(<DashboardLayout />);

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
  });

  it('does not start a second sign-in after signing out', async () => {
    const user = userEvent.setup();
    mockSignOut.mockResolvedValue(undefined);

    render(<DashboardLayout />);

    // Open the user menu first
    const userMenuTrigger = screen.getByLabelText('Account');
    await user.click(userMenuTrigger);

    // Click sign out menu item
    const signOutButton = await screen.findByText('common:actions.signOut');
    await user.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('logs error when signOut fails', async () => {
    const user = userEvent.setup();
    const signOutError = new Error('Sign out failed');
    mockSignOut.mockRejectedValue(signOutError);

    render(<DashboardLayout />);

    // Open the user menu first
    const userMenuTrigger = screen.getByLabelText('Account');
    await user.click(userMenuTrigger);

    // Click sign out menu item
    const signOutButton = await screen.findByText('common:actions.signOut');
    await user.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockLoggerError).toHaveBeenCalledWith('Sign out failed', {error: signOutError});
    });
  });

  it('renders the user profile picture in the account menu when available', () => {
    mockUserData.mockReturnValue({
      name: 'Test User',
      email: 'test@example.com',
      picture: 'https://example.com/avatar.png',
    });

    render(<DashboardLayout />);

    const avatarImages = screen
      .getAllByRole<HTMLImageElement>('img')
      .filter((img) => img.src === 'https://example.com/avatar.png');
    expect(avatarImages.length).toBeGreaterThan(0);
  });

  it('renders two-letter initials in the account menu when there is no profile picture', () => {
    render(<DashboardLayout />);

    expect(screen.getAllByText('TU').length).toBeGreaterThan(0);
  });

  it('renders with fallback values when user data is missing', () => {
    mockUserData.mockReturnValue(null);

    render(<DashboardLayout />);

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('renders with undefined user name and email', () => {
    mockUserData.mockReturnValue({name: undefined, email: undefined});

    render(<DashboardLayout />);

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('navigates to welcome page when welcome menu item is clicked', async () => {
    const user = userEvent.setup();
    render(<DashboardLayout />);

    const userMenuTrigger = screen.getByLabelText('Account');
    await user.click(userMenuTrigger);

    const welcomeItem = await screen.findByText('common:userMenu.welcome');
    expect(welcomeItem).toBeInTheDocument();
    await user.click(welcomeItem);
  });

  describe('generic OIDC sign out', () => {
    let originalLocation: Location;

    beforeEach(() => {
      mockIsTrustedIssuerGenericOidc = true;
      originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: {...originalLocation, href: ''},
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });

    it('clears local session and redirects to client URL when end_session_endpoint is missing', async () => {
      mockDiscovery = {wellKnown: {}};
      const user = userEvent.setup();

      render(<DashboardLayout />);

      const userMenuTrigger = screen.getByLabelText('Account');
      await user.click(userMenuTrigger);

      const signOutButton = await screen.findByText('common:actions.signOut');
      await user.click(signOutButton);

      expect(mockClearSession).toHaveBeenCalled();
      expect(mockLoggerWarn).toHaveBeenCalledWith(expect.stringContaining('end_session_endpoint missing'));
      expect(window.location.href).toBe('https://localhost:5191/console');
    });

    it('clears local session and redirects to IdP end_session_endpoint when available', async () => {
      mockDiscovery = {wellKnown: {end_session_endpoint: 'https://idp.example.com/logout'}};
      const user = userEvent.setup();

      render(<DashboardLayout />);

      const userMenuTrigger = screen.getByLabelText('Account');
      await user.click(userMenuTrigger);

      const signOutButton = await screen.findByText('common:actions.signOut');
      await user.click(signOutButton);

      expect(mockClearSession).toHaveBeenCalled();
      expect(window.location.href).toContain('https://idp.example.com/logout');
      expect(window.location.href).toContain('client_id=test-client-id');
    });

    it('logs error when clearSession throws during generic OIDC sign out', async () => {
      mockDiscovery = {wellKnown: {end_session_endpoint: 'https://idp.example.com/logout'}};
      const sessionError = new Error('session clear failed');
      mockClearSession.mockImplementation(() => {
        throw sessionError;
      });
      const user = userEvent.setup();

      render(<DashboardLayout />);

      const userMenuTrigger = screen.getByLabelText('Account');
      await user.click(userMenuTrigger);

      const signOutButton = await screen.findByText('common:actions.signOut');
      await user.click(signOutButton);

      expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining('Failed to clear local session'), {
        error: sessionError,
      });
    });
  });
});
