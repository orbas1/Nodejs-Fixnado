import { createContext, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const DashboardOverlayContext = createContext(null);

export function DashboardOverlayProvider({ children }) {
  const [panel, setPanel] = useState(null);

  const value = useMemo(
    () => ({
      panel,
      openPanel: (nextPanel) => {
        if (!nextPanel) {
          setPanel(null);
          return;
        }

        setPanel({
          title: nextPanel.title ?? 'Details',
          subtitle: nextPanel.subtitle ?? null,
          meta: Array.isArray(nextPanel.meta) ? nextPanel.meta : [],
          actions: Array.isArray(nextPanel.actions) ? nextPanel.actions : [],
          body: nextPanel.body ?? null,
          variant: nextPanel.variant ?? 'drawer',
          size: nextPanel.size ?? (nextPanel.variant === 'workspace' ? 'xl' : 'md')
        });
      },
      closePanel: () => setPanel(null)
    }),
    [panel]
  );

  return <DashboardOverlayContext.Provider value={value}>{children}</DashboardOverlayContext.Provider>;
}

DashboardOverlayProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useDashboardOverlay() {
  const context = useContext(DashboardOverlayContext);
  if (!context) {
    throw new Error('useDashboardOverlay must be used within a DashboardOverlayProvider');
  }
  return context;
}

