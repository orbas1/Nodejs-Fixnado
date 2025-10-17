import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { useProviderOnboardingState } from './hooks/useProviderOnboardingState.js';

const ProviderOnboardingContext = createContext(null);

export function ProviderOnboardingProvider({ children, initialCompanyId = null }) {
  const value = useProviderOnboardingState({ companyId: initialCompanyId });
  return <ProviderOnboardingContext.Provider value={value}>{children}</ProviderOnboardingContext.Provider>;
}

ProviderOnboardingProvider.propTypes = {
  children: PropTypes.node.isRequired,
  initialCompanyId: PropTypes.string
};

export function useProviderOnboarding() {
  const context = useContext(ProviderOnboardingContext);
  if (!context) {
    throw new Error('useProviderOnboarding must be used within a ProviderOnboardingProvider');
  }
  return context;
}

export default ProviderOnboardingProvider;
