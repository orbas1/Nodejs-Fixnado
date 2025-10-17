import PropTypes from 'prop-types';
import { CalendarDaysIcon, MapPinIcon, PlusIcon } from '@heroicons/react/24/outline';
import Button from '../../../components/ui/Button.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';

const statusToneMap = {
  available: 'success',
  on_call: 'info',
  standby: 'warning',
  unavailable: 'danger'
};

const dayLabels = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

export default function AvailabilityPlanner({ rota, onCreate, onEdit, onDelete }) {
  return (
    <section className="space-y-6" aria-labelledby="provider-availability-planner" data-qa="provider-availability-planner">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="provider-availability-planner" className="text-xl font-semibold text-primary">
            Availability & rota
          </h2>
          <p className="text-sm text-slate-500">
            Maintain on-call coverage and ensure shift handovers are clear across the week.
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={PlusIcon} onClick={() => onCreate()}>
          Add availability window
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rota.map((entry) => (
          <div key={entry.day} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-primary">{dayLabels[entry.day] || entry.day}</h3>
            </div>
            {entry.slots.length === 0 ? (
              <div className="space-y-3 text-sm text-slate-500">
                <p>No availability configured for this day.</p>
                <Button variant="ghost" size="sm" icon={PlusIcon} onClick={() => onCreate(entry.day)}>
                  Add slot
                </Button>
              </div>
            ) : (
              <ul className="space-y-3 text-sm">
                {entry.slots.map((slot) => (
                  <li
                    key={slot.id}
                    className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-primary">{slot.crewMemberName || 'Unassigned'}</p>
                        <p className="text-xs text-slate-500">
                          {slot.startTime || '—'} – {slot.endTime || '—'}
                        </p>
                      </div>
                      <StatusPill tone={statusToneMap[slot.status] || 'neutral'}>
                        {slot.status?.replace(/_/g, ' ') || 'available'}
                      </StatusPill>
                    </div>
                    {slot.location ? (
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <MapPinIcon className="h-4 w-4 text-primary/70" />
                        <span>{slot.location}</span>
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onEdit({ ...slot, day: entry.day })}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete({ ...slot, day: entry.day })}>
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {entry.slots.length > 0 ? (
              <div className="mt-4">
                <Button variant="ghost" size="sm" icon={PlusIcon} onClick={() => onCreate(entry.day)}>
                  Add slot
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

AvailabilityPlanner.propTypes = {
  rota: PropTypes.arrayOf(
    PropTypes.shape({
      day: PropTypes.string.isRequired,
      slots: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
          crewMemberId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          crewMemberName: PropTypes.string,
          startTime: PropTypes.string,
          endTime: PropTypes.string,
          status: PropTypes.string,
          location: PropTypes.string
        })
      ).isRequired
    })
  ).isRequired,
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};
