import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../../components/ui/Button.jsx';
import TaxSideSheet from './TaxSideSheet.jsx';

const defaultDocumentDraft = {
  id: null,
  title: '',
  documentType: 'evidence',
  status: 'active',
  fileUrl: '',
  thumbnailUrl: '',
  filingId: '',
  notes: ''
};

export default function TaxDocumentDrawer({ open, document, metadata, filings, onClose, onSubmit, onDelete, saving, canEdit }) {
  const [draft, setDraft] = useState(defaultDocumentDraft);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      const nextDraft = document
        ? {
            id: document.id ?? null,
            title: document.title ?? '',
            documentType: document.documentType ?? 'evidence',
            status: document.status ?? 'active',
            fileUrl: document.fileUrl ?? '',
            thumbnailUrl: document.thumbnailUrl ?? '',
            filingId: document.filingId ?? '',
            notes: document.notes ?? ''
          }
        : { ...defaultDocumentDraft };
      setDraft(nextDraft);
      setError(null);
    }
  }, [document, open]);

  const documentTypeOptions = useMemo(
    () => metadata?.documentTypes ?? ['evidence', 'receipt', 'correspondence', 'certificate', 'other'],
    [metadata?.documentTypes]
  );

  const statusOptions = useMemo(
    () => metadata?.documentStatuses ?? ['active', 'archived', 'superseded'],
    [metadata?.documentStatuses]
  );

  const filingOptions = useMemo(() => {
    const available = Array.isArray(filings) ? filings : [];
    return available.map((filing) => ({ value: filing.id, label: `${filing.taxYear} ${filing.period ? `- ${filing.period}` : ''}`.trim() }));
  }, [filings]);

  const handleFieldChange = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!draft.title.trim()) {
      setError('Document title is required');
      return;
    }
    if (!draft.fileUrl.trim()) {
      setError('Document URL is required');
      return;
    }
    try {
      await onSubmit(draft);
      setError(null);
    } catch (caught) {
      setError(caught?.message ?? 'Failed to save document');
    }
  };

  const footer = (
    <div className="flex flex-wrap justify-between gap-3">
      <div className="text-sm text-slate-500">Upload storage URLs and link documents to filings for instant retrieval.</div>
      <div className="flex flex-wrap gap-2">
        {draft.id && onDelete ? (
          <Button
            type="button"
            variant="ghost"
            className="text-rose-600 hover:text-rose-700"
            onClick={() => onDelete(draft)}
            disabled={!canEdit || saving}
          >
            Delete
          </Button>
        ) : null}
        <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" form="serviceman-tax-document-form" disabled={!canEdit || saving}>
          {saving ? 'Saving…' : 'Save document'}
        </Button>
      </div>
    </div>
  );

  return (
    <TaxSideSheet
      open={open}
      title={draft.id ? 'Edit document' : 'Add document'}
      description="Maintain evidence, receipts, and correspondence for compliance checks."
      onClose={onClose}
      footer={footer}
    >
      <form id="serviceman-tax-document-form" className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title *</span>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.title}
              onChange={(event) => handleFieldChange('title', event.target.value)}
              placeholder="Receipt - January VAT"
              disabled={!canEdit || saving}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</span>
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.documentType}
              onChange={(event) => handleFieldChange('documentType', event.target.value)}
              disabled={!canEdit || saving}
            >
              {documentTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.status}
              onChange={(event) => handleFieldChange('status', event.target.value)}
              disabled={!canEdit || saving}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Linked filing</span>
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.filingId}
              onChange={(event) => handleFieldChange('filingId', event.target.value)}
              disabled={!canEdit || saving}
            >
              <option value="">Not linked</option>
              {filingOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">File URL *</span>
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={draft.fileUrl}
            onChange={(event) => handleFieldChange('fileUrl', event.target.value)}
            placeholder="https://storage.fixnado.com/..."
            disabled={!canEdit || saving}
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Thumbnail URL</span>
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={draft.thumbnailUrl}
            onChange={(event) => handleFieldChange('thumbnailUrl', event.target.value)}
            placeholder="Optional preview image"
            disabled={!canEdit || saving}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
          <textarea
            rows={4}
            className="rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={draft.notes}
            onChange={(event) => handleFieldChange('notes', event.target.value)}
            placeholder="Context about what this document covers or verification checks completed."
            disabled={!canEdit || saving}
          />
        </label>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </form>
    </TaxSideSheet>
  );
}

TaxDocumentDrawer.propTypes = {
  open: PropTypes.bool,
  document: PropTypes.object,
  metadata: PropTypes.object,
  filings: PropTypes.array,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  saving: PropTypes.bool,
  canEdit: PropTypes.bool
};

TaxDocumentDrawer.defaultProps = {
  open: false,
  document: null,
  metadata: {},
  filings: [],
  onDelete: null,
  saving: false,
  canEdit: true
};
