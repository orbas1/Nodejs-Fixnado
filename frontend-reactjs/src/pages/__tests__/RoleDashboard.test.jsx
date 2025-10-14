import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RoleDashboard from '../RoleDashboard.jsx';

vi.mock('../../components/dashboard/DashboardLayout.jsx', () => ({
  default: ({ roleMeta }) => <div data-testid="dashboard-layout">{roleMeta?.id}</div>
}));

vi.mock('../../components/dashboard/DashboardAccessGate.jsx', () => ({
  default: () => <div data-testid="access-gate" />
}));

vi.mock('../../components/dashboard/DashboardUnauthorized.jsx', () => ({
  default: ({ onRetry }) => (
    <button type="button" data-testid="unauthorised" onClick={onRetry}>
      Retry
    </button>
  )
}));

let hasPersonaAccess = true;

const refreshPersonaAccess = vi.fn();

vi.mock('../../hooks/usePersonaAccess.js', () => ({
  usePersonaAccess: () => ({
    hasAccess: vi.fn(() => hasPersonaAccess),
    refresh: refreshPersonaAccess
  })
}));

const fetchDashboardMock = vi.fn();
const buildExportUrlMock = vi.fn(() => '/export.csv');
const fetchDashboardBlogPostsMock = vi.fn(async () => []);

vi.mock('../../api/analyticsDashboardClient.js', () => ({
  fetchDashboard: (...args) => fetchDashboardMock(...args),
  buildExportUrl: (...args) => buildExportUrlMock(...args)
}));

vi.mock('../../api/blogClient.js', () => ({
  fetchDashboardBlogPosts: (...args) => fetchDashboardBlogPostsMock(...args)
}));

const featureToggleMock = vi.fn();

vi.mock('../../providers/FeatureToggleProvider.jsx', async () => {
  const actual = await vi.importActual('../../providers/FeatureToggleProvider.jsx');
  return {
    ...actual,
    useFeatureToggle: (...args) => featureToggleMock(...args)
  };
});

const renderDashboard = (path = '/dashboards/admin') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/dashboards/:roleId" element={<RoleDashboard />} />
      </Routes>
    </MemoryRouter>
  );

describe('RoleDashboard', () => {
  beforeEach(() => {
    hasPersonaAccess = true;
    fetchDashboardMock.mockResolvedValue({ meta: {}, data: { sections: [] } });
    fetchDashboardBlogPostsMock.mockResolvedValue([]);
    featureToggleMock.mockReturnValue({
      enabled: true,
      loading: false,
      reason: null,
      toggle: { state: 'enabled' },
      cohort: 'test',
      refresh: vi.fn()
    });
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({ timeZone: 'Europe/London' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fetchDashboardMock.mockReset();
    buildExportUrlMock.mockClear();
    fetchDashboardBlogPostsMock.mockReset();
    featureToggleMock.mockReset();
    refreshPersonaAccess.mockReset();
  });

  it('renders the dashboard layout when access is granted', async () => {
    renderDashboard();

    await waitFor(() => expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument());
    expect(fetchDashboardMock).toHaveBeenCalledWith('admin', expect.any(Object), expect.objectContaining({ signal: expect.any(Object) }));
    expect(buildExportUrlMock).toHaveBeenCalledWith('admin', expect.any(Object));
  });

  it('shows the access gate when the toggle is disabled', async () => {
    featureToggleMock.mockReturnValueOnce({
      enabled: false,
      loading: false,
      reason: 'disabled',
      toggle: { state: 'disabled' },
      cohort: 'test',
      refresh: vi.fn()
    });

    renderDashboard();

    await waitFor(() => expect(screen.getByTestId('access-gate')).toBeInTheDocument());
    expect(fetchDashboardMock).not.toHaveBeenCalled();
  });

  it('invokes persona refresh when access is denied', async () => {
    hasPersonaAccess = false;

    renderDashboard();

    await waitFor(() => expect(refreshPersonaAccess).toHaveBeenCalled());
  });
});
