import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { useProviderCalendarState } from './hooks/useProviderCalendarState.js';

const ProviderCalendarContext = createContext(null);

export function ProviderCalendarProvider({ initialSnapshot, children }) {
  const value = useProviderCalendarState(initialSnapshot);
  return <ProviderCalendarContext.Provider value={value}>{children}</ProviderCalendarContext.Provider>;
}

ProviderCalendarProvider.propTypes = {
  initialSnapshot: PropTypes.object,
  children: PropTypes.node.isRequired
};

ProviderCalendarProvider.defaultProps = {
  initialSnapshot: {}
};

export function useProviderCalendar() {
  const context = useContext(ProviderCalendarContext);
  if (!context) {
    throw new Error('useProviderCalendar must be used within a ProviderCalendarProvider');
  }
  return context;
}

export default ProviderCalendarProvider;
