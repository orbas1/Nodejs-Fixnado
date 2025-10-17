import PropTypes from 'prop-types';
import SectionCard from './SectionCard.jsx';

const DAY_ORDER = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday']
];

function AvailabilityTemplateForm({ form, onToggleDay, onTimeChange, onSubmit, saving, status }) {
  return (
    <SectionCard
      title="Availability template"
      description="This template powers auto-matching, routing, and customer booking windows. Update it when your default schedule changes."
      onSubmit={onSubmit}
      saving={saving}
      status={status}
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {DAY_ORDER.map(([key, label]) => {
          const day = form[key] ?? { available: false, start: null, end: null };
          return (
            <div
              key={key}
              className={`rounded-2xl border px-4 py-3 shadow-sm ${
                day.available
                  ? 'border-accent/40 bg-accent/5'
                  : 'border-accent/10 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-3 text-sm font-semibold text-primary">
                  <input
                    type="checkbox"
                    checked={day.available}
                    onChange={(event) => onToggleDay(key, event.target.checked)}
                    className="h-4 w-4 rounded border-accent/40 text-primary focus:ring-accent"
                  />
                  {label}
                </label>
                {day.available ? (
                  <div className="flex items-center gap-2 text-xs text-primary/70">
                    <span className="rounded-full bg-primary/10 px-2 py-1 font-semibold uppercase tracking-wide">
                      Active
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Off</span>
                )}
              </div>
              {day.available ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Start
                    <input
                      type="time"
                      value={day.start ?? ''}
                      onChange={(event) => onTimeChange(key, 'start', event.target.value)}
                      className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    End
                    <input
                      type="time"
                      value={day.end ?? ''}
                      onChange={(event) => onTimeChange(key, 'end', event.target.value)}
                      className="rounded-lg border border-accent/20 px-3 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none"
                    />
                  </label>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

AvailabilityTemplateForm.propTypes = {
  form: PropTypes.objectOf(
    PropTypes.shape({
      available: PropTypes.bool,
      start: PropTypes.string,
      end: PropTypes.string
    })
  ).isRequired,
  onToggleDay: PropTypes.func.isRequired,
  onTimeChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    message: PropTypes.string.isRequired
  })
};

AvailabilityTemplateForm.defaultProps = {
  saving: false,
  status: null
};

export default AvailabilityTemplateForm;
