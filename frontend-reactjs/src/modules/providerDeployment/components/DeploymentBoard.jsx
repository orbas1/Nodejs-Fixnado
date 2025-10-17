import PropTypes from 'prop-types';
import { ClipboardDocumentCheckIcon, PlusIcon } from '@heroicons/react/24/outline';
import Button from '../../../components/ui/Button.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import { useMemo } from 'react';

const toneMap = {
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
  on_hold: 'neutral'
};

function formatWindow(startAt, endAt) {
  if (!startAt && !endAt) {
    return '—';
  }
  const start = startAt ? new Date(startAt) : null;
  const end = endAt ? new Date(endAt) : null;
  const formatOptions = { hour: '2-digit', minute: '2-digit' };
  const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  if (start && end && start.toDateString() === end.toDateString()) {
    return `${start.toLocaleDateString(undefined, dateOptions)} · ${start.toLocaleTimeString(undefined, formatOptions)} – ${end.toLocaleTimeString(undefined, formatOptions)}`;
  }
  if (start && end) {
    return `${start.toLocaleString(undefined, dateOptions)} ${start.toLocaleTimeString(undefined, formatOptions)} – ${end.toLocaleString(undefined, dateOptions)} ${end.toLocaleTimeString(undefined, formatOptions)}`;
  }
  if (start) {
    return `${start.toLocaleDateString(undefined, dateOptions)} · ${start.toLocaleTimeString(undefined, formatOptions)}`;
  }
  return end ? end.toLocaleString(undefined, dateOptions) : '—';
}

export default function DeploymentBoard({ deployments, onCreate, onEdit, onDelete }) {
  const sorted = useMemo(
    () =>
      [...deployments].sort((a, b) => {
        if (!a.startAt) return 1;
        if (!b.startAt) return -1;
        return new Date(a.startAt) - new Date(b.startAt);
      }),
    [deployments]
  );

  return (
    <section className="space-y-6" aria-labelledby="provider-deployment-board" data-qa="provider-deployment-board">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="provider-deployment-board" className="text-xl font-semibold text-primary">
            Deployment board
          </h2>
          <p className="text-sm text-slate-500">Track scheduled jobs, standby windows, and historical deployments.</p>
        </div>
        <Button variant="secondary" size="sm" icon={PlusIcon} onClick={onCreate}>
          Schedule deployment
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-500">
          <ClipboardDocumentCheckIcon className="mx-auto mb-3 h-8 w-8 text-primary/60" />
          <p>No deployments scheduled. Assign a crew to an upcoming engagement to populate this board.</p>
          <Button className="mt-4" icon={PlusIcon} onClick={onCreate}>
            Schedule deployment
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-secondary text-primary">
              <tr>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">Deployment</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">Crew</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">Window</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">Status</th>
                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wide text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10 text-slate-700">
              {sorted.map((deployment) => (
                <tr key={deployment.id} className="hover:bg-secondary/50">
                  <td className="px-4 py-4 align-top">
                    <div className="font-semibold text-primary">{deployment.title}</div>
                    {deployment.referenceId ? (
                      <div className="text-xs text-slate-500">Ref: {deployment.referenceId}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-sm font-medium text-slate-700">
                      {deployment.crewMemberName || 'Unassigned'}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-slate-600">
                    {formatWindow(deployment.startAt, deployment.endAt)}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <StatusPill tone={toneMap[deployment.status] || 'neutral'}>
                      {deployment.status?.replace(/_/g, ' ') || 'scheduled'}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(deployment)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(deployment)}>
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

DeploymentBoard.propTypes = {
  deployments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      crewMemberId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      crewMemberName: PropTypes.string,
      startAt: PropTypes.string,
      endAt: PropTypes.string,
      status: PropTypes.string,
      referenceId: PropTypes.string,
      location: PropTypes.string
    })
  ).isRequired,
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};
