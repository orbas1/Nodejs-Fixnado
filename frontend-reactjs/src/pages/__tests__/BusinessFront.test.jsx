import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BusinessFront from '../BusinessFront.jsx';
import { LocaleProvider } from '../../providers/LocaleProvider.jsx';
import { getBusinessFront } from '../../api/panelClient.js';
import { fetchExplorerResults, fetchTalent } from '../../api/explorerClient.js';

vi.mock('../../api/panelClient.js', () => {
  const getBusinessFrontMock = vi.fn();

  class PanelApiError extends Error {
    constructor(message, status, options = {}) {
      super(message);
      this.name = 'PanelApiError';
      this.status = status ?? 500;
      this.options = options;
    }
  }

  return { getBusinessFront: getBusinessFrontMock, PanelApiError };
});

vi.mock('../../api/explorerClient.js', () => {
  const fetchExplorerResultsMock = vi.fn();
  const fetchTalentMock = vi.fn();

  class ExplorerApiError extends Error {
    constructor(message, options = {}) {
      super(message);
      this.name = 'ExplorerApiError';
      this.options = options;
    }
  }

  return { fetchExplorerResults: fetchExplorerResultsMock, fetchTalent: fetchTalentMock, ExplorerApiError };
});

function renderBusinessFront(initialEntry = '/providers') {
  return render(
    <LocaleProvider initialLocale="en-GB">
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/providers" element={<BusinessFront />} />
          <Route path="/providers/:slug" element={<BusinessFront />} />
        </Routes>
      </MemoryRouter>
    </LocaleProvider>
  );
}

describe('BusinessFront access control', () => {
  beforeEach(() => {
    window.__FIXNADO_SESSION__ = undefined;
    getBusinessFront.mockReset();
    fetchExplorerResults.mockReset();
    fetchTalent.mockReset();
  });

  afterEach(() => {
    window.__FIXNADO_SESSION__ = undefined;
  });

  it('blocks guest access and does not trigger data fetch', () => {
    window.__FIXNADO_SESSION__ = { role: 'guest' };

    renderBusinessFront();

    expect(screen.getByText('Enterprise access required')).toBeInTheDocument();
    expect(getBusinessFront).not.toHaveBeenCalled();
    expect(fetchExplorerResults).not.toHaveBeenCalled();
  });

  it('renders provider directory results on base route', async () => {
    window.__FIXNADO_SESSION__ = { role: 'enterprise', userId: 'user-2' };

    fetchExplorerResults.mockResolvedValue({
      services: [
        {
          id: 'svc-1',
          title: 'Critical power response',
          category: 'Electrical',
          coverage: ['London'],
          tags: ['24/7'],
          displayUrl: 'https://fixnado.com/providers/metro-power-services',
          Company: {
            id: 'comp-1',
            contactName: 'Metro Power',
            profile: {
              storefrontSlug: 'metro-power-services',
              displayName: 'Metro Power Services'
            }
          }
        }
      ]
    });
    fetchTalent.mockResolvedValue([]);

    renderBusinessFront('/providers');

    await waitFor(() => expect(fetchExplorerResults).toHaveBeenCalled());
    expect(getBusinessFront).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Metro Power Services' })).toBeInTheDocument();

    const profileLink = screen.getByRole('link', { name: 'Profile' });
    expect(profileLink).toHaveAttribute('href', '/providers/metro-power-services');
  });

  it('searches for servicemen when the tab is active', async () => {
    window.__FIXNADO_SESSION__ = { role: 'enterprise', userId: 'user-3' };

    fetchExplorerResults.mockResolvedValue({ services: [] });
    fetchTalent.mockResolvedValue([
      {
        id: 'crew-1',
        name: 'Jordan Hale',
        role: 'Electrician',
        email: 'jordan@example.com',
        phone: '+441234567890',
        skills: ['Electrical', 'Generators'],
        company: { id: 'comp-9', name: 'Metro Power', slug: 'metro-power-services' }
      }
    ]);

    const user = userEvent.setup();

    renderBusinessFront('/providers');

    await waitFor(() => expect(fetchExplorerResults).toHaveBeenCalled());

    await user.click(screen.getByRole('radio', { name: 'Servicemen' }));

    const searchInput = screen.getByPlaceholderText('Search providers or servicemen');
    await user.clear(searchInput);
    await user.type(searchInput, 'Jo');

    await waitFor(() => expect(fetchTalent).toHaveBeenCalled());
    const [termArg] = fetchTalent.mock.calls.at(-1);
    expect(termArg).toBe('Jo');

    expect(await screen.findByRole('heading', { name: 'Jordan Hale' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute(
      'href',
      '/providers/metro-power-services'
    );
  });

  it('loads business front data when the enterprise role is active', async () => {
    window.__FIXNADO_SESSION__ = { role: 'enterprise', userId: 'user-1' };

    getBusinessFront.mockResolvedValue({
      data: {
        hero: {
          name: 'Metro Power Services',
          strapline: 'High-availability electrical response teams.',
          media: {}
        },
        stats: [],
        packages: [],
        testimonials: [],
        certifications: [],
        gallery: [],
        bannerStyles: [
          {
            id: 'impact',
            name: 'Impact gradient hero',
            description: 'Immersive gradient hero.',
            layout: 'full-bleed-gradient',
            recommendedUse: 'Flagship campaigns',
            preview: null,
            palette: {
              background: '#0B1D3A',
              accent: '#1F4ED8',
              highlight: '#00BFA6',
              text: '#FFFFFF'
            },
            supportsVideo: true,
            supportsCarousel: true,
            textTone: 'light',
            badges: ['Escrow-backed CTA']
          }
        ],
        support: {},
        serviceCatalogue: [],
        deals: [],
        previousJobs: [],
        reviews: [],
        materials: [],
        tools: [],
        servicemen: [],
        serviceZones: [],
        styleGuide: {
          palette: {
            primary: '#0B1D3A',
            accent: '#1F4ED8',
            highlight: '#00BFA6',
            neutral: '#F4F7FA',
            text: '#FFFFFF'
          }
        }
      },
      meta: {}
    });

    renderBusinessFront('/providers/metro-power');

    await waitFor(() => expect(getBusinessFront).toHaveBeenCalled());
    expect(screen.getByRole('heading', { name: 'Metro Power Services' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Banners' })).toBeInTheDocument());
    expect(screen.getByText('Impact gradient hero')).toBeInTheDocument();
  });
});

