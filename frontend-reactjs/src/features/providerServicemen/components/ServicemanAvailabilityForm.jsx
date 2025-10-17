import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Checkbox from '../../../components/ui/Checkbox.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';

function buildDefaultAvailability(enums) {
  return {
    id: null,
    dayOfWeek: enums?.daysOfWeek?.[0]?.value ?? 1,
    startTime: '08:00',
    endTime: '17:00',
    timezone: enums?.timezones?.[0] ?? 'Europe/London',
    isActive: true
  };
}

export default function ServicemanAvailabilityForm({
  entries,
  onChange,
  onSave,
  enums,
  disabled,
  saving,
  message,
  error
}) {
  const handleUpdate = (index, updates) => {
    const next = entries.map((entry, idx) => (idx === index ? { ...entry, ...updates } : entry));
    onChange(next);
  };

  const handleRemove = (index) => {
    const next = entries.filter((_, idx) => idx !== index);
    onChange(next.length ? next : [buildDefaultAvailability(enums)]);
  };

  const handleAdd = () => {
    onChange([...entries, buildDefaultAvailability(enums)]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">Availability</h4>
        {message ? <StatusPill tone="success">{message}</StatusPill> : null}
      </div>
      {error ? <StatusPill tone="danger">{error}</StatusPill> : null}
      <div className={`space-y-3 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
        {entries.map((entry, index) => (
          <div key={entry.id ?? `availability-${index}`} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-4">
              <FormField id={`availability-day-${index}`} label="Day">
                <select
                  id={`availability-day-${index}`}
                  value={entry.dayOfWeek}
                  onChange={(event) => handleUpdate(index, { dayOfWeek: Number(event.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {(enums?.daysOfWeek ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField id={`availability-start-${index}`} label="Start">
                <TextInput
                  id={`availability-start-${index}`}
                  type="time"
                  value={entry.startTime}
                  onChange={(event) => handleUpdate(index, { startTime: event.target.value })}
                />
              </FormField>
              <FormField id={`availability-end-${index}`} label="End">
                <TextInput
                  id={`availability-end-${index}`}
                  type="time"
                  value={entry.endTime}
                  onChange={(event) => handleUpdate(index, { endTime: event.target.value })}
                />
              </FormField>
              <FormField id={`availability-timezone-${index}`} label="Timezone">
                <select
                  id={`availability-timezone-${index}`}
                  value={entry.timezone}
                  onChange={(event) => handleUpdate(index, { timezone: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {(enums?.timezones ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Checkbox
                label="Active"
                checked={Boolean(entry.isActive)}
                onChange={(event) => handleUpdate(index, { isActive: event.target.checked })}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleRemove(index)}
                disabled={entries.length <= 1}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={handleAdd}>
            Add availability window
          </Button>
          <Button type="button" size="sm" variant="primary" loading={saving} onClick={onSave}>
            Save availability
          </Button>
        </div>
        {disabled ? (
          <p className="text-xs text-slate-500">
            Create the serviceman profile before setting availability windows.
          </p>
        ) : null}
      </div>
    </div>
  );
}

ServicemanAvailabilityForm.propTypes = {
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      dayOfWeek: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      startTime: PropTypes.string,
      endTime: PropTypes.string,
      timezone: PropTypes.string,
      isActive: PropTypes.bool
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  enums: PropTypes.shape({
    daysOfWeek: PropTypes.array,
    timezones: PropTypes.array
  }),
  disabled: PropTypes.bool,
  saving: PropTypes.bool,
  message: PropTypes.string,
  error: PropTypes.string
};

ServicemanAvailabilityForm.defaultProps = {
  enums: {},
  disabled: false,
  saving: false,
  message: null,
  error: null
};
