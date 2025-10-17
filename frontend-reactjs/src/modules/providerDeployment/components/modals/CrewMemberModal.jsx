import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../../components/ui/Modal.jsx';
import Button from '../../../../components/ui/Button.jsx';
import FormField from '../../../../components/ui/FormField.jsx';

const crewStatuses = [
  { value: 'active', label: 'Active' },
  { value: 'standby', label: 'Standby' },
  { value: 'leave', label: 'On leave' },
  { value: 'inactive', label: 'Inactive' }
];

const employmentTypes = [
  { value: 'employee', label: 'Employee' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'partner', label: 'Partner crew' }
];

function normaliseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((entry) => entry && entry.trim().length > 0);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
}

export default function CrewMemberModal({ open, mode, crewMember, onClose, onSubmit, onDelete }) {
  const [form, setForm] = useState({
    fullName: '',
    role: '',
    email: '',
    phone: '',
    status: 'active',
    employmentType: 'employee',
    timezone: '',
    defaultShiftStart: '',
    defaultShiftEnd: '',
    skills: '',
    notes: '',
    allowedRoles: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (crewMember) {
      setForm({
        fullName: crewMember.fullName || '',
        role: crewMember.role || '',
        email: crewMember.email || '',
        phone: crewMember.phone || '',
        status: crewMember.status || 'active',
        employmentType: crewMember.employmentType || 'employee',
        timezone: crewMember.timezone || '',
        defaultShiftStart: crewMember.defaultShiftStart || '',
        defaultShiftEnd: crewMember.defaultShiftEnd || '',
        skills: crewMember.skills?.join(', ') || '',
        notes: crewMember.notes || '',
        allowedRoles: crewMember.allowedRoles?.join(', ') || ''
      });
    } else {
      setForm({
        fullName: '',
        role: '',
        email: '',
        phone: '',
        status: 'active',
        employmentType: 'employee',
        timezone: '',
        defaultShiftStart: '',
        defaultShiftEnd: '',
        skills: '',
        notes: '',
        allowedRoles: ''
      });
    }
    setErrors({});
    setFormError(null);
    setSubmitting(false);
  }, [open, crewMember]);

  const title = mode === 'edit' ? 'Edit crew member' : 'Add crew member';
  const description =
    mode === 'edit'
      ? 'Update contact details, shift defaults, and role allowances for this crew member.'
      : 'Capture core contact details, shift defaults, and which roles can manage this crew member.';

  const statusOptions = useMemo(
    () =>
      crewStatuses.map((entry) => (
        <option key={entry.value} value={entry.value}>
          {entry.label}
        </option>
      )),
    []
  );

  const employmentOptions = useMemo(
    () =>
      employmentTypes.map((entry) => (
        <option key={entry.value} value={entry.value}>
          {entry.label}
        </option>
      )),
    []
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
      fullName: form.fullName.trim(),
      role: form.role.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      status: form.status,
      employmentType: form.employmentType,
      timezone: form.timezone.trim() || undefined,
      defaultShiftStart: form.defaultShiftStart || undefined,
      defaultShiftEnd: form.defaultShiftEnd || undefined,
      skills: normaliseList(form.skills),
      notes: form.notes.trim() || undefined,
      allowedRoles: normaliseList(form.allowedRoles)
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (error) {
      const fieldErrors = error?.cause?.errors || error?.details;
      if (fieldErrors && typeof fieldErrors === 'object') {
        setErrors(fieldErrors);
      }
      setFormError(error.message || 'Unable to save crew member.');
      setSubmitting(false);
    }
  };

  const footer = (
    <div className="flex flex-wrap justify-between gap-2">
      {mode === 'edit' ? (
        <Button variant="ghost" size="sm" onClick={() => onDelete?.()} disabled={submitting}>
          Remove crew member
        </Button>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" onClick={handleSubmit} loading={submitting}>
          {mode === 'edit' ? 'Save changes' : 'Create crew member'}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal open={open} title={title} description={description} onClose={onClose} footer={footer} size="lg">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {formError ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{formError}</p> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="crew-full-name" label="Full name" error={errors.fullName}>
            <input
              id="crew-full-name"
              className="fx-text-input"
              value={form.fullName}
              onChange={handleChange('fullName')}
              required
            />
          </FormField>
          <FormField id="crew-role" label="Role / title" optionalLabel="Optional" error={errors.role}>
            <input id="crew-role" className="fx-text-input" value={form.role} onChange={handleChange('role')} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="crew-email" label="Email" optionalLabel="Optional" error={errors.email}>
            <input id="crew-email" type="email" className="fx-text-input" value={form.email} onChange={handleChange('email')} />
          </FormField>
          <FormField id="crew-phone" label="Phone" optionalLabel="Optional" error={errors.phone}>
            <input id="crew-phone" className="fx-text-input" value={form.phone} onChange={handleChange('phone')} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField id="crew-status" label="Status" error={errors.status}>
            <select id="crew-status" className="fx-select" value={form.status} onChange={handleChange('status')}>
              {statusOptions}
            </select>
          </FormField>
          <FormField id="crew-employment" label="Employment" error={errors.employmentType}>
            <select
              id="crew-employment"
              className="fx-select"
              value={form.employmentType}
              onChange={handleChange('employmentType')}
            >
              {employmentOptions}
            </select>
          </FormField>
          <FormField id="crew-timezone" label="Timezone" optionalLabel="Optional" error={errors.timezone}>
            <input id="crew-timezone" className="fx-text-input" value={form.timezone} onChange={handleChange('timezone')} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="crew-default-start" label="Default shift start" error={errors.defaultShiftStart}>
            <input
              id="crew-default-start"
              className="fx-text-input"
              type="time"
              value={form.defaultShiftStart}
              onChange={handleChange('defaultShiftStart')}
              required
            />
          </FormField>
          <FormField id="crew-default-end" label="Default shift end" error={errors.defaultShiftEnd}>
            <input
              id="crew-default-end"
              className="fx-text-input"
              type="time"
              value={form.defaultShiftEnd}
              onChange={handleChange('defaultShiftEnd')}
              required
            />
          </FormField>
        </div>
        <FormField
          id="crew-skills"
          label="Skills"
          optionalLabel="Comma separated"
          hint="Used for routing and standby matching"
          error={errors.skills}
        >
          <input id="crew-skills" className="fx-text-input" value={form.skills} onChange={handleChange('skills')} />
        </FormField>
        <FormField
          id="crew-allowed-roles"
          label="Roles allowed to manage"
          optionalLabel="Comma separated"
          hint="Restrict which provider roles can edit deployments or delegation for this crew"
          error={errors.allowedRoles}
        >
          <input
            id="crew-allowed-roles"
            className="fx-text-input"
            value={form.allowedRoles}
            onChange={handleChange('allowedRoles')}
          />
        </FormField>
        <FormField id="crew-notes" label="Notes" optionalLabel="Optional" error={errors.notes}>
          <textarea
            id="crew-notes"
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

CrewMemberModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  crewMember: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fullName: PropTypes.string,
    role: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    status: PropTypes.string,
    employmentType: PropTypes.string,
    timezone: PropTypes.string,
    defaultShiftStart: PropTypes.string,
    defaultShiftEnd: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
    notes: PropTypes.string,
    allowedRoles: PropTypes.arrayOf(PropTypes.string)
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func
};

CrewMemberModal.defaultProps = {
  crewMember: null,
  onDelete: undefined
};
