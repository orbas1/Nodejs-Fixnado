import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Button from '../../ui/Button.jsx';
import useSecurityPosture from '../../../hooks/useSecurityPosture.js';
import SecuritySummaryGrid from './SecuritySummaryGrid.jsx';
import SignalsSection from './signals/SignalsSection.jsx';
import AutomationSection from './automation/AutomationSection.jsx';
import ConnectorsSection from './connectors/ConnectorsSection.jsx';

export default function SecurityTelemetryWorkspace({ initialData }) {
  const initialState = useMemo(() => {
    if (!initialData) {
      return null;
    }
    return {
      timezone: initialData.timezone ?? 'Europe/London',
      updatedAt: initialData.updatedAt ?? null,
      signals: initialData.signals ?? [],
      automationTasks: initialData.automationTasks ?? initialData.automationBacklog ?? [],
      connectors: initialData.connectors ?? [],
      summary: initialData.summary ?? {},
      capabilities: initialData.capabilities ?? {}
    };
  }, [initialData]);

  const {
    data,
    loading,
    error,
    refreshing,
    refresh,
    saveSignal,
    removeSignal,
    saveAutomationTask,
    removeAutomationTask,
    saveConnector,
    removeConnector,
    reorderSignals
  } = useSecurityPosture({ initialState, autoRefresh: true, refreshInterval: 5 * 60 * 1000 });

  if (loading && !data) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl border border-accent/10 bg-white p-8 text-center text-slate-500 shadow-sm">
          Loading security telemetry workspace…
        </div>
      </section>
    );
  }

  const summary = data?.summary ?? {};
  const signals = data?.signals ?? [];
  const automationTasks = data?.automationTasks ?? [];
  const connectors = data?.connectors ?? [];
  const capabilities = data?.capabilities ?? {
    canManageSignals: false,
    canManageAutomation: false,
    canManageConnectors: false
  };
  const lastUpdated = data?.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'Not yet refreshed';

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-primary">Security &amp; telemetry workspace</h3>
          <p className="text-sm text-slate-600">Monitor security signals, automation backlog, and telemetry connectors from one control panel.</p>
          <p className="mt-1 text-xs text-slate-500">Last updated {lastUpdated}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowTopRightOnSquareIcon}
            iconPosition="end"
            to="/telemetry"
          >
            Open telemetry dashboard
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowPathIcon}
            onClick={() => refresh({ silent: false })}
            loading={refreshing}
          >
            Refresh posture
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          Unable to load the latest security posture: {error.message}
        </div>
      ) : null}

      <SecuritySummaryGrid summary={summary} />

      <SignalsSection
        signals={signals}
        capabilities={capabilities}
        onSave={saveSignal}
        onArchive={removeSignal}
        onReorder={reorderSignals}
      />

      <AutomationSection
        automationTasks={automationTasks}
        capabilities={capabilities}
        onSave={saveAutomationTask}
        onArchive={removeAutomationTask}
      />

      <ConnectorsSection
        connectors={connectors}
        capabilities={capabilities}
        onSave={saveConnector}
        onArchive={removeConnector}
      />
    </section>
  );
}

SecurityTelemetryWorkspace.propTypes = {
  initialData: PropTypes.shape({
    timezone: PropTypes.string,
    updatedAt: PropTypes.string,
    signals: PropTypes.arrayOf(PropTypes.object),
    automationTasks: PropTypes.arrayOf(PropTypes.object),
    automationBacklog: PropTypes.arrayOf(PropTypes.object),
    connectors: PropTypes.arrayOf(PropTypes.object),
    summary: PropTypes.object,
    capabilities: PropTypes.object
  })
};

SecurityTelemetryWorkspace.defaultProps = {
  initialData: null
};
