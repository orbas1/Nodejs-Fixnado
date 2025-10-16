import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../../components/ui/Modal.jsx';
import Button from '../../../../components/ui/Button.jsx';
import FormField from '../../../../components/ui/FormField.jsx';

const delegationStatuses = [
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'expired', label: 'Expired' },
  { value: 'revoked', label: 'Revoked' }
];

function toDateTimeInput(value) {
  if (!value) return '';
  try {
    return new Date(value).toISOString().slice(0, 16);
  } catch (error) {
    return '';
  }
}

function fromDateTimeInput(value) {
  if (!value) return undefined;
  try {
    return new Date(value).toISOString();
  } catch (error) {
    return undefined;
  }
}

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

export default function DelegationModal({
  open,
  mode,
  delegation,
  crewMembers,
  initialCrewMemberId,
  onClose,
  onSubmit,
  onDelete
}) {
  const [form, setForm] = useState({
    crewMemberId: '',
    delegateName: '',
    delegateEmail: '',
    delegatePhone: '',
    role: '',
    status: 'active',
    scope: '',
    startAt: '',
    endAt: '',
    notes: '',
    allowedRoles: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (delegation) {
      setForm({
        crewMemberId: delegation.crewMemberId || initialCrewMemberId || '',
        delegateName: delegation.delegateName || '',
        delegateEmail: delegation.delegateEmail || '',
        delegatePhone: delegation.delegatePhone || '',
        role: delegation.role || '',
        status: delegation.status || 'active',
        scope: delegation.scope?.join(', ') || '',
        startAt: toDateTimeInput(delegation.startAt),
        endAt: toDateTimeInput(delegation.endAt),
        notes: delegation.notes || '',
        allowedRoles: delegation.allowedRoles?.join(', ') || ''
      });
    } else {
      setForm({
        crewMemberId: initialCrewMemberId || '',
        delegateName: '',
        delegateEmail: '',
        delegatePhone: '',
        role: '',
        status: 'active',
        scope: '',
        startAt: '',
        endAt: '',
        notes: '',
        allowedRoles: ''
      });
    }
    setErrors({});
    setSubmitting(false);
    setFormError(null);
  }, [open, delegation, initialCrewMemberId]);

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
      crewMemberId: form.crewMemberId || undefined,
      delegateName: form.delegateName.trim(),
      delegateEmail: form.delegateEmail.trim() || undefined,
      delegatePhone: form.delegatePhone.trim() || undefined,
      role: form.role.trim() || undefined,
      status: form.status,
      scope: normaliseList(form.scope),
      startAt: fromDateTimeInput(form.startAt),
      endAt: fromDateTimeInput(form.endAt),
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
      setFormError(error.message || 'Unable to save delegation.');
      setSubmitting(false);
    }
  };

  const footer = (
    <div className="flex flex-wrap justify-between gap-2">
      {mode === 'edit' ? (
        <Button variant="ghost" size="sm" onClick={() => onDelete?.()} disabled={submitting}>
          Remove delegation
        </Button>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" onClick={handleSubmit} loading={submitting}>
          {mode === 'edit' ? 'Save changes' : 'Add delegation'}
        </Button>
      </div>
    </div>
  );

  const title = mode === 'edit' ? 'Edit delegation' : 'Add delegation';
  const description =
    mode === 'edit'
      ? 'Update delegate contact details, scope, or timing window.'
      : 'Assign a delegate to cover approvals, communications, or rota management.';

  return (
    <Modal open={open} title={title} description={description} onClose={onClose} footer={footer}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {formError ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{formError}</p> : null}
        <FormField id="delegation-crew" label="Linked crew member" optionalLabel="Optional" error={errors.crewMemberId}>
          <select
            id="delegation-crew"
            className="fx-select"
            value={form.crewMemberId}
            onChange={handleChange('crewMemberId')}
          >
            <option value="">General access</option>
            {crewOptions}
          </select>
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="delegation-name" label="Delegate name" error={errors.delegateName}>
            <input
              id="delegation-name"
              className="fx-text-input"
              value={form.delegateName}
              onChange={handleChange('delegateName')}
              required
            />
          </FormField>
          <FormField id="delegation-role" label="Delegate role" optionalLabel="Optional" error={errors.role}>
            <input id="delegation-role" className="fx-text-input" value={form.role} onChange={handleChange('role')} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="delegation-email" label="Delegate email" optionalLabel="Optional" error={errors.delegateEmail}>
            <input
              id="delegation-email"
              type="email"
              className="fx-text-input"
              value={form.delegateEmail}
              onChange={handleChange('delegateEmail')}
            />
          </FormField>
          <FormField id="delegation-phone" label="Delegate phone" optionalLabel="Optional" error={errors.delegatePhone}>
            <input id="delegation-phone" className="fx-text-input" value={form.delegatePhone} onChange={handleChange('delegatePhone')} />
          </FormField>
        </div>
        <FormField id="delegation-status" label="Status" error={errors.status}>
          <select id="delegation-status" className="fx-select" value={form.status} onChange={handleChange('status')}>
            {delegationStatuses.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          id="delegation-scope"
          label="Scope"
          optionalLabel="Comma separated"
          hint="Examples: approvals, communications, rota"
          error={errors.scope}
        >
          <input id="delegation-scope" className="fx-text-input" value={form.scope} onChange={handleChange('scope')} />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="delegation-start" label="Start" optionalLabel="Optional" error={errors.startAt}>
            <input
              id="delegation-start"
              className="fx-text-input"
              type="datetime-local"
              value={form.startAt}
              onChange={handleChange('startAt')}
            />
          </FormField>
          <FormField id="delegation-end" label="End" optionalLabel="Optional" error={errors.endAt}>
            <input
              id="delegation-end"
              className="fx-text-input"
              type="datetime-local"
              value={form.endAt}
              onChange={handleChange('endAt')}
            />
          </FormField>
        </div>
        <FormField
          id="delegation-allowed-roles"
          label="Roles allowed to manage"
          optionalLabel="Comma separated"
          error={errors.allowedRoles}
        >
          <input
            id="delegation-allowed-roles"
            className="fx-text-input"
            value={form.allowedRoles}
            onChange={handleChange('allowedRoles')}
          />
        </FormField>
        <FormField id="delegation-notes" label="Notes" optionalLabel="Optional" error={errors.notes}>
          <textarea
            id="delegation-notes"
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

DelegationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  delegation: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    crewMemberId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    delegateName: PropTypes.string,
    delegateEmail: PropTypes.string,
    delegatePhone: PropTypes.string,
    role: PropTypes.string,
    status: PropTypes.string,
    scope: PropTypes.arrayOf(PropTypes.string),
    startAt: PropTypes.string,
    endAt: PropTypes.string,
    notes: PropTypes.string,
    allowedRoles: PropTypes.arrayOf(PropTypes.string)
  }),
  crewMembers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      fullName: PropTypes.string.isRequired
    })
  ).isRequired,
  initialCrewMemberId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func
};

DelegationModal.defaultProps = {
  delegation: null,
  initialCrewMemberId: '',
  onDelete: undefined
};
