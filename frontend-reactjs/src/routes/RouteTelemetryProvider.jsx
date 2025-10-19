import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigationType } from 'react-router-dom';
import { sendRouteTransitionTelemetry } from '../utils/navigationTelemetry.js';

const INITIAL_TIMESTAMP = typeof performance !== 'undefined' ? performance.now() : Date.now();

export default function RouteTelemetryProvider({ children }) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const transitionRef = useRef({
    pathname: location.pathname,
    search: location.search,
    startedAt: INITIAL_TIMESTAMP,
    isInitial: true
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const previous = transitionRef.current;
    const from = `${previous.pathname}${previous.search}`;
    const to = `${location.pathname}${location.search}`;

    const shouldEmit =
      previous.isInitial || previous.pathname !== location.pathname || previous.search !== location.search;

    if (shouldEmit) {
      sendRouteTransitionTelemetry({
        from,
        to,
        navigationType,
        durationMs: Math.max(0, Math.round(now - previous.startedAt)),
        isInitialLoad: previous.isInitial,
        visibilityState: typeof document !== 'undefined' ? document.visibilityState : 'unknown'
      });
    }

    transitionRef.current = {
      pathname: location.pathname,
      search: location.search,
      startedAt: now,
      isInitial: false
    };
  }, [location.key, location.pathname, location.search, navigationType]);

  return children;
}

RouteTelemetryProvider.propTypes = {
  children: PropTypes.node.isRequired
};
