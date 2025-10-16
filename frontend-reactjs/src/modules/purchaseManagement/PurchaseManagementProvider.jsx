import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { usePurchaseManagementState } from './hooks/usePurchaseManagementState.js';

const PurchaseManagementContext = createContext(null);

export function PurchaseManagementProvider({ children }) {
  const value = usePurchaseManagementState();
  return <PurchaseManagementContext.Provider value={value}>{children}</PurchaseManagementContext.Provider>;
}

PurchaseManagementProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function usePurchaseManagement() {
  const context = useContext(PurchaseManagementContext);
  if (!context) {
    throw new Error('usePurchaseManagement must be used within a PurchaseManagementProvider');
  }
  return context;
}
