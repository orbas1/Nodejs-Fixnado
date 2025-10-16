import PropTypes from 'prop-types';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import { useServicemanByok } from '../ServicemanByokProvider.jsx';

function daysUntil(dateString) {
  if (!dateString) return null;
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) {
    return null;
  }
  const diff = target.getTime() - Date.now();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function DiagnosticsPanel({ className }) {
  const {
    connectors,
    diagnostics,
    diagnosticRunning,
    runDiagnosticForConnector,
    refresh
  } = useServicemanByok();

  const totalConnectors = connectors.length;
  const connectorsNeedingDiagnostics = connectors.filter((connector) => !diagnostics[connector.id]);
  const upcomingRotations = connectors
    .map((connector) => ({ connector, days: daysUntil(connector.rotatesAt) }))
    .filter((entry) => entry.days !== null && entry.days <= 14);

  return (
    <Card className={className} padding="lg">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-primary">Diagnostics & readiness</h2>
            <p className="mt-1 text-sm text-slate-600">
              Track which integrations have been validated recently and ensure secrets are rotated ahead of policy.
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={() => refresh({ silent: false })}>
            Refresh state
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total connectors</p>
            <p className="mt-2 text-3xl font-semibold text-primary">{totalConnectors}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-600">Pending diagnostics</p>
            <p className="mt-2 text-3xl font-semibold text-amber-600">{connectorsNeedingDiagnostics.length}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Upcoming rotations (14 days)</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">{upcomingRotations.length}</p>
          </div>
        </div>
        {connectorsNeedingDiagnostics.length > 0 ? (
          <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-800">
            {connectorsNeedingDiagnostics.length === 1 ? (
              <span>
                {connectorsNeedingDiagnostics[0].displayName} has never run a diagnostic. Ensure the secret is valid before
                dispatching automations.
              </span>
            ) : (
              <span>
                {connectorsNeedingDiagnostics.length} connectors have not been validated yet. Run diagnostics to confirm they
                respond correctly.
              </span>
            )}
          </div>
        ) : null}
        <div className="space-y-4">
          {connectors.length === 0 ? (
            <p className="text-sm text-slate-500">No connectors registered yet.</p>
          ) : (
            connectors.map((connector) => {
              const diagnostic = diagnostics[connector.id] ?? null;
              const nextRotation = daysUntil(connector.rotatesAt);
              const rotationTone =
                nextRotation === null
                  ? 'neutral'
                  : nextRotation <= 0
                  ? 'danger'
                  : nextRotation <= 7
                  ? 'warning'
                  : 'success';
              return (
                <div
                  key={connector.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/70 p-4"
                >
                  <div>
                    <p className="font-semibold text-primary">{connector.displayName}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{connector.provider}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      <StatusPill tone={rotationTone}>
                        {nextRotation === null
                          ? 'Rotation unscheduled'
                          : nextRotation < 0
                          ? `${Math.abs(nextRotation)} days overdue`
                          : `${nextRotation} days until rotation`}
                      </StatusPill>
                      <StatusPill tone={diagnostic?.status === 'passed' ? 'success' : 'info'}>
                        {diagnostic
                          ? `Last diagnostic: ${diagnostic.status} ${diagnostic.timestamp ? `on ${new Date(
                              diagnostic.timestamp
                            ).toLocaleDateString()}` : ''}`
                          : 'Diagnostic pending'}
                      </StatusPill>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      loading={diagnosticRunning === connector.id}
                      onClick={() => runDiagnosticForConnector(connector.id)}
                    >
                      {diagnosticRunning === connector.id ? 'Running…' : 'Run diagnostic'}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}

DiagnosticsPanel.propTypes = {
  className: PropTypes.string
};

DiagnosticsPanel.defaultProps = {
  className: undefined
};
