import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../components/ui/Modal.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Textarea from '../../../components/ui/Textarea.jsx';
import Button from '../../../components/ui/Button.jsx';

function AttachmentFields({ attachment, index, onChange, onRemove }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3">
      <TextInput
        label={`Attachment ${index + 1} label`}
        name="label"
        value={attachment.label}
        onChange={(event) => onChange(index, { ...attachment, label: event.target.value })}
      />
      <TextInput
        label="URL"
        name="url"
        value={attachment.url}
        onChange={(event) => onChange(index, { ...attachment, url: event.target.value })}
        placeholder="https://"
      />
      <div className="flex justify-end">
        <Button type="button" variant="secondary" size="sm" onClick={() => onRemove(index)}>
          Remove
        </Button>
      </div>
    </div>
  );
}

AttachmentFields.propTypes = {
  attachment: PropTypes.shape({
    label: PropTypes.string,
    url: PropTypes.string
  }).isRequired,
  index: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired
};

const DEFAULT_FORM = {
  amount: '',
  currency: 'GBP',
  message: '',
  attachments: []
};

export default function BidFormModal({ open, mode, job, initialValues, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({ ...DEFAULT_FORM, ...initialValues });
      setErrors({});
    }
  }, [initialValues, open]);

  const title = mode === 'edit' ? 'Update bid' : `Create bid for ${job?.title ?? 'custom job'}`;

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    return !errors.amount;
  }, [errors.amount, submitting]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleAttachmentChange = (index, attachment) => {
    setForm((current) => {
      const next = [...(current.attachments || [])];
      next[index] = attachment;
      return { ...current, attachments: next };
    });
  };

  const handleAddAttachment = () => {
    setForm((current) => ({
      ...current,
      attachments: [...(current.attachments || []), { label: '', url: '' }]
    }));
  };

  const handleRemoveAttachment = (index) => {
    setForm((current) => {
      const next = [...(current.attachments || [])];
      next.splice(index, 1);
      return { ...current, attachments: next };
    });
  };

  const validate = () => {
    const nextErrors = {};
    if (form.amount) {
      const parsed = Number.parseFloat(form.amount);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        nextErrors.amount = 'Enter a valid amount greater than zero.';
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    await onSubmit({
      amount: form.amount ? Number.parseFloat(form.amount) : null,
      currency: form.currency,
      message: form.message,
      attachments: (form.attachments || []).filter((attachment) => attachment.url?.trim())
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {job ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
            <p className="text-sm font-semibold text-primary">{job.title}</p>
            {job.description ? <p className="mt-1 text-xs text-slate-500">{job.description}</p> : null}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              {job.budgetLabel ? <span>Budget: {job.budgetLabel}</span> : null}
              {job.zone?.name ? <span>Zone: {job.zone.name}</span> : null}
              {job.bidDeadline ? <span>Deadline: {new Date(job.bidDeadline).toLocaleString()}</span> : null}
            </div>
          </div>
        ) : null}
        <TextInput
          label="Bid amount"
          prefix="£"
          placeholder="e.g. 1250"
          value={form.amount}
          onChange={(event) => handleChange('amount', event.target.value)}
          error={errors.amount}
          type="number"
          min="0"
          step="0.01"
        />
        <TextInput
          label="Currency"
          value={form.currency}
          onChange={(event) => handleChange('currency', event.target.value.toUpperCase())}
          maxLength={3}
        />
        <Textarea
          label="Supporting message"
          optionalLabel="Optional"
          rows={6}
          value={form.message}
          onChange={(event) => handleChange('message', event.target.value)}
        />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">Attachments</h4>
            <Button type="button" size="sm" variant="secondary" onClick={handleAddAttachment}>
              Add attachment
            </Button>
          </div>
          {(form.attachments || []).length === 0 ? (
            <p className="text-xs text-slate-500">Add supporting documents or media links if required.</p>
          ) : null}
          <div className="space-y-3">
            {(form.attachments || []).map((attachment, index) => (
              <AttachmentFields
                key={`attachment-${index}`}
                index={index}
                attachment={attachment}
                onChange={handleAttachmentChange}
                onRemove={handleRemoveAttachment}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit} loading={submitting}>
            {mode === 'edit' ? 'Save changes' : 'Submit bid'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

BidFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']),
  job: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    budgetLabel: PropTypes.string,
    zone: PropTypes.shape({ name: PropTypes.string }),
    bidDeadline: PropTypes.string
  }),
  initialValues: PropTypes.shape({
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    message: PropTypes.string,
    attachments: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        url: PropTypes.string
      })
    )
  }),
  onClose: PropTypes.func,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool
};

BidFormModal.defaultProps = {
  mode: 'create',
  job: null,
  initialValues: DEFAULT_FORM,
  onClose: () => {},
  submitting: false
};
