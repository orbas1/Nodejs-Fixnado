import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../../components/ui/Modal.jsx';
import Button from '../../../../components/ui/Button.jsx';
import FormField from '../../../../components/ui/FormField.jsx';

const daysOfWeek = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

const availabilityStatuses = [
  { value: 'available', label: 'Available' },
  { value: 'on_call', label: 'On call' },
  { value: 'standby', label: 'Standby' },
  { value: 'unavailable', label: 'Unavailable' }
];

function toDateInput(value) {
  if (!value) return '';
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch (error) {
    return '';
  }
}

function fromDateInput(value) {
  if (!value) return undefined;
  try {
    const date = new Date(value);
    return date.toISOString();
  } catch (error) {
    return undefined;
  }
}

export default function AvailabilityModal({
  open,
  mode,
  availability,
  crewMembers,
  initialCrewMemberId,
  initialDay,
  onClose,
  onSubmit,
  onDelete
}) {
  const [form, setForm] = useState({
    crewMemberId: '',
    dayOfWeek: 'monday',
    startTime: '',
    endTime: '',
    status: 'available',
    location: '',
    effectiveFrom: '',
    effectiveTo: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (availability) {
      setForm({
        crewMemberId: availability.crewMemberId || initialCrewMemberId || '',
        dayOfWeek: availability.day || availability.dayOfWeek || initialDay || 'monday',
        startTime: availability.startTime || '',
        endTime: availability.endTime || '',
        status: availability.status || 'available',
        location: availability.location || '',
        effectiveFrom: toDateInput(availability.effectiveFrom),
        effectiveTo: toDateInput(availability.effectiveTo),
        notes: availability.notes || ''
      });
    } else {
      setForm({
        crewMemberId: initialCrewMemberId || '',
        dayOfWeek: initialDay || 'monday',
        startTime: '',
        endTime: '',
        status: 'available',
        location: '',
        effectiveFrom: '',
        effectiveTo: '',
        notes: ''
      });
    }
    setErrors({});
    setSubmitting(false);
    setFormError(null);
  }, [open, availability, initialCrewMemberId, initialDay]);

  const crewOptions = useMemo(
    () =>
      crewMembers.map((member) => (
        <option key={member.id} value={member.id}>
          {member.fullName}
        </option>
      )),
    [crewMembers]
  );

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);

    const payload = {
      crewMemberId: form.crewMemberId,
      dayOfWeek: form.dayOfWeek,
      startTime: form.startTime,
      endTime: form.endTime,
      status: form.status,
      location: form.location.trim() || undefined,
      effectiveFrom: fromDateInput(form.effectiveFrom),
      effectiveTo: fromDateInput(form.effectiveTo),
      notes: form.notes.trim() || undefined
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (error) {
      const fieldErrors = error?.cause?.errors || error?.details;
      if (fieldErrors && typeof fieldErrors === 'object') {
        setErrors(fieldErrors);
      }
      setFormError(error.message || 'Unable to save availability.');
      setSubmitting(false);
    }
  };

  const footer = (
    <div className="flex flex-wrap justify-between gap-2">
      {mode === 'edit' ? (
        <Button variant="ghost" size="sm" onClick={() => onDelete?.()} disabled={submitting}>
          Remove slot
        </Button>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" onClick={handleSubmit} loading={submitting}>
          {mode === 'edit' ? 'Save changes' : 'Create slot'}
        </Button>
      </div>
    </div>
  );

  const title = mode === 'edit' ? 'Edit availability slot' : 'Add availability slot';
  const description =
    mode === 'edit'
      ? 'Adjust working hours, status, or coverage notes for this crew member.'
      : 'Define when a crew member is available and which days they can cover.';

  return (
    <Modal open={open} title={title} description={description} onClose={onClose} footer={footer}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {formError ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{formError}</p> : null}
        <FormField id="availability-crew" label="Crew member" error={errors.crewMemberId}>
          <select
            id="availability-crew"
            className="fx-select"
            value={form.crewMemberId}
            onChange={handleChange('crewMemberId')}
            required
          >
            <option value="" disabled>
              Select crew member
            </option>
            {crewOptions}
          </select>
        </FormField>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField id="availability-day" label="Day" error={errors.dayOfWeek}>
            <select id="availability-day" className="fx-select" value={form.dayOfWeek} onChange={handleChange('dayOfWeek')}>
              {daysOfWeek.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="availability-start" label="Start" error={errors.startTime}>
            <input
              id="availability-start"
              className="fx-text-input"
              type="time"
              value={form.startTime}
              onChange={handleChange('startTime')}
              required
            />
          </FormField>
          <FormField id="availability-end" label="End" error={errors.endTime}>
            <input
              id="availability-end"
              className="fx-text-input"
              type="time"
              value={form.endTime}
              onChange={handleChange('endTime')}
              required
            />
          </FormField>
        </div>
        <FormField id="availability-status" label="Status" error={errors.status}>
          <select id="availability-status" className="fx-select" value={form.status} onChange={handleChange('status')}>
            {availabilityStatuses.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="availability-location" label="Location" optionalLabel="Optional" error={errors.location}>
          <input
            id="availability-location"
            className="fx-text-input"
            value={form.location}
            onChange={handleChange('location')}
          />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="availability-effective-from" label="Effective from" optionalLabel="Optional" error={errors.effectiveFrom}>
            <input
              id="availability-effective-from"
              className="fx-text-input"
              type="date"
              value={form.effectiveFrom}
              onChange={handleChange('effectiveFrom')}
            />
          </FormField>
          <FormField id="availability-effective-to" label="Effective to" optionalLabel="Optional" error={errors.effectiveTo}>
            <input
              id="availability-effective-to"
              className="fx-text-input"
              type="date"
              value={form.effectiveTo}
              onChange={handleChange('effectiveTo')}
            />
          </FormField>
        </div>
        <FormField id="availability-notes" label="Notes" optionalLabel="Optional" error={errors.notes}>
          <textarea
            id="availability-notes"
            className="fx-textarea"
            rows={4}
            value={form.notes}
            onChange={handleChange('notes')}
          />
        </FormField>
      </form>
    </Modal>
  );
}

AvailabilityModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  availability: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    crewMemberId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    day: PropTypes.string,
    dayOfWeek: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
    status: PropTypes.string,
    location: PropTypes.string,
    effectiveFrom: PropTypes.string,
    effectiveTo: PropTypes.string,
    notes: PropTypes.string
  }),
  crewMembers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      fullName: PropTypes.string.isRequired
    })
  ).isRequired,
  initialCrewMemberId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  initialDay: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func
};

AvailabilityModal.defaultProps = {
  availability: null,
  initialCrewMemberId: '',
  initialDay: 'monday',
  onDelete: undefined
};
