import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../../components/ui/Button.jsx';
import TaxSideSheet from './TaxSideSheet.jsx';

const emptyDocument = () => ({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()), title: '', fileUrl: '', documentType: 'evidence' });

const defaultFilingDraft = {
  id: null,
  taxYear: '',
  period: '',
  filingType: 'self_assessment',
  submissionMethod: 'online',
  status: 'draft',
  dueAt: '',
  submittedAt: '',
  amountDue: '',
  amountPaid: '',
  currency: 'GBP',
  reference: '',
  notes: '',
  documents: []
};

export default function TaxFilingDrawer({ open, filing, metadata, onClose, onSubmit, onDelete, saving, canEdit }) {
  const [draft, setDraft] = useState(defaultFilingDraft);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      const nextDraft = filing
        ? {
            id: filing.id ?? null,
            taxYear: filing.taxYear ?? '',
            period: filing.period ?? '',
            filingType: filing.filingType ?? 'self_assessment',
            submissionMethod: filing.submissionMethod ?? 'online',
            status: filing.status ?? 'draft',
            dueAt: filing.dueAt ? filing.dueAt.slice(0, 10) : '',
            submittedAt: filing.submittedAt ? filing.submittedAt.slice(0, 10) : '',
            amountDue: filing.amountDue != null ? String(filing.amountDue) : '',
            amountPaid: filing.amountPaid != null ? String(filing.amountPaid) : '',
            currency: filing.currency ?? 'GBP',
            reference: filing.reference ?? '',
            notes: filing.notes ?? '',
            documents: Array.isArray(filing.documents)
              ? filing.documents.map((doc) => ({
                  id: doc.id ?? emptyDocument().id,
                  title: doc.title ?? '',
                  fileUrl: doc.fileUrl ?? '',
                  documentType: doc.documentType ?? 'evidence'
                }))
              : []
          }
        : { ...defaultFilingDraft };
      setDraft(nextDraft);
      setError(null);
    }
  }, [filing, open]);

  const filingTypeOptions = useMemo(() => {
    const types = metadata?.filingTypes?.length ? metadata.filingTypes : ['self_assessment', 'vat_return', 'cis', 'payroll', 'other'];
    return types.map((type) => ({ value: type, label: type.replace(/_/g, ' ') }));
  }, [metadata?.filingTypes]);

  const filingStatusOptions = useMemo(() => {
    const statuses = metadata?.filingStatuses?.length
      ? metadata.filingStatuses
      : ['draft', 'pending', 'submitted', 'accepted', 'overdue', 'rejected', 'cancelled'];
    return statuses.map((status) => ({ value: status, label: status.replace(/_/g, ' ') }));
  }, [metadata?.filingStatuses]);

  const submissionMethodOptions = useMemo(() => {
    const methods = metadata?.submissionMethods?.length
      ? metadata.submissionMethods
      : ['online', 'paper', 'agent', 'api', 'other'];
    return methods.map((method) => ({ value: method, label: method.replace(/_/g, ' ') }));
  }, [metadata?.submissionMethods]);

  const documentTypeOptions = useMemo(() => {
    const types = metadata?.documentTypes?.length
      ? metadata.documentTypes
      : ['evidence', 'receipt', 'correspondence', 'certificate', 'other'];
    return types.map((type) => ({ value: type, label: type.replace(/_/g, ' ') }));
  }, [metadata?.documentTypes]);

  const handleFieldChange = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleDocumentChange = (id, field, value) => {
    setDraft((current) => ({
      ...current,
      documents: current.documents.map((doc) => (doc.id === id ? { ...doc, [field]: value } : doc))
    }));
  };

  const handleDocumentAdd = () => {
    setDraft((current) => ({ ...current, documents: [...current.documents, emptyDocument()] }));
  };

  const handleDocumentRemove = (id) => {
    setDraft((current) => ({ ...current, documents: current.documents.filter((doc) => doc.id !== id) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!draft.taxYear.trim()) {
      setError('Tax year is required');
      return;
    }
    try {
      await onSubmit(draft);
      setError(null);
    } catch (caught) {
      setError(caught?.message ?? 'Failed to save filing');
    }
  };

  const footer = (
    <div className="flex flex-wrap justify-between gap-3">
      <div className="text-sm text-slate-500">
        Fields marked as optional can be completed later. Amounts should be entered in the filing currency.
      </div>
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
        <Button type="submit" form="serviceman-tax-filing-form" disabled={!canEdit || saving}>
          {saving ? 'Saving…' : 'Save filing'}
        </Button>
      </div>
    </div>
  );

  return (
    <TaxSideSheet
      open={open}
      title={draft.id ? 'Edit filing' : 'Create filing'}
      description="Capture tax obligations, remittance amounts, and supporting evidence."
      onClose={onClose}
      footer={footer}
    >
      <form id="serviceman-tax-filing-form" className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tax year *</span>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.taxYear}
              onChange={(event) => handleFieldChange('taxYear', event.target.value)}
              placeholder="2024/25"
              required
              disabled={!canEdit || saving}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filing period</span>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.period}
              onChange={(event) => handleFieldChange('period', event.target.value)}
              placeholder="Q1"
              disabled={!canEdit || saving}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filing type</span>
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.filingType}
              onChange={(event) => handleFieldChange('filingType', event.target.value)}
              disabled={!canEdit || saving}
            >
              {filingTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submission method</span>
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.submissionMethod}
              onChange={(event) => handleFieldChange('submissionMethod', event.target.value)}
              disabled={!canEdit || saving}
            >
              {submissionMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
              {filingStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Due date</span>
            <input
              type="date"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.dueAt}
              onChange={(event) => handleFieldChange('dueAt', event.target.value)}
              disabled={!canEdit || saving}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted</span>
            <input
              type="date"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.submittedAt}
              onChange={(event) => handleFieldChange('submittedAt', event.target.value)}
              disabled={!canEdit || saving}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount due</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.amountDue}
              onChange={(event) => handleFieldChange('amountDue', event.target.value)}
              placeholder="0.00"
              disabled={!canEdit || saving}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount paid</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.amountPaid}
              onChange={(event) => handleFieldChange('amountPaid', event.target.value)}
              placeholder="0.00"
              disabled={!canEdit || saving}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Currency</span>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 uppercase tracking-wide text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              maxLength={3}
              value={draft.currency}
              onChange={(event) => handleFieldChange('currency', event.target.value.toUpperCase())}
              placeholder="GBP"
              disabled={!canEdit || saving}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reference</span>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={draft.reference}
              onChange={(event) => handleFieldChange('reference', event.target.value)}
              placeholder="Submission reference"
              disabled={!canEdit || saving}
            />
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
          <textarea
            rows={4}
            className="rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={draft.notes}
            onChange={(event) => handleFieldChange('notes', event.target.value)}
            placeholder="Internal commentary, HMRC correspondence, escalation instructions."
            disabled={!canEdit || saving}
          />
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Supporting documents</h3>
              <p className="text-xs text-slate-500">Attach receipts, statements, and correspondence for audit readiness.</p>
            </div>
            <Button type="button" variant="ghost" onClick={handleDocumentAdd} disabled={!canEdit || saving}>
              Add document
            </Button>
          </div>
          {draft.documents.length ? (
            <div className="space-y-4">
              {draft.documents.map((document) => (
                <div key={document.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Title
                      <input
                        className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                        value={document.title}
                        onChange={(event) => handleDocumentChange(document.id, 'title', event.target.value)}
                        disabled={!canEdit || saving}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      URL
                      <input
                        className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                        value={document.fileUrl}
                        onChange={(event) => handleDocumentChange(document.id, 'fileUrl', event.target.value)}
                        placeholder="https://…"
                        disabled={!canEdit || saving}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Document type
                      <select
                        className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                        value={document.documentType}
                        onChange={(event) => handleDocumentChange(document.id, 'documentType', event.target.value)}
                        disabled={!canEdit || saving}
                      >
                        {documentTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-rose-600 hover:text-rose-700"
                      onClick={() => handleDocumentRemove(document.id)}
                      disabled={!canEdit || saving}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 py-6 text-sm text-slate-500">
              No documents attached yet. Add evidence to build a full audit trail.
            </p>
          )}
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </form>
    </TaxSideSheet>
  );
}

TaxFilingDrawer.propTypes = {
  open: PropTypes.bool,
  filing: PropTypes.object,
  metadata: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  saving: PropTypes.bool,
  canEdit: PropTypes.bool
};

TaxFilingDrawer.defaultProps = {
  open: false,
  filing: null,
  metadata: {},
  onDelete: null,
  saving: false,
  canEdit: true
};
