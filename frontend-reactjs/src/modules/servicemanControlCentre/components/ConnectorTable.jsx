import PropTypes from 'prop-types';
import { PencilSquareIcon, KeyIcon, BoltIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import { useServicemanByok } from '../ServicemanByokProvider.jsx';

function toneForStatus(status) {
  switch (status) {
    case 'active':
      return 'success';
    case 'disabled':
      return 'neutral';
    case 'pending':
      return 'warning';
    case 'revoked':
      return 'danger';
    default:
      return 'info';
  }
}

function formatDate(value) {
  if (!value) return 'Not scheduled';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Not scheduled';
    }
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  } catch (error) {
    return 'Not scheduled';
  }
}

function formatScopes(scopes) {
  if (!Array.isArray(scopes) || scopes.length === 0) {
    return '—';
  }
  return scopes.join(', ');
}

export default function ConnectorTable({ className }) {
  const {
    connectors,
    connectorSaving,
    connectorError,
    diagnostics,
    diagnosticRunning,
    openConnectorForm,
    removeConnector,
    requestRotation,
    runDiagnosticForConnector
  } = useServicemanByok();

  const hasConnectors = connectors.length > 0;

  return (
    <Card className={className} padding="lg">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-primary">Registered connectors</h2>
            <p className="mt-1 text-sm text-slate-600">
              Manage crew-specific keys for AI, communications, and automation providers. Rotation reminders respect the
              profile policy.
            </p>
          </div>
          <Button type="button" variant="primary" onClick={() => openConnectorForm(null)} icon={PlusIcon}>
            Add connector
          </Button>
        </div>
        {connectorError ? <span className="text-sm text-rose-600">{connectorError}</span> : null}
        {hasConnectors ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-semibold">Connector</th>
                  <th className="px-4 py-3 font-semibold">Environment</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Scopes</th>
                  <th className="px-4 py-3 font-semibold">Next rotation</th>
                  <th className="px-4 py-3 font-semibold">Diagnostics</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {connectors.map((connector) => {
                  const diagnostic = diagnostics[connector.id] ?? null;
                  return (
                    <tr key={connector.id} className="align-top">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-primary">{connector.displayName}</div>
                        <div className="text-xs uppercase tracking-wide text-slate-500">{connector.provider}</div>
                        {connector.metadata?.notes ? (
                          <p className="mt-2 text-xs text-slate-500">{connector.metadata.notes}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <StatusPill tone="info">{connector.environment}</StatusPill>
                      </td>
                      <td className="px-4 py-4">
                        <StatusPill tone={toneForStatus(connector.status)}>{connector.status}</StatusPill>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{formatScopes(connector.scopes)}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{formatDate(connector.rotatesAt)}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {diagnostic ? (
                          <span>
                            <span className="font-medium text-primary">{diagnostic.status}</span>
                            <span className="block text-xs text-slate-500">
                              {diagnostic.timestamp ? new Date(diagnostic.timestamp).toLocaleString() : ''}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">No run recorded</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={PencilSquareIcon}
                            onClick={() => openConnectorForm(connector)}
                            disabled={connectorSaving}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={KeyIcon}
                            onClick={() => requestRotation(connector)}
                            disabled={connectorSaving}
                          >
                            Rotate key
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={BoltIcon}
                            onClick={() => runDiagnosticForConnector(connector.id)}
                            disabled={connectorSaving || diagnosticRunning === connector.id}
                          >
                            {diagnosticRunning === connector.id ? 'Running…' : 'Run diagnostic'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={TrashIcon}
                            onClick={() => removeConnector(connector.id)}
                            disabled={connectorSaving}
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
            <p className="font-medium text-primary">No connectors registered yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Add the first key to enable crew-specific automations, AI workflows, and communications bridges.
            </p>
            <Button type="button" className="mt-4" onClick={() => openConnectorForm(null)} icon={PlusIcon}>
              Register connector
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

ConnectorTable.propTypes = {
  className: PropTypes.string
};

ConnectorTable.defaultProps = {
  className: undefined
};
