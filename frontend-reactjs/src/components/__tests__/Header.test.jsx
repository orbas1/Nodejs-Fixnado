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
  it('renders login and register buttons for guests', () => {
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

    expect(screen.getAllByRole('link', { name: /Log in/i })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: /Get started/i })).toHaveLength(2);
    expect(screen.queryByRole('link', { name: /Feed/i })).not.toBeInTheDocument();
  });

  it('shows consolidated navigation when authenticated', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Feed/i })).toBeInTheDocument();
    const explorerButton = screen.getByRole('button', { name: /Explorer/i });
    fireEvent.click(explorerButton);
    expect(screen.getByRole('link', { name: /Search services/i })).toBeInTheDocument();
  });

  it('opens the account menu from the avatar control', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const accountButton = screen.getByLabelText(/Account menu/i);
    fireEvent.click(accountButton);
    expect(screen.getByRole('link', { name: /Go to dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/provider status/i)).toBeInTheDocument();
  });
});
