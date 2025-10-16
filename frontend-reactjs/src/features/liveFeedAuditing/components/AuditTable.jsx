import PropTypes from 'prop-types';
import { Button, Spinner, StatusPill } from '../../../components/ui/index.js';
import { formatDate, formatEventType, statusLabel, toneForSeverity } from '../utils.js';

export default function AuditTable({
  audits,
  loading,
  error,
  pagination,
  canGoPrev,
  canGoNext,
  onPrevPage,
  onNextPage,
  onInspect
}) {
  return (
    <div className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Audit events</h2>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>
            Page {pagination.page ?? 1} of {pagination.totalPages ?? 1}
          </span>
          <Button variant="secondary" size="sm" disabled={!canGoPrev} onClick={onPrevPage}>
            Previous
          </Button>
          <Button variant="secondary" size="sm" disabled={!canGoNext} onClick={onNextPage}>
            Next
          </Button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              <th className="px-6 py-3">Occurred</th>
              <th className="px-6 py-3">Event</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Severity</th>
              <th className="px-6 py-3">Summary</th>
              <th className="px-6 py-3">Actor</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                  <Spinner className="mx-auto h-6 w-6 text-primary" />
                  <span className="mt-3 block">Loading audit events…</span>
                </td>
              </tr>
            ) : null}

            {!loading && error ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-rose-600">
                  {error.message || 'Unable to load audit events'}
                </td>
              </tr>
            ) : null}

            {!loading && !error && audits.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                  No audit events match the current filters.
                </td>
              </tr>
            ) : null}

            {!loading && !error
              ? audits.map((audit) => (
                  <tr key={audit.id} className="text-sm text-slate-700">
                    <td className="px-6 py-4 align-top">
                      <div className="font-medium text-slate-900">{formatDate(audit.occurredAt)}</div>
                      <div className="text-xs text-slate-500">{audit.resourceType ?? '—'}</div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="font-semibold text-slate-900">{formatEventType(audit.eventType)}</div>
                      <div className="text-xs text-slate-500">{audit.resourceId ?? '—'}</div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <StatusPill tone={audit.status === 'resolved' ? 'success' : audit.status === 'dismissed' ? 'neutral' : 'info'}>
                        {statusLabel(audit.status)}
                      </StatusPill>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <StatusPill tone={toneForSeverity(audit.severity)}>{audit.severity ?? 'info'}</StatusPill>
                    </td>
                    <td className="px-6 py-4 align-top text-slate-600">
                      <div className="font-medium text-slate-900">{audit.summary}</div>
                      <div className="text-xs text-slate-500">{audit.zoneSnapshot?.name ?? 'Unassigned zone'}</div>
                    </td>
                    <td className="px-6 py-4 align-top text-slate-600">
                      <div>{audit.actorSnapshot?.name ?? 'System'}</div>
                      <div className="text-xs text-slate-500">{audit.actorSnapshot?.role ?? '—'}</div>
                    </td>
                    <td className="px-6 py-4 align-top text-right">
                      <Button size="sm" variant="secondary" onClick={() => onInspect(audit.id)}>
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

AuditTable.propTypes = {
  audits: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      occurredAt: PropTypes.string,
      resourceType: PropTypes.string,
      resourceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      eventType: PropTypes.string,
      status: PropTypes.string,
      severity: PropTypes.string,
      summary: PropTypes.string,
      zoneSnapshot: PropTypes.shape({ name: PropTypes.string }),
      actorSnapshot: PropTypes.shape({ name: PropTypes.string, role: PropTypes.string })
    })
  ).isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.shape({ message: PropTypes.string }),
  pagination: PropTypes.shape({
    page: PropTypes.number,
    totalPages: PropTypes.number,
    total: PropTypes.number
  }).isRequired,
  canGoPrev: PropTypes.bool.isRequired,
  canGoNext: PropTypes.bool.isRequired,
  onPrevPage: PropTypes.func.isRequired,
  onNextPage: PropTypes.func.isRequired,
  onInspect: PropTypes.func.isRequired
};
