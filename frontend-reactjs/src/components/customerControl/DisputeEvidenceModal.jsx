import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ModalShell from './ModalShell.jsx';
import { InlineBanner, Field, TextInput, TextArea } from './FormControls.jsx';
import { disputeEvidenceTemplate } from './constants.js';

const isValidHttpUrl = (value) => {
  if (!value) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol.startsWith('http');
  } catch {
    return false;
  }
};

const DisputeEvidenceModal = ({ open, evidence, onClose, onSubmit, saving, status }) => {
  const [form, setForm] = useState(disputeEvidenceTemplate);

  useEffect(() => {
    if (evidence) {
      setForm({ ...disputeEvidenceTemplate, ...evidence });
    } else {
      setForm({ ...disputeEvidenceTemplate });
    }
  }, [evidence]);

  const handleChange = (field) => (value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  const openExternalLink = (url) => {
    if (!isValidHttpUrl(url)) {
      return;
    }
    window.open(url, '_blank', 'noopener');
  };

  const hasFileLink = useMemo(() => isValidHttpUrl(form.fileUrl), [form.fileUrl]);
  const hasThumbnailLink = useMemo(() => isValidHttpUrl(form.thumbnailUrl), [form.thumbnailUrl]);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={form.id ? 'Edit evidence item' : 'Add evidence item'}
      description={
        evidence?.caseTitle
          ? `Case: ${evidence.caseTitle}`
          : 'Attach supporting documents, media, or links for this dispute case.'
      }
      footer={[
        <button
          key="cancel"
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-primary hover:border-slate-300"
        >
          Cancel
        </button>,
        <button
          key="submit"
          type="submit"
          form="dispute-evidence-form"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
        >
          {saving ? 'Saving…' : form.id ? 'Update evidence' : 'Add evidence'}
        </button>
      ]}
    >
      <form id="dispute-evidence-form" className="space-y-4" onSubmit={handleSubmit}>
        <InlineBanner tone={status?.tone} message={status?.message} />
        <Field id="evidence-label" label="Display name" description="Visible to support and finance teams when reviewing the case.">
          <TextInput
            id="evidence-label"
            value={form.label}
            onChange={handleChange('label')}
            placeholder="Invoice from provider"
          />
        </Field>
        <Field
          id="evidence-fileUrl"
          label="File link"
          description="Paste a secure link to the document, folder, or media asset (https://)."
        >
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <TextInput
                id="evidence-fileUrl"
                type="url"
                value={form.fileUrl}
                onChange={handleChange('fileUrl')}
                placeholder="https://files.fixnado.com/disputes/receipt.pdf"
              />
              <button
                type="button"
                onClick={() => openExternalLink(form.fileUrl)}
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-primary hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                disabled={!hasFileLink}
              >
                Open link
              </button>
            </div>
            {!hasFileLink && form.fileUrl ? (
              <span className="text-xs font-medium text-rose-600">Enter a valid URL starting with http or https.</span>
            ) : null}
          </div>
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="evidence-fileType" label="File type" description="Short label such as PDF, image, audio, or video.">
            <TextInput
              id="evidence-fileType"
              value={form.fileType}
              onChange={handleChange('fileType')}
              placeholder="PDF"
            />
          </Field>
          <Field
            id="evidence-thumbnailUrl"
            label="Preview image"
            description="Optional image thumbnail that will show alongside the evidence."
          >
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <TextInput
                  id="evidence-thumbnailUrl"
                  type="url"
                  value={form.thumbnailUrl}
                  onChange={handleChange('thumbnailUrl')}
                  placeholder="https://files.fixnado.com/disputes/receipt-thumbnail.jpg"
                />
                <button
                  type="button"
                  onClick={() => openExternalLink(form.thumbnailUrl)}
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-primary hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  disabled={!hasThumbnailLink}
                >
                  Preview
                </button>
              </div>
              {!hasThumbnailLink && form.thumbnailUrl ? (
                <span className="text-xs font-medium text-rose-600">Enter a valid URL starting with http or https.</span>
              ) : null}
            </div>
          </Field>
        </div>
        <Field
          id="evidence-notes"
          label="Internal notes"
          description="Add any context about why this evidence matters or how to interpret it."
        >
          <TextArea
            id="evidence-notes"
            rows={3}
            value={form.notes}
            onChange={handleChange('notes')}
            placeholder="Provider uploaded the receipt on 30 March. Matches claim total."
          />
        </Field>
      </form>
    </ModalShell>
  );
};

DisputeEvidenceModal.propTypes = {
  open: PropTypes.bool.isRequired,
  evidence: PropTypes.shape({
    id: PropTypes.string,
    disputeCaseId: PropTypes.string,
    label: PropTypes.string,
    fileUrl: PropTypes.string,
    fileType: PropTypes.string,
    thumbnailUrl: PropTypes.string,
    notes: PropTypes.string,
    caseTitle: PropTypes.string
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  status: PropTypes.shape({ tone: PropTypes.string, message: PropTypes.string })
};

DisputeEvidenceModal.defaultProps = {
  evidence: null,
  saving: false,
  status: null
};

export default DisputeEvidenceModal;
