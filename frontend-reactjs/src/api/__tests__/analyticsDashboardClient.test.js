import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...import.meta.env };

const restoreEnv = () => {
  const keys = new Set([...Object.keys(import.meta.env), ...Object.keys(originalEnv)]);
  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(originalEnv, key)) {
      import.meta.env[key] = originalEnv[key];
    } else {
      delete import.meta.env[key];
    }
  });
};

describe('analyticsDashboardClient', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restoreEnv();
  });

  it('surfaces fetch errors when dashboard fallbacks are disabled', async () => {
    import.meta.env.VITE_DASHBOARD_FALLBACK_MODE = 'never';
    import.meta.env.DEV = false;
    import.meta.env.MODE = 'test';

    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('network error')));

    const { fetchDashboard } = await import('../analyticsDashboardClient.js');

    await expect(fetchDashboard('admin')).rejects.toThrow('network error');
  });

  it('uses the mock dashboard when fallback mode is always', async () => {
    import.meta.env.VITE_DASHBOARD_FALLBACK_MODE = 'always';
    import.meta.env.DEV = true;
    import.meta.env.MODE = 'development';

    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('downstream failure')));

    const { fetchDashboard } = await import('../analyticsDashboardClient.js');

    const dashboard = await fetchDashboard('admin');

    expect(dashboard?.persona).toBe('admin');
    expect(Array.isArray(dashboard?.navigation)).toBe(true);
    expect(dashboard.navigation.length).toBeGreaterThan(0);
  });

  it('only enables fallbacks in development mode when configured', async () => {
    import.meta.env.VITE_DASHBOARD_FALLBACK_MODE = 'dev-only';
    import.meta.env.DEV = true;
    import.meta.env.MODE = 'development';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValueOnce(Object.assign(new Error('api unavailable'), { status: 503 }))
    );

    const { fetchDashboard } = await import('../analyticsDashboardClient.js');

    const dashboard = await fetchDashboard('provider');

    expect(dashboard?.persona).toBe('provider');
  });
});
