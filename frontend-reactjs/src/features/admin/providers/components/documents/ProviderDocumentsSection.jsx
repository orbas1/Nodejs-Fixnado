import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  FormField,
  Spinner,
  StatusPill,
  TextInput
} from '../../../../../components/ui/index.js';
import DocumentUploadForm from './DocumentUploadForm.jsx';
import DocumentReviewDialog from './DocumentReviewDialog.jsx';

function formatStatusLabel(status) {
  if (!status) {
    return 'Unknown';
  }
  return status.replace(/_/g, ' ');
}

function resolveTone(status) {
  switch (status) {
    case 'approved':
      return 'success';
    case 'in_review':
    case 'submitted':
      return 'warning';
    case 'expired':
    case 'rejected':
    case 'suspended':
      return 'danger';
    default:
      return 'neutral';
  }
}

function formatDate(value, { withTime = false } = {}) {
  if (!value) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return withTime ? date.toLocaleString() : date.toLocaleDateString();
}

export default function ProviderDocumentsSection({
  companyId,
  company,
  documents,
  handlers,
  links
}) {
  const {
    onFetchComplianceSummary,
    onSubmitComplianceDocument,
    onReviewComplianceDocument,
    onEvaluateCompliance,
    onToggleComplianceBadge,
    onSuspendCompliance
  } = handlers ?? {};

  const [summary, setSummary] = useState({ application: null, documents: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [uploadState, setUploadState] = useState({ submitting: false, error: null });
  const [reviewState, setReviewState] = useState({ open: false, document: null, submitting: false, error: null });
  const [evaluating, setEvaluating] = useState(false);
  const [badgeState, setBadgeState] = useState({ loading: false, error: null });
  const [suspensionForm, setSuspensionForm] = useState({ reason: '', metadata: '', submitting: false, error: null });

  useEffect(() => {
    if (!companyId || !onFetchComplianceSummary) {
      setSummary({ application: null, documents: [] });
      return;
    }
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    onFetchComplianceSummary(companyId, { signal: controller.signal })
      .then((data) => {
        if (!active) return;
        setSummary(data ?? { application: null, documents: [] });
      })
      .catch((err) => {
        if (!active || err?.name === 'AbortError') return;
        setError(err?.message ?? 'Unable to load compliance summary');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [companyId, onFetchComplianceSummary]);

  const refreshSummary = useCallback(async () => {
    if (!companyId || !onFetchComplianceSummary) {
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await onFetchComplianceSummary(companyId);
      setSummary(data ?? { application: null, documents: [] });
      return data;
    } catch (err) {
      setError(err?.message ?? 'Unable to load compliance summary');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [companyId, onFetchComplianceSummary]);

  const documentTypeOptions = useMemo(() => {
    const required = summary.application?.requiredDocuments ?? [];
    if (!required.length) {
      return [
        { value: 'insurance_certificate', label: 'Insurance certificate' },
        { value: 'public_liability', label: 'Public liability cover' },
        { value: 'identity_verification', label: 'Identity verification' }
      ];
    }
    return required.map((entry) => ({
      value: entry.type,
      label: entry.label || formatStatusLabel(entry.type)
    }));
  }, [summary.application?.requiredDocuments]);

  const combinedDocuments = useMemo(() => {
    const detailMap = new Map((documents ?? []).map((doc) => [doc.id, doc]));
    const complianceDocs = summary.documents ?? [];
    if (!complianceDocs.length && detailMap.size === 0) {
      return [];
    }
    return complianceDocs.map((doc) => {
      const fallback = detailMap.get(doc.id) ?? {};
      return {
        ...fallback,
        ...doc,
        downloadUrl:
          doc.downloadUrl ||
          fallback.downloadUrl ||
          (doc.id ? `/api/v1/compliance/documents/${encodeURIComponent(doc.id)}/download` : null)
      };
    });
  }, [summary.documents, documents]);

  const requiredDocuments = summary.application?.requiredDocuments ?? [];

  const handleUpload = async (payload) => {
    if (!companyId || !onSubmitComplianceDocument) {
      return;
    }
    try {
      setUploadState({ submitting: true, error: null });
      await onSubmitComplianceDocument(companyId, payload);
      setFeedback({ tone: 'success', message: 'Document uploaded successfully' });
      setUploadState({ submitting: false, error: null });
      await refreshSummary();
    } catch (err) {
      setUploadState({ submitting: false, error: err?.message ?? 'Unable to upload document' });
    }
  };

  const openReview = (doc) => {
    setReviewState({ open: true, document: doc, submitting: false, error: null });
  };

  const closeReview = () => {
    setReviewState({ open: false, document: null, submitting: false, error: null });
  };

  const submitReview = async (payload) => {
    if (!companyId || !reviewState.document || !onReviewComplianceDocument) {
      return;
    }
    try {
      setReviewState((current) => ({ ...current, submitting: true, error: null }));
      await onReviewComplianceDocument(companyId, reviewState.document.id, payload);
      setReviewState({ open: false, document: null, submitting: false, error: null });
      setFeedback({ tone: 'success', message: 'Review saved successfully' });
      await refreshSummary();
    } catch (err) {
      setReviewState((current) => ({ ...current, submitting: false, error: err?.message ?? 'Unable to review document' }));
    }
  };

  const handleEvaluate = async () => {
    if (!companyId || !onEvaluateCompliance) {
      return;
    }
    try {
      setEvaluating(true);
      await onEvaluateCompliance(companyId, {});
      setFeedback({ tone: 'success', message: 'Compliance status recalculated' });
      await refreshSummary();
    } catch (err) {
      setFeedback({ tone: 'danger', message: err?.message ?? 'Unable to evaluate compliance' });
    } finally {
      setEvaluating(false);
    }
  };

  const handleToggleBadge = async () => {
    if (!companyId || !onToggleComplianceBadge) {
      return;
    }
    const nextVisible = !(summary.application?.badgeEnabled ?? false);
    try {
      setBadgeState({ loading: true, error: null });
      await onToggleComplianceBadge(companyId, nextVisible);
      setFeedback({ tone: 'success', message: nextVisible ? 'Insured seller badge enabled' : 'Insured seller badge hidden' });
      await refreshSummary();
      setBadgeState({ loading: false, error: null });
    } catch (err) {
      setBadgeState({ loading: false, error: err?.message ?? 'Unable to update badge' });
    }
  };

  const handleSuspend = async () => {
    if (!companyId || !onSuspendCompliance) {
      return;
    }
    if (!suspensionForm.reason.trim()) {
      setSuspensionForm((current) => ({ ...current, error: 'Suspension reason is required' }));
      return;
    }

    let metadataPayload = undefined;
    if (suspensionForm.metadata.trim()) {
      try {
        metadataPayload = JSON.parse(suspensionForm.metadata);
      } catch (error) {
        setSuspensionForm((current) => ({
          ...current,
          error: `Metadata must be valid JSON${error?.message ? `: ${error.message}` : ''}`
        }));
        return;
      }
    }

    try {
      setSuspensionForm((current) => ({ ...current, submitting: true, error: null }));
      await onSuspendCompliance(companyId, {
        reason: suspensionForm.reason.trim(),
        metadata: metadataPayload
      });
      setFeedback({ tone: 'success', message: 'Provider compliance suspended' });
      setSuspensionForm({ reason: '', metadata: '', submitting: false, error: null });
      await refreshSummary();
    } catch (err) {
      setSuspensionForm((current) => ({
        ...current,
        submitting: false,
        error: err?.message ?? 'Unable to suspend provider compliance'
      }));
    }
  };

  const complianceStatus = summary.application?.status ?? company?.insuredSellerStatus ?? 'pending_documents';
  const complianceScore = summary.application?.complianceScore ?? company?.complianceScore ?? 0;
  const badgeVisible = summary.application?.badgeEnabled ?? company?.insuredSellerBadgeVisible ?? false;
  const expiresAt = summary.application?.expiresAt ?? company?.insuredSellerExpiresAt ?? null;

  return (
    <section id="provider-documents" className="space-y-6">
      <div className="rounded-2xl border border-accent/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-primary">Compliance & documents</h4>
            <p className="mt-1 text-sm text-slate-600">
              Govern required insurance, identity, and compliance evidence for this provider. Upload new evidence, review
              submissions, and manage the insured seller badge.
            </p>
            {links?.compliance ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => window.open(links.compliance, '_blank', 'noopener')}
              >
                Open full compliance workspace
              </Button>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Status</p>
              <div className="mt-2 flex items-center gap-2">
                <StatusPill tone={resolveTone(complianceStatus)}>{formatStatusLabel(complianceStatus)}</StatusPill>
                <span className="text-sm text-slate-500">Score: {complianceScore.toFixed(0)}%</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">Expiry: {formatDate(expiresAt)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" onClick={handleEvaluate} loading={evaluating} disabled={evaluating}>
                  Recalculate status
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={badgeVisible ? 'secondary' : 'ghost'}
                  loading={badgeState.loading}
                  disabled={badgeState.loading}
                  onClick={handleToggleBadge}
                >
                  {badgeVisible ? 'Hide insured badge' : 'Enable insured badge'}
                </Button>
              </div>
              {badgeState.error ? <p className="mt-2 text-xs text-rose-500">{badgeState.error}</p> : null}
            </div>
          </div>
        </div>
        {feedback ? (
          <div className="mt-4">
            <StatusPill tone={feedback.tone}>{feedback.message}</StatusPill>
          </div>
        ) : null}
        {error ? (
          <div className="mt-4">
            <StatusPill tone="danger">{error}</StatusPill>
          </div>
        ) : null}
        {loading ? (
          <div className="mt-6 flex items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div>
              <h5 className="text-sm font-semibold uppercase tracking-wide text-primary">Required documents</h5>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {requiredDocuments.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No compliance profile initialised yet. Upload the first document or recalculate status to populate the
                    requirements.
                  </p>
                ) : (
                  requiredDocuments.map((entry) => (
                    <div key={entry.type} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-sm font-semibold text-primary">{entry.label}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <StatusPill tone={resolveTone(entry.status)}>{formatStatusLabel(entry.status)}</StatusPill>
                        <span>Expiry: {formatDate(entry.expiryAt)}</span>
                      </div>
                      {entry.renewalDue ? (
                        <p className="mt-2 text-xs text-amber-600">Renewal due soon</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-semibold uppercase tracking-wide text-primary">Document library</h5>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
                  <thead className="bg-secondary/40 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Document</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Submitted</th>
                      <th className="px-3 py-2 text-left">Expiry</th>
                      <th className="px-3 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {combinedDocuments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-sm text-slate-500">
                          No compliance documents captured yet.
                        </td>
                      </tr>
                    ) : (
                      combinedDocuments.map((doc) => (
                        <tr key={doc.id}>
                          <td className="px-3 py-3">
                            <div className="font-medium text-primary">{formatStatusLabel(doc.type)}</div>
                            <div className="text-xs text-slate-500">{doc.fileName}</div>
                          </td>
                          <td className="px-3 py-3">
                            <StatusPill tone={resolveTone(doc.status)}>{formatStatusLabel(doc.status)}</StatusPill>
                            {doc.reviewerId ? (
                              <p className="mt-1 text-xs text-slate-500">Reviewer: {doc.reviewerId}</p>
                            ) : null}
                            {doc.rejectionReason ? (
                              <p className="mt-1 text-xs text-rose-500">{doc.rejectionReason}</p>
                            ) : null}
                          </td>
                          <td className="px-3 py-3">{formatDate(doc.submittedAt, { withTime: true })}</td>
                          <td className="px-3 py-3">{formatDate(doc.expiryAt)}</td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-2">
                              {doc.downloadUrl ? (
                                <Button
                                  type="button"
                                  size="xs"
                                  variant="ghost"
                                  onClick={() => window.open(doc.downloadUrl, '_blank', 'noopener')}
                                >
                                  Download
                                </Button>
                              ) : null}
                              <Button type="button" size="xs" variant="secondary" onClick={() => openReview(doc)}>
                                Review
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <h5 className="text-sm font-semibold uppercase tracking-wide text-primary">Upload new evidence</h5>
              <p className="mt-1 text-xs text-slate-500">
                Capture new insurance certificates, ID checks, or safety documents. Uploading automatically routes to the
                compliance review queue.
              </p>
              <div className="mt-4">
                <DocumentUploadForm
                  documentTypes={documentTypeOptions}
                  submitting={uploadState.submitting}
                  error={uploadState.error}
                  onSubmit={handleUpload}
                />
              </div>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4">
              <h5 className="text-sm font-semibold uppercase tracking-wide text-rose-600">Suspend compliance</h5>
              <p className="mt-1 text-xs text-rose-600">
                Suspend this provider when evidence is invalid or missing. Their insured badge will be removed until
                reinstated.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <FormField id="suspend-reason" label="Suspension reason">
                  <TextInput
                    id="suspend-reason"
                    value={suspensionForm.reason}
                    onChange={(event) =>
                      setSuspensionForm((current) => ({ ...current, reason: event.target.value, error: null }))
                    }
                  />
                </FormField>
                <FormField id="suspend-metadata" label="Metadata (JSON)" helper="Optional structured payload">
                  <textarea
                    id="suspend-metadata"
                    value={suspensionForm.metadata}
                    onChange={(event) =>
                      setSuspensionForm((current) => ({ ...current, metadata: event.target.value, error: null }))
                    }
                    rows={1}
                    className="h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none"
                  />
                </FormField>
              </div>
              {suspensionForm.error ? <p className="mt-2 text-xs text-rose-600">{suspensionForm.error}</p> : null}
              <div className="mt-3 flex items-center justify-end">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  loading={suspensionForm.submitting}
                  disabled={suspensionForm.submitting}
                  onClick={handleSuspend}
                >
                  Suspend provider
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <DocumentReviewDialog
        open={reviewState.open}
        document={reviewState.document}
        submitting={reviewState.submitting}
        error={reviewState.error}
        onClose={closeReview}
        onSubmit={submitReview}
      />
    </section>
  );
}

ProviderDocumentsSection.propTypes = {
  companyId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  company: PropTypes.shape({
    insuredSellerStatus: PropTypes.string,
    complianceScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    insuredSellerBadgeVisible: PropTypes.bool,
    insuredSellerExpiresAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  }),
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      type: PropTypes.string,
      status: PropTypes.string,
      fileName: PropTypes.string,
      submittedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      expiryAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      downloadUrl: PropTypes.string
    })
  ),
  handlers: PropTypes.shape({
    onFetchComplianceSummary: PropTypes.func,
    onSubmitComplianceDocument: PropTypes.func,
    onReviewComplianceDocument: PropTypes.func,
    onEvaluateCompliance: PropTypes.func,
    onToggleComplianceBadge: PropTypes.func,
    onSuspendCompliance: PropTypes.func
  }),
  links: PropTypes.shape({
    compliance: PropTypes.string
  })
};

ProviderDocumentsSection.defaultProps = {
  companyId: null,
  company: null,
  documents: [],
  handlers: {},
  links: null
};
