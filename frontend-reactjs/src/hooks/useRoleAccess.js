import { useEffect, useMemo, useState } from 'react';
import { resolveSessionTelemetryContext } from '../utils/telemetry.js';

const normaliseRole = (value) => {
  if (typeof value !== 'string') return 'guest';
  return value.trim().toLowerCase();
};

const readRoleFromWindow = () => {
  try {
    if (typeof window === 'undefined') {
      return 'guest';
    }

    if (typeof window.__FIXNADO_SESSION__ === 'object' && window.__FIXNADO_SESSION__ !== null) {
      const { role } = window.__FIXNADO_SESSION__;
      if (typeof role === 'string' && role.trim() !== '') {
        return normaliseRole(role);
      }
    }

    if (typeof window.sessionStorage !== 'undefined') {
      const stored = window.sessionStorage.getItem('fx.session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed?.role === 'string' && parsed.role.trim() !== '') {
          return normaliseRole(parsed.role);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to read role from session context', error);
  }

  const context = resolveSessionTelemetryContext();
  return normaliseRole(context.role);
};

export function useRoleAccess(requiredRoles, { allowFallbackRoles = [] } = {}) {
  const [role, setRole] = useState(() => readRoleFromWindow());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handler = (event) => {
      if (event?.detail?.role) {
        setRole(normaliseRole(event.detail.role));
      }
    };

    window.addEventListener('fixnado:session-change', handler);
    window.addEventListener('fixnado:theme-change', handler);

    return () => {
      window.removeEventListener('fixnado:session-change', handler);
      window.removeEventListener('fixnado:theme-change', handler);
    };
  }, []);

  return useMemo(() => {
    const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const allowList = new Set(required.map(normaliseRole));
    allowFallbackRoles.forEach((value) => allowList.add(normaliseRole(value)));

    const hasAccess = allowList.has(role);

    return { role, hasAccess };
  }, [role, requiredRoles, allowFallbackRoles]);
}

export default useRoleAccess;
