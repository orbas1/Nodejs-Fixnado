import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchServicemanProfileSettings,
  updateServicemanProfileSettings
} from '../api/servicemanProfileClient.js';

const initialSavingState = Object.freeze({
  profile: false,
  contact: false,
  work: false,
  skills: false,
  availability: false,
  equipment: false,
  documents: false
});

export function useServicemanProfileSettings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(initialSavingState);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchServicemanProfileSettings();
      setData(payload ?? null);
    } catch (caught) {
      setError(caught?.message || 'Failed to load serviceman profile settings.');
      throw caught;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const runUpdate = useCallback(
    async (section, payload) => {
      if (!payload || typeof payload !== 'object') {
        return null;
      }
      setSaving((prev) => ({ ...prev, [section]: true }));
      setError(null);
      try {
        const updated = await updateServicemanProfileSettings(payload);
        setData(updated ?? null);
        return updated;
      } catch (caught) {
        const message = caught?.message || 'Failed to update serviceman profile settings.';
        setError(message);
        throw caught;
      } finally {
        setSaving((prev) => ({ ...prev, [section]: false }));
      }
    },
    []
  );

  const saveProfile = useCallback((updates) => runUpdate('profile', { profile: updates }), [runUpdate]);
  const saveContact = useCallback((updates) => runUpdate('contact', { contact: updates }), [runUpdate]);
  const saveWork = useCallback((updates) => runUpdate('work', { work: updates }), [runUpdate]);
  const saveSkills = useCallback((updates) => runUpdate('skills', { skills: updates }), [runUpdate]);
  const saveAvailability = useCallback(
    (updates) => runUpdate('availability', { availability: updates }),
    [runUpdate]
  );
  const saveEquipment = useCallback((updates) => runUpdate('equipment', { equipment: updates }), [runUpdate]);
  const saveDocuments = useCallback((updates) => runUpdate('documents', { documents: updates }), [runUpdate]);

  const hasData = useMemo(() => data != null, [data]);

  return {
    data,
    loading,
    error,
    saving,
    hasData,
    refresh,
    saveProfile,
    saveContact,
    saveWork,
    saveSkills,
    saveAvailability,
    saveEquipment,
    saveDocuments
  };
}

export default useServicemanProfileSettings;
