import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GeoMatching from '../GeoMatching.jsx';
import { LocaleProvider } from '../../providers/LocaleProvider.jsx';
import { matchGeoServices, previewCoverage } from '../../api/geoMatchingClient.js';
import { fetchCurrentUser } from '../../api/authClient.js';

vi.mock('../../api/geoMatchingClient.js', () => ({
  matchGeoServices: vi.fn(),
  previewCoverage: vi.fn()
}));

vi.mock('../../api/authClient.js', () => ({
  fetchCurrentUser: vi.fn()
}));

describe('GeoMatching page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCurrentUser.mockResolvedValue({ id: 'user-1', type: 'operations_admin' });
    matchGeoServices.mockResolvedValue({
      matches: [
        {
          zone: {
            id: 'zone-1',
            name: 'Central Ops',
            demandLevel: 'high',
            company: { contactName: 'Metro Power Ltd' }
          },
          reason: 'Coordinate falls within zone boundary',
          distanceKm: 1.2,
          score: 42.75,
          services: [
            {
              id: 'service-1',
              title: 'Mission support',
              description: '24/7 response team.',
              category: 'operations',
              price: 1250,
              currency: 'GBP',
              provider: { name: 'Alex Rivera' }
            }
          ]
        }
      ],
      fallback: null,
      totalServices: 1,
      auditedAt: '2025-01-01T00:00:00.000Z'
    });

    previewCoverage.mockResolvedValue({
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-0.2, 51.5],
            [-0.1, 51.5],
            [-0.1, 51.55],
            [-0.2, 51.55],
            [-0.2, 51.5]
          ]
        ]
      }
    });
  });

  it('submits a geo match request and renders results', async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider initialLocale="en-GB">
        <GeoMatching />
      </LocaleProvider>
    );

    await waitFor(() => expect(fetchCurrentUser).toHaveBeenCalled());

    const runButton = await screen.findByRole('button', { name: /run enterprise match/i });

    await user.click(runButton);

    await waitFor(() => expect(matchGeoServices).toHaveBeenCalled());

    expect(matchGeoServices).toHaveBeenCalledWith({
      latitude: 51.509,
      longitude: -0.118,
      radiusKm: 18,
      limit: 12,
      demandLevels: ['high', 'medium', 'low'],
      categories: []
    });

    await waitFor(() => expect(screen.getByText('Central Ops')).toBeInTheDocument());
    expect(screen.getByText('Mission support')).toBeInTheDocument();
    expect(screen.getByText(/audit trail/i)).toBeInTheDocument();
    expect(previewCoverage).toHaveBeenCalled();
  });
});
