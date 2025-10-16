import PropTypes from 'prop-types';
import { Button, StatusPill } from '../ui/index.js';
import { CATEGORY_LABELS, STATUS_LABELS } from './constants.js';

const AuditTimelineTable = ({ events, onView, onEdit, onDelete }) => (
  <div className="overflow-hidden rounded-3xl border border-accent/10 bg-white shadow-sm">
    <table className="min-w-full divide-y divide-accent/10 text-left text-sm text-slate-600">
      <thead className="bg-secondary/60 text-xs uppercase tracking-[0.3em] text-slate-500">
        <tr>
          <th scope="col" className="px-4 py-3 font-semibold">
            Event
          </th>
          <th scope="col" className="px-4 py-3 font-semibold">
            Category
          </th>
          <th scope="col" className="px-4 py-3 font-semibold">
            Owner
          </th>
          <th scope="col" className="px-4 py-3 font-semibold">
            When
          </th>
          <th scope="col" className="px-4 py-3 font-semibold">
            Status
          </th>
          <th scope="col" className="px-4 py-3 font-semibold">
            Source
          </th>
          <th scope="col" className="px-4 py-3 font-semibold text-right">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-accent/10">
        {events.length === 0 ? (
          <tr>
            <td className="px-4 py-5 text-center text-sm text-slate-500" colSpan={7}>
              No audit entries match the current filters. Create one to begin tracking manual checkpoints.
            </td>
          </tr>
        ) : (
          events.map((event) => {
            const statusMeta = STATUS_LABELS[event.status] ?? STATUS_LABELS.scheduled;
            return (
              <tr key={event.id} className="hover:bg-secondary/50">
                <td className="px-4 py-4">
                  <div className="font-semibold text-primary">{event.event}</div>
                  <p className="mt-1 text-xs text-slate-500">{event.summary || 'No summary provided.'}</p>
                </td>
                <td className="px-4 py-4 capitalize">{CATEGORY_LABELS[event.category] || event.category}</td>
                <td className="px-4 py-4">
                  <div>{event.owner}</div>
                  {event.ownerTeam ? <p className="text-xs text-slate-500">{event.ownerTeam}</p> : null}
                </td>
                <td className="px-4 py-4 text-sm font-medium text-primary">{event.time}</td>
                <td className="px-4 py-4">
                  <StatusPill tone={statusMeta.tone}>{statusMeta.label}</StatusPill>
                </td>
                <td className="px-4 py-4 capitalize">{event.source === 'manual' ? 'Manual' : 'System'}</td>
                <td className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                  <Button variant="secondary" size="sm" onClick={() => onView(event)}>
                    View
                  </Button>
                  {event.source === 'manual' ? (
                    <>
                      <Button variant="tertiary" size="sm" onClick={() => onEdit(event)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => onDelete(event)}>
                        Delete
                      </Button>
                    </>
                  ) : null}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);

AuditTimelineTable.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      event: PropTypes.string,
      owner: PropTypes.string,
      ownerTeam: PropTypes.string,
      time: PropTypes.string,
      status: PropTypes.string,
      category: PropTypes.string,
      source: PropTypes.string,
      summary: PropTypes.string
    })
  ).isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default AuditTimelineTable;
