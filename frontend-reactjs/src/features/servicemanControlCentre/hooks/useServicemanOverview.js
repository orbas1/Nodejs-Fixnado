import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchServicemanOverview,
  updateServicemanProfile,
  createShiftRule,
  updateShiftRule,
  deleteShiftRule,
  createCertification,
  updateCertification,
  deleteCertification,
  createEquipment,
  updateEquipment,
  deleteEquipment
} from '../api.js';
import { mockOverview } from '../mockData.js';

const EQUIPMENT_STATUS_ORDER = ['ready', 'maintenance', 'checked_out', 'retired'];
const isDevEnvironment = Boolean(import.meta.env?.DEV);

function sortAvailability(entries = []) {
  return [...entries].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) {
      return a.dayOfWeek - b.dayOfWeek;
    }
    const startA = a.startTime ?? '';
    const startB = b.startTime ?? '';
    return startA.localeCompare(startB);
  });
}

function sortCertifications(entries = []) {
  return [...entries].sort((a, b) => {
    if (a.expiresOn && b.expiresOn) {
      return a.expiresOn.localeCompare(b.expiresOn);
    }
    if (a.expiresOn) return -1;
    if (b.expiresOn) return 1;
    return (a.title ?? '').localeCompare(b.title ?? '');
  });
}

function sortEquipment(entries = []) {
  return [...entries].sort((a, b) => {
    const statusIndexA = EQUIPMENT_STATUS_ORDER.indexOf(a.status);
    const statusIndexB = EQUIPMENT_STATUS_ORDER.indexOf(b.status);
    if (statusIndexA !== statusIndexB) {
      const safeA = statusIndexA === -1 ? EQUIPMENT_STATUS_ORDER.length : statusIndexA;
      const safeB = statusIndexB === -1 ? EQUIPMENT_STATUS_ORDER.length : statusIndexB;
      return safeA - safeB;
    }
    return (a.name ?? '').localeCompare(b.name ?? '');
  });
}

export function useServicemanOverview() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchServicemanOverview();
      setOverview(data);
      setUsingMock(false);
    } catch (err) {
      if (isDevEnvironment) {
        console.warn('Falling back to mock serviceman overview', err);
        setOverview(mockOverview);
        setUsingMock(true);
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleError = useCallback((err) => {
    setError(err);
    throw err;
  }, []);

  const updateProfile = useCallback(
    async (payload) => {
      try {
        if (usingMock) {
          setOverview((current) =>
            current
              ? {
                  ...current,
                  profile: { ...current.profile, ...payload }
                }
              : current
          );
          return { ...mockOverview.profile, ...payload };
        }
        const response = await updateServicemanProfile({ profile: payload });
        setOverview((current) => (current ? { ...current, profile: response.profile } : current));
        return response.profile;
      } catch (err) {
        handleError(err);
        return null;
      }
    },
    [handleError, usingMock]
  );

  const createAvailability = useCallback(
    async (payload) => {
      try {
        if (usingMock) {
          const generated = {
            id: `mock-shift-${Date.now()}`,
            profileId: overview?.profile?.id ?? 'mock-profile',
            ...payload
          };
          setOverview((current) =>
            current
              ? {
                  ...current,
                  availability: sortAvailability([...(current.availability ?? []), generated])
                }
              : current
          );
          return generated;
        }
        const response = await createShiftRule(payload);
        const rule = response.availability;
        setOverview((current) =>
          current
            ? {
                ...current,
                availability: sortAvailability([...(current.availability ?? []), rule])
              }
            : current
        );
        return rule;
      } catch (err) {
        handleError(err);
        return null;
      }
    },
    [handleError, overview?.profile?.id, usingMock]
  );

  const updateAvailability = useCallback(
    async (id, payload) => {
      try {
        if (usingMock) {
          setOverview((current) =>
            current
              ? {
                  ...current,
                  availability: sortAvailability(
                    (current.availability ?? []).map((entry) => (entry.id === id ? { ...entry, ...payload } : entry))
                  )
                }
              : current
          );
          return { ...(overview?.availability ?? []).find((entry) => entry.id === id), ...payload };
        }
        const response = await updateShiftRule(id, payload);
        const rule = response.availability;
        setOverview((current) =>
          current
            ? {
                ...current,
                availability: sortAvailability(
                  (current.availability ?? []).map((entry) => (entry.id === rule.id ? rule : entry))
                )
              }
            : current
        );
        return rule;
      } catch (err) {
        handleError(err);
        return null;
      }
    },
    [handleError, overview?.availability, usingMock]
  );

  const deleteAvailability = useCallback(
    async (id) => {
      try {
        if (usingMock) {
          setOverview((current) =>
            current
              ? {
                  ...current,
                  availability: (current.availability ?? []).filter((entry) => entry.id !== id)
                }
              : current
          );
          return;
        }
        await deleteShiftRule(id);
        setOverview((current) =>
          current
            ? {
                ...current,
                availability: (current.availability ?? []).filter((entry) => entry.id !== id)
              }
            : current
        );
      } catch (err) {
        handleError(err);
      }
    },
    [handleError, usingMock]
  );

  const createCertificationMutation = useCallback(
    async (payload) => {
      try {
        if (usingMock) {
          const generated = {
            id: `mock-cert-${Date.now()}`,
            profileId: overview?.profile?.id ?? 'mock-profile',
            ...payload
          };
          setOverview((current) =>
            current
              ? {
                  ...current,
                  certifications: sortCertifications([generated, ...(current.certifications ?? [])])
                }
              : current
          );
          return generated;
        }
        const response = await createCertification(payload);
        const certification = response.certification;
        setOverview((current) =>
          current
            ? {
                ...current,
                certifications: sortCertifications([certification, ...(current.certifications ?? [])])
              }
            : current
        );
        return certification;
      } catch (err) {
        handleError(err);
        return null;
      }
    },
    [handleError, overview?.profile?.id, usingMock]
  );

  const updateCertificationMutation = useCallback(
    async (id, payload) => {
      try {
        if (usingMock) {
          setOverview((current) =>
            current
              ? {
                  ...current,
                  certifications: sortCertifications(
                    (current.certifications ?? []).map((entry) => (entry.id === id ? { ...entry, ...payload } : entry))
                  )
                }
              : current
          );
          return { ...(overview?.certifications ?? []).find((entry) => entry.id === id), ...payload };
        }
        const response = await updateCertification(id, payload);
        const certification = response.certification;
        setOverview((current) =>
          current
            ? {
                ...current,
                certifications: sortCertifications(
                  (current.certifications ?? []).map((entry) => (entry.id === certification.id ? certification : entry))
                )
              }
            : current
        );
        return certification;
      } catch (err) {
        handleError(err);
        return null;
      }
    },
    [handleError, overview?.certifications, usingMock]
  );

  const deleteCertificationMutation = useCallback(
    async (id) => {
      try {
        if (usingMock) {
          setOverview((current) =>
            current
              ? {
                  ...current,
                  certifications: (current.certifications ?? []).filter((entry) => entry.id !== id)
                }
              : current
          );
          return;
        }
        await deleteCertification(id);
        setOverview((current) =>
          current
            ? {
                ...current,
                certifications: (current.certifications ?? []).filter((entry) => entry.id !== id)
              }
            : current
        );
      } catch (err) {
        handleError(err);
      }
    },
    [handleError, usingMock]
  );

  const createEquipmentMutation = useCallback(
    async (payload) => {
      try {
        if (usingMock) {
          const generated = {
            id: `mock-equipment-${Date.now()}`,
            profileId: overview?.profile?.id ?? 'mock-profile',
            ...payload
          };
          setOverview((current) =>
            current
              ? {
                  ...current,
                  equipment: sortEquipment([generated, ...(current.equipment ?? [])])
                }
              : current
          );
          return generated;
        }
        const response = await createEquipment(payload);
        const item = response.equipment;
        setOverview((current) =>
          current
            ? {
                ...current,
                equipment: sortEquipment([item, ...(current.equipment ?? [])])
              }
            : current
        );
        return item;
      } catch (err) {
        handleError(err);
        return null;
      }
    },
    [handleError, overview?.profile?.id, usingMock]
  );

  const updateEquipmentMutation = useCallback(
    async (id, payload) => {
      try {
        if (usingMock) {
          setOverview((current) =>
            current
              ? {
                  ...current,
                  equipment: sortEquipment(
                    (current.equipment ?? []).map((entry) => (entry.id === id ? { ...entry, ...payload } : entry))
                  )
                }
              : current
          );
          return { ...(overview?.equipment ?? []).find((entry) => entry.id === id), ...payload };
        }
        const response = await updateEquipment(id, payload);
        const item = response.equipment;
        setOverview((current) =>
          current
            ? {
                ...current,
                equipment: sortEquipment((current.equipment ?? []).map((entry) => (entry.id === item.id ? item : entry)))
              }
            : current
        );
        return item;
      } catch (err) {
        handleError(err);
        return null;
      }
    },
    [handleError, overview?.equipment, usingMock]
  );

  const deleteEquipmentMutation = useCallback(
    async (id) => {
      try {
        if (usingMock) {
          setOverview((current) =>
            current
              ? {
                  ...current,
                  equipment: (current.equipment ?? []).filter((entry) => entry.id !== id)
                }
              : current
          );
          return;
        }
        await deleteEquipment(id);
        setOverview((current) =>
          current
            ? {
                ...current,
                equipment: (current.equipment ?? []).filter((entry) => entry.id !== id)
              }
            : current
        );
      } catch (err) {
        handleError(err);
      }
    },
    [handleError, usingMock]
  );

  const state = useMemo(
    () => ({
      overview,
      loading,
      error,
      usingMock,
      refresh: load,
      updateProfile,
      createAvailability,
      updateAvailability,
      deleteAvailability,
      createCertification: createCertificationMutation,
      updateCertification: updateCertificationMutation,
      deleteCertification: deleteCertificationMutation,
      createEquipment: createEquipmentMutation,
      updateEquipment: updateEquipmentMutation,
      deleteEquipment: deleteEquipmentMutation
    }),
    [
      overview,
      loading,
      error,
      usingMock,
      load,
      updateProfile,
      createAvailability,
      updateAvailability,
      deleteAvailability,
      createCertificationMutation,
      updateCertificationMutation,
      deleteCertificationMutation,
      createEquipmentMutation,
      updateEquipmentMutation,
      deleteEquipmentMutation
    ]
  );

  return state;
}

export default useServicemanOverview;
