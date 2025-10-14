import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header.jsx';

const allowedRoles = new Set();
const mockHasRole = vi.fn();

vi.mock('../../hooks/useSession.js', () => ({
  useSession: () => ({
    hasRole: mockHasRole
  })
}));

const translations = {
  'nav.home': 'Home',
  'nav.solutions': 'Solutions',
  'nav.tools': 'Tools',
  'nav.industries': 'Industries',
  'nav.platform': 'Platform',
  'nav.materials': 'Materials',
  'nav.blog': 'Blog',
  'nav.resources': 'Resources',
  'nav.company': 'Company',
  'nav.about': 'About',
  'nav.trustCentre': 'Trust centre',
  'nav.careers': 'Careers',
  'nav.dashboards': 'Dashboards',
  'nav.providerConsole': 'Provider console',
  'nav.providerStorefront': 'Storefront & listings',
  'nav.enterpriseAnalytics': 'Enterprise analytics',
  'nav.enterpriseAnalyticsDescription': 'Multi-site SLA monitoring, spend visibility, and upcoming visit planning.',
  'nav.businessFronts': 'Business fronts',
  'nav.businessFrontsDescription': 'Curated storefronts showcasing credentials, testimonials, and service packages.',
  'nav.geoMatching': 'Geo matching',
  'nav.geoMatchingDescription': 'Enterprise-grade geo-zonal matching workspace for operations administrators.',
  'nav.communications': 'Communications',
  'nav.login': 'Log in',
  'nav.getStarted': 'Get started'
};

vi.mock('../../hooks/useLocale.js', () => ({
  useLocale: () => ({
    t: (key) => translations[key] ?? key,
    locale: 'en-GB'
  })
}));

vi.mock('../../utils/telemetry.js', () => ({
  resolveSessionTelemetryContext: () => ({
    role: 'guest'
  })
}));

vi.mock('../PersonaSwitcher.jsx', () => ({
  default: () => <div data-testid="persona-switcher" />
}));

vi.mock('../LanguageSelector.jsx', () => ({
  default: () => <div data-testid="language-selector" />
}));

beforeEach(() => {
  allowedRoles.clear();
  mockHasRole.mockImplementation((roles) => {
    if (!roles || (Array.isArray(roles) && roles.length === 0)) {
      return true;
    }
    const list = Array.isArray(roles) ? roles : [roles];
    return list.some((role) => allowedRoles.has(role));
  });
});

describe('Header navigation access control', () => {
  it('hides enterprise analytics link when user role lacks access', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.queryByText('Enterprise analytics')).not.toBeInTheDocument();
  });

  it('shows enterprise analytics link when enterprise role is permitted', () => {
    allowedRoles.add('enterprise');

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const dashboardsButton = screen.getByRole('button', { name: /Dashboards/i });
    fireEvent.click(dashboardsButton);

    expect(screen.getByRole('link', { name: /Enterprise analytics/i })).toBeInTheDocument();
  });
});
