import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { useServicemanByokState } from './hooks/useServicemanByokState.js';
import { useSession } from '../../hooks/useSession.js';

const ServicemanByokContext = createContext(null);

export function ServicemanByokProvider({ servicemanId, children }) {
  const session = useSession();
  const targetServicemanId = servicemanId ?? session.userId ?? null;
  const value = useServicemanByokState(targetServicemanId);
  return <ServicemanByokContext.Provider value={value}>{children}</ServicemanByokContext.Provider>;
}

ServicemanByokProvider.propTypes = {
  servicemanId: PropTypes.string,
  children: PropTypes.node.isRequired
};

ServicemanByokProvider.defaultProps = {
  servicemanId: null
};

export function useServicemanByok() {
  const context = useContext(ServicemanByokContext);
  if (!context) {
    throw new Error('useServicemanByok must be used within a ServicemanByokProvider');
  }
  return context;
}

export default ServicemanByokProvider;
