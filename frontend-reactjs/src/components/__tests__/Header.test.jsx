import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header.jsx';

const mockUseSession = vi.fn();

vi.mock('../../hooks/useSession.js', () => ({
  useSession: () => mockUseSession()
}));

const translations = {
  'nav.login': 'Log in',
  'nav.getStarted': 'Get started',
  'nav.feed': 'Feed',
  'nav.explorer': 'Explorer',
  'nav.explorerSearchServices': 'Search services',
  'nav.explorerSearchServicesDescription': 'Find work',
  'nav.dashboards': 'Dashboards',
  'nav.solutions': 'Solutions',
  'nav.resources': 'Resources',
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
  'nav.toggleMenu': 'Toggle navigation menu'
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
  default: () => <div data-testid="language-selector" />
}));

beforeEach(() => {
  mockUseSession.mockReturnValue({
    isAuthenticated: true,
    role: 'provider',
    userId: 'alex.rivera',
    dashboards: ['provider']
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

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Log in/i })).toBeInTheDocument();
    expect(screen.getAllByTestId('language-selector')).toHaveLength(1);
    expect(screen.queryByRole('link', { name: /Get started/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Explorer/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Toggle navigation menu/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Feed/i })).not.toBeInTheDocument();
  });

  it('shows consolidated navigation when authenticated', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getAllByTestId('language-selector')).toHaveLength(1);
    const explorerButton = screen.getByRole('button', { name: /Explorer/i });
    fireEvent.click(explorerButton);
    expect(screen.getByRole('link', { name: /Search services/i })).toBeInTheDocument();
    const dashboardsButton = screen.getByRole('button', { name: /Dashboards/i });
    fireEvent.click(dashboardsButton);
    expect(screen.getByRole('link', { name: /Provider Operations Studio/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Admin Control Tower/i })).not.toBeInTheDocument();
  });

  it('links directly to the primary dashboard from the account control', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const accountLink = screen.getByRole('link', { name: /Go to dashboard/i });
    expect(accountLink).toHaveAttribute('href', '/dashboards/provider');
  });
});
