import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { getProviderDashboardCssVariables } from '../../../theme/providerDashboardTheme.js';
import '../provider-dashboard.css';

export default function ProviderDashboardTheme({ as: Component, className, variant, children }) {
  const variables = useMemo(() => getProviderDashboardCssVariables(variant), [variant]);

  return (
    <Component className={className} style={variables} data-provider-dashboard>
      {children}
    </Component>
  );
}

ProviderDashboardTheme.propTypes = {
  as: PropTypes.elementType,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['aurora', 'daybreak']),
  children: PropTypes.node.isRequired
};

ProviderDashboardTheme.defaultProps = {
  as: 'section',
  className: '',
  variant: 'aurora'
};
