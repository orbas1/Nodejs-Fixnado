import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from '../ThemeProvider.jsx';
import { STORAGE_KEY } from '../../theme/config.js';

function ThemeHarness() {
  const { preferences, setTheme, setMarketingVariant } = useTheme();

  return (
    <div>
      <span data-testid="theme-value">{preferences.theme}</span>
      <span data-testid="variant-value">{preferences.marketingVariant}</span>
      <button type="button" onClick={() => setTheme('dark')}>
        Enable dark theme
      </button>
      <button type="button" onClick={() => setMarketingVariant('seasonal')}>
        Run seasonal banner
      </button>
    </div>
  );
}

describe('ThemeProvider telemetry + persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = '';
    document.documentElement.dataset.contrast = '';
    document.documentElement.dataset.density = '';
    window.dataLayer = [];
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    Object.defineProperty(window.navigator, 'sendBeacon', {
      value: undefined,
      configurable: true,
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists theme changes, updates DOM attributes, and emits telemetry beacons', async () => {
    const listener = vi.fn();
    window.addEventListener('fixnado:theme-change', listener);

    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('standard');

    await userEvent.click(screen.getByText('Enable dark theme'));

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    const storedPreferences = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(storedPreferences.theme).toBe('dark');

    expect(listener).toHaveBeenCalled();
    const lastEvent = listener.mock.calls.at(-1)?.[0];
    expect(lastEvent?.detail?.theme).toBe('dark');
    expect(window.dataLayer.some((event) => event.event === 'theme_change')).toBe(true);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/telemetry/ui-preferences',
        expect.objectContaining({ method: 'POST' })
      );
    });

    window.removeEventListener('fixnado:theme-change', listener);
  });

  it('hydrates from stored preferences and merges marketing variant updates without clobbering density', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ theme: 'dark', density: 'compact', marketingVariant: 'hero' })
    );

    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');

    await userEvent.click(screen.getByText('Run seasonal banner'));

    const storedPreferences = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(storedPreferences.marketingVariant).toBe('seasonal');
    expect(storedPreferences.density).toBe('compact');
    expect(screen.getByTestId('variant-value')).toHaveTextContent('seasonal');
  });
});
