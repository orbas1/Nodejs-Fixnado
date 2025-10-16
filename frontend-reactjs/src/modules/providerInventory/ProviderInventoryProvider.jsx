import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { useProviderInventoryState } from './hooks/useProviderInventoryState.js';

const ProviderInventoryContext = createContext(null);

export function ProviderInventoryProvider({ children }) {
  const value = useProviderInventoryState();
  return <ProviderInventoryContext.Provider value={value}>{children}</ProviderInventoryContext.Provider>;
}

ProviderInventoryProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useProviderInventory() {
  const context = useContext(ProviderInventoryContext);
  if (!context) {
    throw new Error('useProviderInventory must be used within a ProviderInventoryProvider');
  }
  return context;
}

export default ProviderInventoryProvider;
