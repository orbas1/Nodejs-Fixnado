import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../../components/ui/Modal.jsx';
import Button from '../../../../components/ui/Button.jsx';
import FormField from '../../../../components/ui/FormField.jsx';

const assignmentTypes = [
  { value: 'booking', label: 'Booking' },
  { value: 'project', label: 'Project' },
  { value: 'standby', label: 'Standby' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'training', label: 'Training' },
  { value: 'support', label: 'Support' }
];

const deploymentStatuses = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'on_hold', label: 'On hold' }
];

function toDateTimeInput(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    return `${date.toISOString().slice(0, 16)}`;
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

export default function DeploymentModal({
  open,
  mode,
  deployment,
  crewMembers,
  initialCrewMemberId,
  onClose,
  onSubmit,
  onDelete
}) {
  const [form, setForm] = useState({
    crewMemberId: '',
    title: '',
    assignmentType: 'booking',
    referenceId: '',
    startAt: '',
    endAt: '',
    location: '',
    status: 'scheduled',
    notes: '',
    allowedRoles: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (deployment) {
      setForm({
        crewMemberId: deployment.crewMemberId || initialCrewMemberId || '',
        title: deployment.title || '',
        assignmentType: deployment.assignmentType || 'booking',
        referenceId: deployment.referenceId || '',
        startAt: toDateTimeInput(deployment.startAt),
        endAt: toDateTimeInput(deployment.endAt),
        location: deployment.location || '',
        status: deployment.status || 'scheduled',
        notes: deployment.notes || '',
        allowedRoles: deployment.allowedRoles?.join(', ') || ''
      });
    } else {
      setForm({
        crewMemberId: initialCrewMemberId || '',
        title: '',
        assignmentType: 'booking',
        referenceId: '',
        startAt: '',
        endAt: '',
        location: '',
        status: 'scheduled',
        notes: '',
        allowedRoles: ''
      });
    }
    setErrors({});
    setFormError(null);
    setSubmitting(false);
  }, [open, deployment, initialCrewMemberId]);

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
      title: form.title.trim(),
      assignmentType: form.assignmentType,
      referenceId: form.referenceId.trim() || undefined,
      startAt: fromDateTimeInput(form.startAt),
      endAt: fromDateTimeInput(form.endAt),
      location: form.location.trim() || undefined,
      status: form.status,
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
      setFormError(error.message || 'Unable to save deployment.');
      setSubmitting(false);
    }
  };

  const footer = (
    <div className="flex flex-wrap justify-between gap-2">
      {mode === 'edit' ? (
        <Button variant="ghost" size="sm" onClick={() => onDelete?.()} disabled={submitting}>
          Remove deployment
        </Button>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" onClick={handleSubmit} loading={submitting}>
          {mode === 'edit' ? 'Save changes' : 'Schedule deployment'}
        </Button>
      </div>
    </div>
  );

  const title = mode === 'edit' ? 'Edit deployment' : 'Schedule deployment';
  const description =
    mode === 'edit'
      ? 'Update timings, location, or notes for this deployment window.'
      : 'Assign a crew member to a deployment window with timing and access scope.';

  return (
    <Modal open={open} title={title} description={description} onClose={onClose} footer={footer} size="lg">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {formError ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{formError}</p> : null}
        <FormField id="deployment-crew" label="Crew member" error={errors.crewMemberId}>
          <select
            id="deployment-crew"
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
        <FormField id="deployment-title" label="Deployment name" error={errors.title}>
          <input
            id="deployment-title"
            className="fx-text-input"
            value={form.title}
            onChange={handleChange('title')}
            required
          />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="deployment-assignment" label="Assignment type" error={errors.assignmentType}>
            <select
              id="deployment-assignment"
              className="fx-select"
              value={form.assignmentType}
              onChange={handleChange('assignmentType')}
            >
              {assignmentTypes.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="deployment-status" label="Status" error={errors.status}>
            <select id="deployment-status" className="fx-select" value={form.status} onChange={handleChange('status')}>
              {deploymentStatuses.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="deployment-start" label="Start" error={errors.startAt}>
            <input
              id="deployment-start"
              className="fx-text-input"
              type="datetime-local"
              value={form.startAt}
              onChange={handleChange('startAt')}
              required
            />
          </FormField>
          <FormField id="deployment-end" label="End" optionalLabel="Optional" error={errors.endAt}>
            <input
              id="deployment-end"
              className="fx-text-input"
              type="datetime-local"
              value={form.endAt}
              onChange={handleChange('endAt')}
            />
          </FormField>
        </div>
        <FormField id="deployment-location" label="Location" optionalLabel="Optional" error={errors.location}>
          <input
            id="deployment-location"
            className="fx-text-input"
            value={form.location}
            onChange={handleChange('location')}
          />
        </FormField>
        <FormField id="deployment-reference" label="Reference" optionalLabel="Optional" error={errors.referenceId}>
          <input
            id="deployment-reference"
            className="fx-text-input"
            value={form.referenceId}
            onChange={handleChange('referenceId')}
          />
        </FormField>
        <FormField
          id="deployment-allowed-roles"
          label="Roles allowed to manage"
          optionalLabel="Comma separated"
          error={errors.allowedRoles}
        >
          <input
            id="deployment-allowed-roles"
            className="fx-text-input"
            value={form.allowedRoles}
            onChange={handleChange('allowedRoles')}
          />
        </FormField>
        <FormField id="deployment-notes" label="Notes" optionalLabel="Optional" error={errors.notes}>
          <textarea
            id="deployment-notes"
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

DeploymentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  deployment: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    crewMemberId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    assignmentType: PropTypes.string,
    referenceId: PropTypes.string,
    startAt: PropTypes.string,
    endAt: PropTypes.string,
    location: PropTypes.string,
    status: PropTypes.string,
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

DeploymentModal.defaultProps = {
  deployment: null,
  initialCrewMemberId: '',
  onDelete: undefined
};
