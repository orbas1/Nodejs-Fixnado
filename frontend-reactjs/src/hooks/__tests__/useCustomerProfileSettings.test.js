import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCustomerProfileSettings } from '../useCustomerProfileSettings.js';

vi.mock('../../api/userSettingsClient.js', () => ({
  fetchCustomerSettings: vi.fn(),
  updateCustomerSettings: vi.fn()
}));

const { fetchCustomerSettings, updateCustomerSettings } = await import('../../api/userSettingsClient.js');

const basePayload = {
  profile: { firstName: 'Jordan', lastName: 'Miles', email: 'jordan@example.com' },
  notifications: {
    dispatch: { email: true, sms: false },
    support: { email: true, sms: false },
    weeklySummary: { email: true },
    concierge: { email: true, sms: false },
    quietHours: { enabled: false, start: null, end: null, timezone: 'Europe/London' },
    escalationContacts: []
  },
  billing: {
    preferredCurrency: 'GBP',
    defaultPaymentMethod: 'Visa 4242',
    paymentNotes: null,
    invoiceRecipients: []
  },
  security: {
    twoFactor: {
      app: false,
      email: false,
      enabled: false,
      methods: [],
      lastUpdated: null
    }
  }
};

describe('useCustomerProfileSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCustomerSettings.mockResolvedValue(structuredClone(basePayload));
    updateCustomerSettings.mockResolvedValue(structuredClone(basePayload));
  });

  it('loads settings on mount and exposes helpers', async () => {
    const { result } = renderHook(() => useCustomerProfileSettings());

    expect(result.current.loading).toBe(true);
    expect(fetchCustomerSettings).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(basePayload);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refresh).toBe('function');
  });

  it('saves profile updates and refreshes state', async () => {
    const updatedPayload = structuredClone(basePayload);
    updatedPayload.profile.firstName = 'Avery';
    updateCustomerSettings.mockResolvedValueOnce(updatedPayload);

    const { result } = renderHook(() => useCustomerProfileSettings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.saveProfile({ firstName: 'Avery' });
    });

    expect(updateCustomerSettings).toHaveBeenCalledWith({ profile: { firstName: 'Avery' } });
    expect(result.current.data).toEqual(updatedPayload);
    expect(result.current.saving.profile).toBe(false);
  });

  it('captures errors when loading fails', async () => {
    fetchCustomerSettings.mockRejectedValueOnce(new Error('network down'));

    const { result } = renderHook(() => useCustomerProfileSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toContain('network down');
  });
});
