import { useEffect, useRef, useState } from 'react';

const EVENT_NAME = 'fixnado:theme-change';
const CLEAR_DELAY = 5000;

function formatPreferenceMessage(detail) {
  if (!detail) {
    return '';
  }

  const statements = [];

  if (detail.theme) {
    const themeCopy = {
      standard: 'Standard theme activated',
      dark: 'Dark mode enabled',
      emo: 'Emo spotlight theme enabled'
    }[detail.theme] || `Theme switched to ${detail.theme}`;
    statements.push(themeCopy);
  }

  if (detail.density) {
    statements.push(
      detail.density === 'compact'
        ? 'Compact density applied with 44 pixel targets maintained'
        : 'Comfortable density restored'
    );
  }

  if (detail.contrast) {
    statements.push(
      detail.contrast === 'high'
        ? 'High contrast focus halos enabled'
        : 'Standard contrast tokens active'
    );
  }

  if (detail.marketingVariant) {
    statements.push(`Marketing preview switched to ${detail.marketingVariant.replace(/_/g, ' ')}`);
  }

  return statements.join('. ');
}

export default function PreferenceChangeAnnouncer() {
  const [message, setMessage] = useState('');
  const clearHandleRef = useRef(null);
  const lastMessageRef = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handler = (event) => {
      const detail = event.detail || {};
      const formatted = formatPreferenceMessage(detail);

      if (!formatted || formatted === lastMessageRef.current) {
        return;
      }

      lastMessageRef.current = formatted;
      setMessage(formatted);
    };

    window.addEventListener(EVENT_NAME, handler);

    return () => {
      window.removeEventListener(EVENT_NAME, handler);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (clearHandleRef.current) {
      window.clearTimeout(clearHandleRef.current);
      clearHandleRef.current = null;
    }

    if (message) {
      clearHandleRef.current = window.setTimeout(() => {
        setMessage('');
      }, CLEAR_DELAY);
    }

    return () => {
      if (clearHandleRef.current) {
        window.clearTimeout(clearHandleRef.current);
        clearHandleRef.current = null;
      }
    };
  }, [message]);

  return (
    <div className="visually-hidden" role="status" aria-live="polite" data-qa="theme-preference-announcer">
      {message}
    </div>
  );
}
