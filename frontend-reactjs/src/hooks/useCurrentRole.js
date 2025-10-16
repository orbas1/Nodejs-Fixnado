import { useEffect, useState } from 'react';

const ROLE_STORAGE_KEY = 'fixnado:role';

export const ROLE_OPTIONS = [
  { value: 'guest', label: 'Guest (read-only marketing view)' },
  { value: 'user', label: 'Customer / job poster' },
  { value: 'serviceman', label: 'Crew operator' },
  { value: 'servicemen', label: 'Field service provider' },
  { value: 'provider', label: 'Provider leadership' },
  { value: 'enterprise', label: 'Enterprise operator' },
  { value: 'finance', label: 'Finance controller' },
  { value: 'admin', label: 'Platform administrator' },
  { value: 'company', label: 'Company operator (legacy)' }
];

function normaliseRole(role, fallback = 'guest') {
  if (typeof role !== 'string') {
    return fallback;
  }

  const normalised = role.trim().toLowerCase();
  const match = ROLE_OPTIONS.find((option) => option.value === normalised);
  return match ? match.value : fallback;
}

function readStoredRole(fallback = 'guest') {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const stored = window.localStorage?.getItem(ROLE_STORAGE_KEY);
    return stored ? normaliseRole(stored, fallback) : fallback;
  } catch (error) {
    console.warn('[useCurrentRole] unable to read role from storage', error);
    return fallback;
  }
}

export function setCurrentRole(role) {
  if (typeof window === 'undefined') return;
  const nextRole = normaliseRole(role);
  try {
    window.localStorage?.setItem(ROLE_STORAGE_KEY, nextRole);
    window.dispatchEvent(new CustomEvent('fixnado:role-change', { detail: { role: nextRole } }));
  } catch (error) {
    console.warn('[useCurrentRole] unable to persist role', error);
  }
}

export function useCurrentRole({ fallback = 'guest' } = {}) {
  const [role, setRole] = useState(() => readStoredRole(fallback));

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key && event.key !== ROLE_STORAGE_KEY) {
        return;
      }
      setRole(readStoredRole(fallback));
    };

    const handleRoleChange = () => {
      setRole(readStoredRole(fallback));
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('fixnado:role-change', handleRoleChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('fixnado:role-change', handleRoleChange);
    };
  }, [fallback]);

  return role;
}
