import PropTypes from 'prop-types';
import Card from '../../../components/ui/Card.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import { useServicemanByok } from '../ServicemanByokProvider.jsx';

const ACTION_LABELS = {
  'connector.created': 'Connector registered',
  'connector.updated': 'Connector updated',
  'connector.deleted': 'Connector removed',
  'connector.rotated': 'Secret rotated',
  'connector.diagnostic': 'Diagnostic executed',
  'profile.updated': 'Profile updated'
};

function formatTimestamp(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return '';
  }
}

export default function AuditLogPanel({ className }) {
  const { auditTrail } = useServicemanByok();
  const entries = Array.isArray(auditTrail) ? auditTrail : [];

  return (
    <Card className={className} padding="lg">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-primary">Audit history</h2>
          <p className="mt-1 text-sm text-slate-600">
            Every change to crew secrets is recorded for compliance, including who initiated the action.
          </p>
        </div>
        {entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            No activity recorded yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {entries.map((event) => (
              <li
                key={event.id}
                className="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm shadow-slate-100"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-primary">
                      {ACTION_LABELS[event.action] ?? event.action.replace('connector.', '').replace('.', ' ')}
                    </p>
                    {event.message ? <p className="text-sm text-slate-600">{event.message}</p> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <StatusPill tone={event.status === 'success' ? 'success' : event.status === 'warning' ? 'warning' : 'info'}>
                      {event.status}
                    </StatusPill>
                    {event.connectorId ? <span>Connector: {event.connectorId}</span> : null}
                    <span>{formatTimestamp(event.createdAt)}</span>
                  </div>
                </div>
                {event.metadata && Object.keys(event.metadata).length > 0 ? (
                  <dl className="mt-3 grid gap-1 text-xs text-slate-500 md:grid-cols-3">
                    {Object.entries(event.metadata).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <dt className="font-medium text-slate-600">{key}</dt>
                        <dd className="truncate">{Array.isArray(value) ? value.join(', ') : String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

AuditLogPanel.propTypes = {
  className: PropTypes.string
};

AuditLogPanel.defaultProps = {
  className: undefined
};
