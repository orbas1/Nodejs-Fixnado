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
  let fetchSpy;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

      await screen.findByRole('heading', { name: /load this dashboard/i });

      mockDashboards.admin = originalDashboard;
      const dashboardFixture = createDashboardFixture('admin');
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => dashboardFixture
      });

      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      await waitFor(() => expect(screen.getByRole('heading', { name: 'Profile Overview' })).toBeInTheDocument());
    } finally {
      mockDashboards.admin = originalDashboard;
    }
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
});
