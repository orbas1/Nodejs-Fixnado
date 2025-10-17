import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../components/ui/Modal.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Button from '../../../components/ui/Button.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'standby', label: 'Standby' },
  { value: 'unavailable', label: 'Unavailable' }
];

function SelectField({ id, label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-600" htmlFor={id}>
      <span className="font-medium text-slate-700">{label}</span>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

SelectField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired
};

export default function AvailabilityModal({ open, onClose, onSubmit, initialValue, saving }) {
  const defaultValue = useMemo(
    () => ({
      dayOfWeek: 0,
      startTime: '08:00',
      endTime: '17:00',
      status: 'available',
      locationLabel: '',
      notes: ''
    }),
    []
  );

  const [formState, setFormState] = useState(defaultValue);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setFormState({ ...defaultValue, ...initialValue });
      setError(null);
    }
  }, [defaultValue, initialValue, open]);

  const handleChange = (field) => (event) => {
    const value = field === 'dayOfWeek' ? Number.parseInt(event.target.value, 10) : event.target.value;
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await onSubmit(formState);
      onClose();
    } catch (err) {
      setError(err?.body?.message || err?.message || 'Unable to save availability');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initialValue?.id ? 'Edit availability' : 'Add availability'} size="lg">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="availability-day"
            label="Day of week"
            value={formState.dayOfWeek}
            onChange={handleChange('dayOfWeek')}
            options={DAYS.map((day, index) => ({ value: index, label: day }))}
          />
          <SelectField
            id="availability-status"
            label="Status"
            value={formState.status}
            onChange={handleChange('status')}
            options={STATUS_OPTIONS}
          />
          <TextInput
            id="availability-start"
            label="Start time"
            type="time"
            value={formState.startTime}
            onChange={handleChange('startTime')}
          />
          <TextInput
            id="availability-end"
            label="End time"
            type="time"
            value={formState.endTime}
            onChange={handleChange('endTime')}
          />
        </div>
        <TextInput
          id="availability-location"
          label="Location or context"
          placeholder="e.g. Metro North depot"
          value={formState.locationLabel ?? ''}
          onChange={handleChange('locationLabel')}
        />
        <TextInput
          id="availability-notes"
          label="Notes"
          placeholder="Optional instructions for this window"
          value={formState.notes ?? ''}
          onChange={handleChange('notes')}
        />
        {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save availability'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

AvailabilityModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialValue: PropTypes.shape({
    id: PropTypes.string,
    dayOfWeek: PropTypes.number,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
    status: PropTypes.string,
    locationLabel: PropTypes.string,
    notes: PropTypes.string
  }),
  saving: PropTypes.bool
};

AvailabilityModal.defaultProps = {
  initialValue: undefined,
  saving: false
};
