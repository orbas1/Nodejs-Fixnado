import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCustomerSettings, updateCustomerSettings } from '../api/userSettingsClient.js';

const initialSavingState = Object.freeze({
  profile: false,
  notifications: false,
  billing: false,
  security: false
});

export function useCustomerProfileSettings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(initialSavingState);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchCustomerSettings();
      setData(payload ?? null);
    } catch (caught) {
      setError(caught?.message || 'Failed to load profile settings.');
      throw caught;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const runUpdate = useCallback(async (section, payload) => {
    if (!payload || typeof payload !== 'object') {
      return null;
    }
    setSaving((prev) => ({ ...prev, [section]: true }));
    setError(null);
    try {
      const updated = await updateCustomerSettings(payload);
      setData(updated ?? null);
      return updated;
    } catch (caught) {
      setError(caught?.message || 'Failed to update profile settings.');
      throw caught;
    } finally {
      setSaving((prev) => ({ ...prev, [section]: false }));
    }
  }, []);

  const saveProfile = useCallback((updates) => runUpdate('profile', { profile: updates }), [runUpdate]);
  const saveNotifications = useCallback(
    (updates) => runUpdate('notifications', { notifications: updates }),
    [runUpdate]
  );
  const saveBilling = useCallback((updates) => runUpdate('billing', { billing: updates }), [runUpdate]);
  const saveSecurity = useCallback((updates) => runUpdate('security', { security: updates }), [runUpdate]);

  const hasData = useMemo(() => data != null, [data]);

  return {
    data,
    loading,
    error,
    saving,
    hasData,
    refresh,
    saveProfile,
    saveNotifications,
    saveBilling,
    saveSecurity
  };
}

export default useCustomerProfileSettings;
