import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { useServicemanFinanceState } from './hooks/useServicemanFinanceState.js';

const ServicemanFinanceContext = createContext(null);

export function ServicemanFinanceProvider({ initialData, children }) {
  const value = useServicemanFinanceState(initialData ?? {});
  return <ServicemanFinanceContext.Provider value={value}>{children}</ServicemanFinanceContext.Provider>;
}

ServicemanFinanceProvider.propTypes = {
  initialData: PropTypes.object,
  children: PropTypes.node.isRequired
};

ServicemanFinanceProvider.defaultProps = {
  initialData: {}
};

export function useServicemanFinance() {
  const context = useContext(ServicemanFinanceContext);
  if (!context) {
    throw new Error('useServicemanFinance must be used within a ServicemanFinanceProvider');
  }
  return context;
}

export default ServicemanFinanceProvider;
