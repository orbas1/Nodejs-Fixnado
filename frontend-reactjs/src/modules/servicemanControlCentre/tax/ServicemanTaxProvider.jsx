import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import useServicemanTaxState from '../hooks/useServicemanTaxState.js';
import { useSession } from '../../../hooks/useSession.js';

const ServicemanTaxContext = createContext(null);

export function ServicemanTaxProvider({ servicemanId, initialSnapshot, children }) {
  const session = useSession();
  const targetServicemanId = servicemanId ?? session.userId ?? null;
  const snapshot = initialSnapshot ?? {};
  const mergedSnapshot = {
    ...snapshot,
    context: {
      ...(snapshot.context ?? {}),
      servicemanId: snapshot.context?.servicemanId ?? targetServicemanId ?? null
    }
  };
  const value = useServicemanTaxState(mergedSnapshot);
  return <ServicemanTaxContext.Provider value={value}>{children}</ServicemanTaxContext.Provider>;
}

ServicemanTaxProvider.propTypes = {
  servicemanId: PropTypes.string,
  initialSnapshot: PropTypes.object,
  children: PropTypes.node.isRequired
};

ServicemanTaxProvider.defaultProps = {
  servicemanId: null,
  initialSnapshot: null
};

export function useServicemanTax() {
  const context = useContext(ServicemanTaxContext);
  if (!context) {
    throw new Error('useServicemanTax must be used within a ServicemanTaxProvider');
  }
  return context;
}

export default ServicemanTaxProvider;
