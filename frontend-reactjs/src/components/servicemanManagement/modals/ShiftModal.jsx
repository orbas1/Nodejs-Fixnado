import PropTypes from 'prop-types';
import FormField from '../../ui/FormField.jsx';
import { formatLabel, toInputValue } from '../constants.js';
import ModalContainer from './ModalContainer.jsx';

export default function ShiftModal({
  open,
  mode,
  formValues,
  options,
  submitting,
  error,
  profile,
  onClose,
  onChange,
  onSubmit,
  onDelete
}) {
  const statuses = options.shiftStatuses ?? ['available', 'booked', 'standby', 'travel', 'off'];

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={submitting}
      error={error}
      title={mode === 'create' ? 'Schedule shift' : 'Edit shift'}
      description={`Plan coverage for ${profile?.displayName ?? 'crew member'}.`}
      showDelete={mode === 'edit'}
      deleteLabel="Delete shift"
      onDelete={onDelete}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="shift-date" label="Shift date">
          <input
            id="shift-date"
            type="date"
            value={toInputValue(formValues.shiftDate)}
            onChange={onChange('shiftDate')}
            required
            className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </FormField>
        <FormField id="shift-status" label="Status">
          <select
            id="shift-status"
            value={toInputValue(formValues.status)}
            onChange={onChange('status')}
            className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {formatLabel(status)}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="shift-start" label="Start time">
          <input
            id="shift-start"
            type="time"
            value={toInputValue(formValues.startTime)}
            onChange={onChange('startTime')}
            required
            className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </FormField>
        <FormField id="shift-end" label="End time">
          <input
            id="shift-end"
            type="time"
            value={toInputValue(formValues.endTime)}
            onChange={onChange('endTime')}
            required
            className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </FormField>
      </div>
      <FormField id="shift-assignment" label="Assignment / focus" optionalLabel="Optional">
        <input
          id="shift-assignment"
          type="text"
          value={toInputValue(formValues.assignmentTitle)}
          onChange={onChange('assignmentTitle')}
          className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </FormField>
      <FormField id="shift-location" label="Location / zone" optionalLabel="Optional">
        <input
          id="shift-location"
          type="text"
          value={toInputValue(formValues.location)}
          onChange={onChange('location')}
          className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </FormField>
      <FormField id="shift-notes" label="Notes" optionalLabel="Optional">
        <textarea
          id="shift-notes"
          rows={3}
          value={toInputValue(formValues.notes)}
          onChange={onChange('notes')}
          className="w-full rounded-2xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </FormField>
    </ModalContainer>
  );
}

ShiftModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  formValues: PropTypes.object.isRequired,
  options: PropTypes.shape({
    shiftStatuses: PropTypes.array
  }),
  submitting: PropTypes.bool,
  error: PropTypes.string,
  profile: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func
};

ShiftModal.defaultProps = {
  options: undefined,
  submitting: false,
  error: null,
  profile: null,
  onDelete: undefined
};
