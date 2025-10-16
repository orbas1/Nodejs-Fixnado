import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ModalShell from './ModalShell.jsx';
import { InlineBanner, Field, TextInput, TextArea, SelectField, CheckboxField } from './FormControls.jsx';
import {
  disputeCaseTemplate,
  disputeStatusOptions,
  disputeSeverityOptions,
  disputeCategoryOptions
} from './constants.js';

const DisputeCaseModal = ({ open, disputeCase, onClose, onSubmit, onDelete, saving, status }) => {
  const [form, setForm] = useState(disputeCaseTemplate);

  useEffect(() => {
    if (disputeCase) {
      setForm({ ...disputeCaseTemplate, ...disputeCase });
    } else {
      setForm({ ...disputeCaseTemplate });
    }
  }, [disputeCase]);

  const handleChange = (field) => (value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleCheckbox = (field) => (value) => {
    setForm((previous) => ({ ...previous, [field]: Boolean(value) }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  const handleDeleteCase = () => {
    if (disputeCase?.id) {
      onDelete(disputeCase.id);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={form.id ? 'Edit dispute case' : 'Open dispute case'}
      description="Define ownership, escalation rules, and SLA details for this dispute."
      footer={[
        form.id ? (
          <button
            key="delete"
            type="button"
            onClick={handleDeleteCase}
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:border-rose-300"
            disabled={saving}
          >
            Remove case
          </button>
        ) : null,
        <button
          key="close"
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-primary hover:border-slate-300"
        >
          Cancel
        </button>,
        <button
          key="submit"
          type="submit"
          form="dispute-case-form"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
        >
          {saving ? 'Saving…' : form.id ? 'Update dispute case' : 'Create dispute case'}
        </button>
      ].filter(Boolean)}
    >
      <form id="dispute-case-form" className="space-y-4" onSubmit={handleSubmit}>
        <InlineBanner tone={status?.tone} message={status?.message} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="case-title" label="Case title" description="Visible across dashboards and reports.">
            <TextInput id="case-title" value={form.title} onChange={handleChange('title')} placeholder="Deposit dispute for booking #1827" />
          </Field>
          <Field id="case-number" label="Case number" description="Optional override to align with external systems.">
            <TextInput id="case-number" value={form.caseNumber} onChange={handleChange('caseNumber')} placeholder="D-2025-042" />
          </Field>
          <Field id="case-status" label="Status">
            <SelectField id="case-status" value={form.status} onChange={handleChange('status')} options={disputeStatusOptions} />
          </Field>
          <Field id="case-severity" label="Severity">
            <SelectField id="case-severity" value={form.severity} onChange={handleChange('severity')} options={disputeSeverityOptions} />
          </Field>
          <Field id="case-category" label="Category">
            <SelectField id="case-category" value={form.category} onChange={handleChange('category')} options={disputeCategoryOptions} />
          </Field>
          <Field id="case-currency" label="Currency">
            <TextInput id="case-currency" value={form.currency} onChange={handleChange('currency')} placeholder="GBP" />
          </Field>
          <Field id="case-amount" label="Amount in dispute" description="Numeric value, optional.">
            <TextInput
              id="case-amount"
              type="number"
              step="0.01"
              value={form.amountDisputed}
              onChange={handleChange('amountDisputed')}
              placeholder="250.00"
            />
          </Field>
          <Field id="case-disputeId" label="Platform dispute ID" description="Link to platform dispute where applicable.">
            <TextInput id="case-disputeId" value={form.disputeId} onChange={handleChange('disputeId')} placeholder="UUID" />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field id="case-openedAt" label="Opened at">
            <TextInput id="case-openedAt" type="datetime-local" value={form.openedAt} onChange={handleChange('openedAt')} />
          </Field>
          <Field id="case-dueAt" label="Next due">
            <TextInput id="case-dueAt" type="datetime-local" value={form.dueAt} onChange={handleChange('dueAt')} />
          </Field>
          <Field id="case-slaDueAt" label="SLA deadline">
            <TextInput id="case-slaDueAt" type="datetime-local" value={form.slaDueAt} onChange={handleChange('slaDueAt')} />
          </Field>
          <Field id="case-resolvedAt" label="Resolved at">
            <TextInput id="case-resolvedAt" type="datetime-local" value={form.resolvedAt} onChange={handleChange('resolvedAt')} />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field id="case-assignedTeam" label="Assigned team">
            <TextInput id="case-assignedTeam" value={form.assignedTeam} onChange={handleChange('assignedTeam')} placeholder="Finance escalation" />
          </Field>
          <Field id="case-assignedOwner" label="Primary owner">
            <TextInput id="case-assignedOwner" value={form.assignedOwner} onChange={handleChange('assignedOwner')} placeholder="Priya Kapoor" />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field id="case-nextStep" label="Immediate next step" description="Surface the next action for the team.">
            <TextInput id="case-nextStep" value={form.nextStep} onChange={handleChange('nextStep')} placeholder="Await provider statement" />
          </Field>
          <Field id="case-externalRef" label="External reference">
            <TextInput id="case-externalRef" value={form.externalReference} onChange={handleChange('externalReference')} placeholder="Zendesk-1345" />
          </Field>
        </div>

        <div className="grid gap-4">
          <Field id="case-summary" label="Case summary" description="Short context for finance and compliance teams.">
            <TextArea id="case-summary" rows={3} value={form.summary} onChange={handleChange('summary')} placeholder="Guest disputes damage deposit citing pre-existing scratch on door." />
          </Field>
          <Field id="case-resolutionNotes" label="Resolution notes" description="Document final decision, refunds, or adjustments.">
            <TextArea id="case-resolutionNotes" rows={3} value={form.resolutionNotes} onChange={handleChange('resolutionNotes')} placeholder="Pending evidence review. Potential partial refund." />
          </Field>
        </div>

        <CheckboxField
          id="case-requiresFollowUp"
          checked={form.requiresFollowUp}
          onChange={handleCheckbox('requiresFollowUp')}
          label="Requires manual follow-up"
          description="Flag for compliance or finance to review before closure."
        />
      </form>
    </ModalShell>
  );
};

DisputeCaseModal.propTypes = {
  open: PropTypes.bool.isRequired,
  disputeCase: PropTypes.shape({
    id: PropTypes.string,
    caseNumber: PropTypes.string,
    disputeId: PropTypes.string,
    title: PropTypes.string,
    category: PropTypes.string,
    status: PropTypes.string,
    severity: PropTypes.string,
    summary: PropTypes.string,
    nextStep: PropTypes.string,
    assignedTeam: PropTypes.string,
    assignedOwner: PropTypes.string,
    resolutionNotes: PropTypes.string,
    externalReference: PropTypes.string,
    amountDisputed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    openedAt: PropTypes.string,
    dueAt: PropTypes.string,
    resolvedAt: PropTypes.string,
    slaDueAt: PropTypes.string,
    requiresFollowUp: PropTypes.bool,
    lastReviewedAt: PropTypes.string
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  status: PropTypes.shape({
    tone: PropTypes.string,
    message: PropTypes.string
  })
};

DisputeCaseModal.defaultProps = {
  disputeCase: null,
  saving: false,
  status: null
};

export default DisputeCaseModal;
