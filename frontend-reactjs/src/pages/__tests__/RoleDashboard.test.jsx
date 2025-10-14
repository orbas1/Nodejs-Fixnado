import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import RoleDashboard from '../RoleDashboard.jsx';
import { FeatureToggleContext } from '../../providers/FeatureToggleProvider.jsx';
import mockDashboards from '../../api/mockDashboards.js';

const createDashboardFixture = (roleId) => JSON.parse(JSON.stringify(mockDashboards[roleId]));

const enabledToggle = {
  state: 'enabled',
  rollout: 1,
  owner: 'data-ops',
  ticket: 'FIX-2098',
  lastModifiedAt: '2025-02-10T10:30:00Z'
};

function renderWithToggles(ui, { evaluation, toggle = enabledToggle, loading = false, refresh = vi.fn() } = {}) {
  const evaluate = evaluation
    ? evaluation
    : vi.fn((key) => {
        if (key === 'analytics-dashboards') {
          return { enabled: true, reason: 'enabled', toggle };
        }
        return { enabled: true, reason: 'enabled', toggle: null };
      });

  const contextValue = {
    loading,
    error: null,
    toggles: { 'analytics-dashboards': toggle },
    version: 'test',
    lastFetchedAt: Date.now(),
    refresh,
    evaluate
  };

  return render(<FeatureToggleContext.Provider value={contextValue}>{ui}</FeatureToggleContext.Provider>);
}

describe('RoleDashboard', () => {
  let resolvedOptionsMock;
  let fetchSpy;

  beforeEach(() => {
    resolvedOptionsMock = vi
      .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
      .mockReturnValue({ timeZone: 'Europe/London' });

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => dashboardFixture
    });
    window.localStorage.clear();
    window.localStorage.setItem('fixnado:personaAccess', JSON.stringify(['admin']));
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    resolvedOptionsMock?.mockRestore();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('renders provider dashboard with inventory insights and export CTA', async () => {
    const providerDashboard = createDashboardFixture('provider');
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => providerDashboard
    });

    renderWithToggles(
      <MemoryRouter initialEntries={["/dashboards/provider?timezone=Europe%2FLondon"]}>
        <Routes>
          <Route path="/dashboards/:roleId" element={<RoleDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Executive Overview' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Executive Overview' })).toBeInTheDocument());
    expect(screen.getByText('Jobs Received')).toBeInTheDocument();
    const exportLink = screen.getByText('Download CSV');
    expect(exportLink.getAttribute('href')).toMatch(/\/api\/analytics\/dashboards\/admin\/export/);
    const overviewHeadings = await screen.findAllByText('Executive Overview');
    expect(overviewHeadings.length).toBeGreaterThan(0);
    expect(screen.getByText('Jobs Received')).toBeInTheDocument();
    const downloadLink = screen.getByText('Download CSV');
    expect(downloadLink.getAttribute('href')).toMatch(/\/api\/analytics\/dashboards\/admin\/export\?timezone=/);
  });

  it('shows an error state when the dashboard fails to load', async () => {
    const originalDev = import.meta.env.DEV;
    import.meta.env.DEV = false;

    try {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'persona_not_supported' })
      });

      renderWithToggles(
        <MemoryRouter initialEntries={['/dashboards/admin']}>
          <Routes>
            <Route path="/dashboards/:roleId" element={<RoleDashboard />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByText(/couldn’t load this dashboard/i)).toBeInTheDocument();

      global.fetch.mockResolvedValueOnce({
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'persona_not_supported' })
    });
    const heading = await screen.findByRole('heading', {
      level: 1,
      name: 'Executive Overview'
    });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText('Jobs Received')).toBeInTheDocument();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London';
    expect(screen.getByRole('link', { name: /download csv/i })).toHaveAttribute(
      'href',
      `/api/analytics/dashboards/admin/export?timezone=${encodeURIComponent(timezone)}`
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Profile Overview' })).toBeInTheDocument());
    const metricLabel = await screen.findByText((_, element) => element?.textContent?.toLowerCase() === 'first response');
    expect(metricLabel).toBeInTheDocument();

    const toolsNavLabel = await screen.findByText('Tools & Materials');
    const toolsNavButton = toolsNavLabel.closest('button');
    expect(toolsNavButton).not.toBeNull();
    if (toolsNavButton) {
      fireEvent.click(toolsNavButton);
    }

    const availableUnitsLabel = await screen.findByText('Available units');
    const summaryCard = availableUnitsLabel.closest('div');
    expect(summaryCard).not.toBeNull();
    if (summaryCard) {
      expect(within(summaryCard).getByText('84')).toBeInTheDocument();
    }
    expect(screen.getByText('Thermal imaging kit')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Download CSV/i })).toHaveAttribute(
      'href',
      '/api/analytics/dashboards/provider/export?timezone=Europe%2FLondon'
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Executive Overview' })).toBeInTheDocument()
    );
    expect(screen.getByText('Jobs Received')).toBeInTheDocument();
    const resolvedTimezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Europe/London';
    expect(screen.getByText('Download CSV')).toHaveAttribute(
      'href',
      `/api/analytics/dashboards/admin/export?timezone=${encodeURIComponent(resolvedTimezone)}`
      '/api/analytics/dashboards/admin/export?timezone=UTC'
    );
  });

  it('shows an error state when the dashboard fails to load', async () => {
    const originalDashboard = mockDashboards.admin;
    delete mockDashboards.admin;

    try {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'persona_not_supported' })
      });
    renderWithToggles(
      <MemoryRouter initialEntries={['/dashboards/admin']}>
        <Routes>
          <Route path="/dashboards/:roleId" element={<RoleDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText(/couldn’t load this dashboard/i);
    expect(await screen.findByText(/couldn’t load this dashboard/i)).toBeInTheDocument();

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => dashboardFixture
    });
    await waitFor(() =>
      expect(screen.getByText(/couldn’t load this dashboard/i)).toBeInTheDocument()
    );
    const retryButton = await screen.findByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();

      renderWithToggles(
        <MemoryRouter initialEntries={['/dashboards/admin']}>
          <Routes>
            <Route path="/dashboards/:roleId" element={<RoleDashboard />} />
          </Routes>
        </MemoryRouter>
      );

      await screen.findByRole('heading', { name: /load this dashboard/i });

      mockDashboards.admin = originalDashboard;
      const dashboardFixture = createDashboardFixture('admin');
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => dashboardFixture
      });

      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      expect(await screen.findByRole('heading', { name: 'Executive Overview' })).toBeInTheDocument();
    } finally {
      import.meta.env.DEV = originalDev;
    }
      await waitFor(() => expect(screen.getByRole('heading', { name: 'Profile Overview' })).toBeInTheDocument());
    } finally {
      mockDashboards.admin = originalDashboard;
    }
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    await waitFor(() => expect(screen.getAllByText('Executive Overview').length).toBeGreaterThan(0));
    await screen.findAllByText('Executive Overview');
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Executive Overview'
        })
      ).toBeInTheDocument()
    );
      expect(screen.getByRole('heading', { name: 'Executive Overview' })).toBeInTheDocument()
    );
    fireEvent.click(retryButton);
    await screen.findByRole('heading', { name: 'Executive Overview' });
  });

  it('renders access gate when feature toggle is disabled', async () => {
    const disabledToggle = {
      ...enabledToggle,
      state: 'disabled'
    };

    renderWithToggles(
      <MemoryRouter initialEntries={['/dashboards/admin']}>
        <Routes>
          <Route path="/dashboards/:roleId" element={<RoleDashboard />} />
        </Routes>
      </MemoryRouter>,
      {
        toggle: disabledToggle,
        evaluation: vi.fn(() => ({ enabled: false, reason: 'disabled', toggle: disabledToggle }))
      }
    );

    await waitFor(() => expect(screen.getByText(/analytics dashboards are not yet enabled/i)).toBeInTheDocument());
    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.getByText(/request pilot access/i)).toBeInTheDocument();
  });

  it('renders an access denied experience when persona is not permitted', async () => {
    window.localStorage.setItem('fixnado:personaAccess', JSON.stringify(['user']));

    renderWithToggles(
      <MemoryRouter initialEntries={['/dashboards/admin']}>
        <Routes>
          <Route path="/dashboards/:roleId" element={<RoleDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/You need permission to open/i)).toBeInTheDocument());
    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /dashboard hub/i })).toBeInTheDocument();
  });
});
