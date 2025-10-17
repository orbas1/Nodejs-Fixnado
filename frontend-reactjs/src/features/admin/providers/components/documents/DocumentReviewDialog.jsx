import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, FormField, Modal, StatusPill, TextInput } from '../../../../../components/ui/index.js';

function TextArea({ id, value, onChange, placeholder }) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={4}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none"
    />
  );
}

TextArea.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string
};

TextArea.defaultProps = {
  placeholder: ''
};

export default function DocumentReviewDialog({ open, document, submitting, error, onClose, onSubmit }) {
  const [decision, setDecision] = useState('approve');
  const [reason, setReason] = useState('');
  const [metadata, setMetadata] = useState('');
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDecision('approve');
    setReason('');
    setMetadata('');
    setLocalError(null);
  }, [open, document?.id]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setLocalError(null);

    if (decision === 'reject' && !reason.trim()) {
      setLocalError('Provide a rejection reason so teams know what to fix');
      return;
    }

    const payload = { decision };
    if (reason.trim()) {
      payload.reason = reason.trim();
    }
    if (metadata.trim()) {
      payload.metadata = metadata.trim();
    }

    onSubmit?.(payload);
  };

  const footer = (
    <div className="flex items-center justify-between gap-4">
      {(localError || error) && <StatusPill tone="danger">{localError || error}</StatusPill>}
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting} disabled={submitting}>
          {decision === 'approve' ? 'Approve document' : 'Reject document'}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={`Review ${document?.fileName ?? 'document'}`} size="lg" footer={null}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField id="review-decision" label="Decision">
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="review-decision"
                value="approve"
                checked={decision === 'approve'}
                onChange={() => setDecision('approve')}
                className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
              />
              Approve
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="review-decision"
                value="reject"
                checked={decision === 'reject'}
                onChange={() => setDecision('reject')}
                className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
              />
              Reject
            </label>
          </div>
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="review-issued" label="Submitted">
            <TextInput id="review-issued" readOnly value={document?.submittedAt ? new Date(document.submittedAt).toLocaleString() : '—'} />
          </FormField>
          <FormField id="review-expiry" label="Expires">
            <TextInput id="review-expiry" readOnly value={document?.expiryAt ? new Date(document.expiryAt).toLocaleDateString() : '—'} />
          </FormField>
        </div>
        <FormField
          id="review-reason"
          label="Decision notes"
          helper={decision === 'reject' ? 'Describe the deficiency or missing evidence so providers can resubmit.' : 'Optional message for audit trail.'}
        >
          <TextArea
            id="review-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={decision === 'reject' ? 'Please upload the updated insurance schedule showing renewal date.' : ''}
          />
        </FormField>
        <FormField
          id="review-metadata"
          label="Metadata"
          helper="Optional JSON payload for structured audit data (e.g. reviewer checklist, policy number, attachments)."
        >
          <TextArea
            id="review-metadata"
            value={metadata}
            onChange={(event) => setMetadata(event.target.value)}
            placeholder='{"checklist": ["Valid broker", "Expiry > 30 days"]}'
          />
        </FormField>
        {footer}
      </form>
    </Modal>
  );
}

DocumentReviewDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  document: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fileName: PropTypes.string,
    submittedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    expiryAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  }),
  submitting: PropTypes.bool,
  error: PropTypes.string,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func
};

DocumentReviewDialog.defaultProps = {
  document: null,
  submitting: false,
  error: null,
  onClose: undefined,
  onSubmit: undefined
};
