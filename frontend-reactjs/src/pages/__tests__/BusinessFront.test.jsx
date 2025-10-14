import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import BusinessFront from '../BusinessFront.jsx';
import { LocaleProvider } from '../../providers/LocaleProvider.jsx';
import { getBusinessFront } from '../../api/panelClient.js';

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
  });

  afterEach(() => {
    window.__FIXNADO_SESSION__ = undefined;
  });

  it('blocks guest access and does not trigger data fetch', () => {
    window.__FIXNADO_SESSION__ = { role: 'guest' };

    renderBusinessFront();

    expect(screen.getByText('Request enterprise access')).toBeInTheDocument();
    expect(getBusinessFront).not.toHaveBeenCalled();
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
        support: {},
        serviceCatalogue: [],
        deals: [],
        previousJobs: [],
        reviews: [],
        materials: [],
        tools: [],
        servicemen: [],
        serviceZones: []
      },
      meta: {}
    });

    renderBusinessFront('/providers/metro-power');

    await waitFor(() => expect(getBusinessFront).toHaveBeenCalled());
    expect(screen.getByText('Metro Power Services')).toBeInTheDocument();
    expect(screen.getByText(/Live service catalogue/i)).toBeInTheDocument();
  });
});

