import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { useStorefrontManagementState } from './hooks/useStorefrontManagementState.js';
import { useSession } from '../../hooks/useSession.js';

const StorefrontManagementContext = createContext(null);

export function StorefrontManagementProvider({ children, companyId }) {
  const session = useSession();
  const resolvedRole = session.role === 'admin' ? 'admin' : 'company';
  const resolvedPersona = session.role === 'admin' ? 'admin' : 'provider';
  const value = useStorefrontManagementState({ role: resolvedRole, persona: resolvedPersona, companyId: companyId ?? null });
  return <StorefrontManagementContext.Provider value={value}>{children}</StorefrontManagementContext.Provider>;
}

StorefrontManagementProvider.propTypes = {
  children: PropTypes.node.isRequired,
  companyId: PropTypes.string
};

StorefrontManagementProvider.defaultProps = {
  companyId: null
};

export function useStorefrontManagement() {
  const context = useContext(StorefrontManagementContext);
  if (!context) {
    throw new Error('useStorefrontManagement must be used within a StorefrontManagementProvider');
  }
  return context;
}
