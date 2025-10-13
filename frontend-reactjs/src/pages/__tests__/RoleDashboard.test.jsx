import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import RoleDashboard from '../RoleDashboard.jsx';

const dashboardFixture = {
  persona: 'admin',
  name: 'Admin Control Tower',
  window: {
    start: '2025-10-01T00:00:00.000Z',
    end: '2025-10-29T00:00:00.000Z',
    timezone: 'Europe/London',
    label: 'Last 28 days'
  },
  navigation: [
    {
      id: 'overview',
      label: 'Executive Overview',
      description: 'Bookings, spend, and SLA metrics.',
      type: 'overview',
      analytics: {
        metrics: [
          { label: 'Jobs Received', value: '12', change: '+3', trend: 'up' },
          { label: 'Completion Rate', value: '87%', change: '+4%', trend: 'up' }
        ],
        charts: [
          {
            id: 'jobs',
            type: 'bar',
            title: 'Jobs',
            description: 'Jobs per week',
            dataKey: 'count',
            data: [
              { name: 'Week 1', count: 3 },
              { name: 'Week 2', count: 4 }
            ]
          }
        ],
        upcoming: [
          { title: 'HVAC tune-up', when: 'Tomorrow', status: 'Scheduled' }
        ],
        insights: ['Two bookings require SLA attention.']
      }
    },
    {
      id: 'operations',
      label: 'Operations Pipeline',
      description: 'Stages of delivery.',
      type: 'board',
      data: {
        columns: [
          {
            title: 'Intake',
            items: [{ title: 'Electrical safety', owner: 'Ops', value: '£320' }]
          }
        ]
      }
    }
  ],
  exports: {
    csv: {
      href: '/api/analytics/dashboards/admin/export?timezone=Europe%2FLondon'
    }
  }
};

describe('RoleDashboard', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => dashboardFixture
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders dashboard data and export CTA', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboards/admin']}>
        <Routes>
          <Route path="/dashboards/:roleId" element={<RoleDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Executive Overview')).toBeInTheDocument());
    expect(screen.getByText('Jobs Received')).toBeInTheDocument();
    expect(screen.getByText('Download CSV')).toHaveAttribute(
      'href',
      '/api/analytics/dashboards/admin/export?timezone=Europe%2FLondon'
    );
  });

  it('shows an error state when the dashboard fails to load', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'persona_not_supported' })
    });

    render(
      <MemoryRouter initialEntries={['/dashboards/admin']}>
        <Routes>
          <Route path="/dashboards/:roleId" element={<RoleDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/couldn’t load this dashboard/i)).toBeInTheDocument());

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => dashboardFixture
    });

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    await waitFor(() => expect(screen.getByText('Executive Overview')).toBeInTheDocument());
  });
});
