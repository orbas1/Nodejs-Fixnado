import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header.jsx';

const mockUseSession = vi.fn();
const mockUseProfile = vi.fn();

vi.mock('../../hooks/useSession.js', () => ({
  useSession: () => mockUseSession()
}));

vi.mock('../../hooks/useProfile.js', () => ({
  useProfile: () => mockUseProfile()
}));

const translations = {
  'nav.login': 'Log in',
  'nav.register': 'Register',
  'nav.profile': 'Profile',
  'nav.getStarted': 'Get started',
  'nav.feed': 'Feed',
  'nav.explore': 'Explore',
  'nav.search': 'Search',
  'nav.providers': 'Providers',
  'nav.teams': 'Teams',
  'nav.gear': 'Gear',
  'nav.dashboards': 'Dashboards',
  'nav.solutions': 'Solutions',
  'nav.resources': 'Resources',
  'nav.work': 'Work',
  'nav.ops': 'Ops',
  'nav.info': 'Info',
  'nav.fronts': 'Fronts',
  'nav.store': 'Store',
  'nav.geo': 'Geo',
  'nav.comms': 'Comms',
  'nav.trust': 'Trust',
  'nav.terms': 'Terms',
  'nav.providerOnboarding': 'Provider signup',
  'nav.profileShort': 'Profile',
  'nav.enterpriseAnalyticsDescription': 'Enterprise analytics',
  'nav.workspacesDescription': 'Manage workspaces',
  'nav.marketplace': 'Marketplace',
  'nav.notifications': 'Notifications',
  'nav.notificationsEmpty': 'You are all caught up.',
  'nav.notificationsAgo': 'ago',
  'nav.inbox': 'Inbox',
  'nav.inboxEmpty': 'No new messages right now.',
  'nav.messagesOpenThread': 'Open chat',
  'nav.messagesViewMore': 'View full inbox',
  'nav.accountMenu': 'Account menu',
  'nav.statusLabel': '{status} status',
  'nav.viewDashboard': 'Go to dashboard',
  'nav.manageAccountHint': 'Manage account controls from your dashboard profile.',
  'nav.toggleMenu': 'Toggle navigation menu',
  'auth.login.cta': 'Access your workspace'
};

vi.mock('../../hooks/useLocale.js', () => ({
  useLocale: () => ({
    t: (key, values) => {
      const template = translations[key] ?? key;
      if (!values) {
        return template;
      }
      return template.replace(/\{([^}]+)\}/g, (match, token) => values[token.trim()] ?? '');
    },
    locale: 'en-GB'
  })
}));

vi.mock('../LanguageSelector.jsx', () => ({
  default: (props) => <div data-testid="language-selector" data-variant={props.variant} />
}));

beforeEach(() => {
  mockUseSession.mockReturnValue({
    isAuthenticated: true,
    role: 'provider',
    userId: 'alex.rivera',
    dashboards: ['provider']
  });
  mockUseProfile.mockReturnValue({
    profile: { firstName: 'Alex', lastName: 'Rivera', email: 'alex.rivera@fixnado.test' }
  });
});

describe('Header navigation layout', () => {
  it('renders minimal controls for guests', () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: false,
      role: 'guest',
      userId: null,
      dashboards: []
    });
    mockUseProfile.mockReturnValue({ profile: {} });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Log in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Register/i })).toBeInTheDocument();
    expect(screen.getAllByTestId('language-selector')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Explore/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Toggle navigation menu/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Notifications/i)).not.toBeInTheDocument();
  });

  it('shows consolidated navigation when authenticated', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const accountButton = screen.getByRole('button', { name: /Account menu/i });
    fireEvent.click(accountButton);
    const selectors = screen.getAllByTestId('language-selector');
    expect(selectors).toHaveLength(1);
    expect(selectors[0]).toHaveAttribute('data-variant', 'menu');
    const explorerButton = screen.getByRole('button', { name: /Explore/i });
    fireEvent.click(explorerButton);
    expect(screen.getByRole('link', { name: /Search/i })).toBeInTheDocument();
    const dashboardsButton = screen.getByRole('button', { name: /Dashboards/i });
    fireEvent.click(dashboardsButton);
    expect(screen.getByRole('link', { name: /^Provider$/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Admin Control Tower/i })).not.toBeInTheDocument();
  });

  it('offers profile navigation inside the account menu', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const accountButton = screen.getByRole('button', { name: /Account menu/i });
    fireEvent.click(accountButton);
    const profileLink = screen.getByRole('link', { name: /Profile/i });
    expect(profileLink).toHaveAttribute('href', '/account/profile');
  });
});
