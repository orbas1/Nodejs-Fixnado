import PropTypes from 'prop-types';
import FormField from '../../ui/FormField.jsx';
import { formatLabel, toInputValue } from '../constants.js';
import ModalContainer from './ModalContainer.jsx';

export default function ProfileModal({
  open,
  mode,
  formValues,
  options,
  submitting,
  error,
  onClose,
  onChange,
  onSubmit,
  onDelete
}) {
  const statuses = options.statuses ?? ['active', 'standby', 'on_leave', 'training'];
  const employmentTypes = options.employmentTypes ?? ['full_time', 'part_time', 'contractor'];
  const employerTypes = options.employerTypes ?? ['provider', 'sme', 'enterprise'];

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={submitting}
      error={error}
      title={mode === 'create' ? 'Add serviceman' : 'Edit serviceman'}
      description="Track supplier workforce contacts and the providers responsible for each serviceman."
      showDelete={mode === 'edit'}
      deleteLabel="Remove serviceman"
      onDelete={onDelete}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="profile-name" label="Full name">
          <input
            id="profile-name"
            type="text"
            value={toInputValue(formValues.displayName)}
            onChange={onChange('displayName')}
            required
            className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </FormField>
        <FormField id="profile-role" label="Primary role">
          <input
            id="profile-role"
            type="text"
            value={toInputValue(formValues.role)}
            onChange={onChange('role')}
            required
            className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </FormField>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="profile-status" label="Status">
          <select
            id="profile-status"
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
        <FormField id="profile-employment" label="Employment type">
          <select
            id="profile-employment"
            value={toInputValue(formValues.employmentType)}
            onChange={onChange('employmentType')}
            className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {employmentTypes.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="profile-employer-type" label="Supplier type">
          <select
            id="profile-employer-type"
            value={toInputValue(formValues.employerType)}
            onChange={onChange('employerType')}
            className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {employerTypes.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="profile-employer-name" label="Supplier / employer name" optionalLabel="Optional">
          <input
            id="profile-employer-name"
            type="text"
            value={toInputValue(formValues.employerName)}
            onChange={onChange('employerName')}
            className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </FormField>
      </div>
      <FormField id="profile-employer-contact" label="Supplier point of contact" optionalLabel="Optional">
        <input
          id="profile-employer-contact"
          type="text"
          value={toInputValue(formValues.employerContact)}
          onChange={onChange('employerContact')}
          className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </FormField>
      <FormField id="profile-zone" label="Primary zone" optionalLabel="Optional">
        <input
          id="profile-zone"
          type="text"
          value={toInputValue(formValues.primaryZone)}
          onChange={onChange('primaryZone')}
          className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </FormField>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="profile-email" label="Email" optionalLabel="Optional">
          <input
            id="profile-email"
            type="email"
            value={toInputValue(formValues.contactEmail)}
            onChange={onChange('contactEmail')}
            className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </FormField>
        <FormField id="profile-phone" label="Phone" optionalLabel="Optional">
          <input
            id="profile-phone"
            type="tel"
            value={toInputValue(formValues.contactPhone)}
            onChange={onChange('contactPhone')}
            className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </FormField>
      </div>
      <FormField id="profile-avatar" label="Avatar URL" optionalLabel="Optional">
        <input
          id="profile-avatar"
          type="url"
          value={toInputValue(formValues.avatarUrl)}
          onChange={onChange('avatarUrl')}
          className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </FormField>
      <FormField id="profile-skills" label="Skills" helper="Comma separated skills">
        <input
          id="profile-skills"
          type="text"
          value={toInputValue(formValues.skills)}
          onChange={onChange('skills')}
          className="w-full rounded-xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </FormField>
      <FormField id="profile-notes" label="Notes" optionalLabel="Optional">
        <textarea
          id="profile-notes"
          rows={3}
          value={toInputValue(formValues.notes)}
          onChange={onChange('notes')}
          className="w-full rounded-2xl border border-accent/30 px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </FormField>
    </ModalContainer>
  );
}

ProfileModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  formValues: PropTypes.object.isRequired,
  options: PropTypes.shape({
    statuses: PropTypes.array,
    employmentTypes: PropTypes.array,
    employerTypes: PropTypes.array
  }),
  submitting: PropTypes.bool,
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func
};

ProfileModal.defaultProps = {
  options: undefined,
  submitting: false,
  error: null,
  onDelete: undefined
};
