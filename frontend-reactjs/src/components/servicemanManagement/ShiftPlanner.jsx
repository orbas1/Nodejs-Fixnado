import PropTypes from 'prop-types';
import { SHIFT_STATUS_CLASSES, formatLabel } from './constants.js';

export default function ShiftPlanner({ roster, scheduleDays, shiftMap, timezone, onManageShift }) {
  return (
    <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-primary">Shift planner</h3>
          <p className="text-sm text-slate-600">Weekly availability across the roster.</p>
        </div>
        {timezone ? (
          <span className="rounded-full border border-accent/20 bg-secondary px-3 py-1 text-xs font-semibold text-primary/70">
            Timezone: {timezone}
          </span>
        ) : null}
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-secondary text-primary">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Crew</th>
              {scheduleDays.map((day) => (
                <th key={day.date || day.label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                  {day.label || day.date}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10 text-slate-700">
            {roster.length === 0 ? (
              <tr>
                <td colSpan={scheduleDays.length + 1} className="px-4 py-6 text-center text-sm text-slate-500">
                  Add servicemen to schedule weekly coverage.
                </td>
              </tr>
            ) : (
              roster.map((member) => (
                <tr key={member.id} className="align-top">
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-primary">{member.displayName}</p>
                    <p className="text-xs text-slate-500">{formatLabel(member.role)}</p>
                  </td>
                  {scheduleDays.map((day) => {
                    const shift = shiftMap.get(`${member.id}|${day.date}`) ?? null;
                    return (
                      <td key={`${member.id}-${day.date}`} className="px-2 py-3">
                        <button
                          type="button"
                          onClick={() => onManageShift(member, shift, day)}
                          className="block w-full text-left"
                        >
                          {shift ? (
                            <div className="rounded-xl border border-accent/20 bg-white px-3 py-2 shadow-sm transition hover:border-accent">
                              <p className="text-xs font-semibold text-primary">{shift.startTime} → {shift.endTime}</p>
                              <span
                                className={`mt-1 inline-flex rounded-full border px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${
                                  SHIFT_STATUS_CLASSES[shift.status] ?? 'border-accent/30 text-primary/80'
                                }`}
                              >
                                {formatLabel(shift.status)}
                              </span>
                              {shift.location ? (
                                <p className="mt-1 text-[0.65rem] text-slate-500">{shift.location}</p>
                              ) : null}
                              {shift.assignmentTitle ? (
                                <p className="mt-1 text-[0.65rem] text-slate-500">{shift.assignmentTitle}</p>
                              ) : null}
                            </div>
                          ) : (
                            <div className="flex min-h-[72px] items-center justify-center rounded-xl border border-dashed border-accent/40 bg-secondary text-xs font-semibold text-primary/70 transition hover:border-accent">
                              + Add shift
                            </div>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

ShiftPlanner.propTypes = {
  roster: PropTypes.arrayOf(PropTypes.object).isRequired,
  scheduleDays: PropTypes.arrayOf(PropTypes.object).isRequired,
  shiftMap: PropTypes.instanceOf(Map).isRequired,
  timezone: PropTypes.string,
  onManageShift: PropTypes.func.isRequired
};

ShiftPlanner.defaultProps = {
  timezone: null
};
