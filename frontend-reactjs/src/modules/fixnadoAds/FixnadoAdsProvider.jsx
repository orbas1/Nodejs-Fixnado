import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { useFixnadoAdsState } from './hooks/useFixnadoAdsState.js';

const FixnadoAdsContext = createContext(null);

export function FixnadoAdsProvider({ children, network = 'fixnado', initialSnapshot = {} }) {
  const value = useFixnadoAdsState({ network, initialSnapshot });
  return <FixnadoAdsContext.Provider value={value}>{children}</FixnadoAdsContext.Provider>;
}

FixnadoAdsProvider.propTypes = {
  children: PropTypes.node.isRequired,
  network: PropTypes.string,
  initialSnapshot: PropTypes.object
};

FixnadoAdsProvider.defaultProps = {
  network: 'fixnado',
  initialSnapshot: {}
};

export function useFixnadoAds() {
  const context = useContext(FixnadoAdsContext);
  if (!context) {
    throw new Error('useFixnadoAds must be used within a FixnadoAdsProvider');
  }
  return context;
}

export default FixnadoAdsProvider;
