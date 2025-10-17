import { useEffect, useMemo, useState } from 'react';
import Button from '../../../../components/ui/Button.jsx';
import Spinner from '../../../../components/ui/Spinner.jsx';
import { useServicemanTax } from '../ServicemanTaxProvider.jsx';
import TaxDocumentDrawer from './TaxDocumentDrawer.jsx';

const confirmAction = (message) => (typeof window === 'undefined' ? true : window.confirm(message));

export default function TaxDocumentsPanel() {
  const {
    documents,
    documentsLoading,
    documentsError,
    documentFilters,
    setDocumentFilters,
    loadDocuments,
    metadata,
    permissions,
    upsertDocument,
    removeDocument,
    filings
  } = useServicemanTax();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDocument, setActiveDocument] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const canManageDocuments = permissions?.canManageDocuments !== false;

  const typeOptions = useMemo(
    () => metadata?.documentTypes ?? ['evidence', 'receipt', 'correspondence', 'certificate', 'other'],
    [metadata?.documentTypes]
  );

  const statusOptions = useMemo(
    () => metadata?.documentStatuses ?? ['active', 'archived', 'superseded'],
    [metadata?.documentStatuses]
  );

  const handleCreate = () => {
    setActiveDocument(null);
    setDrawerOpen(true);
  };

  const handleEdit = (document) => {
    setActiveDocument(document);
    setDrawerOpen(true);
  };

  const handleClose = () => {
    setDrawerOpen(false);
    setActiveDocument(null);
    setActionError(null);
  };

  const handleSave = async (draft) => {
    setSaving(true);
    try {
      const payload = {
        id: draft.id ?? undefined,
        title: draft.title,
        documentType: draft.documentType,
        status: draft.status,
        fileUrl: draft.fileUrl,
        thumbnailUrl: draft.thumbnailUrl || null,
        filingId: draft.filingId || null,
        notes: draft.notes || null
      };
      await upsertDocument(payload);
      await loadDocuments();
      handleClose();
    } catch (error) {
      setActionError(error?.message ?? 'Failed to save document');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (draft) => {
    if (!draft?.id) return;
    if (!confirmAction('Delete this document?')) {
      return;
    }
    setSaving(true);
    try {
      await removeDocument(draft.id);
      await loadDocuments();
      handleClose();
    } catch (error) {
      setActionError(error?.message ?? 'Failed to delete document');
    } finally {
      setSaving(false);
    }
  };

  const items = documents?.items ?? [];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Tax documents</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Keep every piece of evidence centralised—receipts, correspondence, certificates, and statements. Attach documents to
            filings for fast audits and HMRC responses.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={handleCreate} disabled={!canManageDocuments}>
            Add document
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Filter by type
          <select
            className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={documentFilters.type}
            onChange={(event) => setDocumentFilters((current) => ({ ...current, type: event.target.value }))}
          >
            <option value="all">All types</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Filter by status
          <select
            className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={documentFilters.status}
            onChange={(event) => setDocumentFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-secondary text-primary">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Document</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Linked filing</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Updated</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10 text-slate-700">
            {documentsLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Spinner className="h-4 w-4 text-primary" /> Loading documents…
                  </div>
                </td>
              </tr>
            ) : null}
            {!documentsLoading && !items.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                  No documents captured yet.
                </td>
              </tr>
            ) : null}
            {items.map((document) => (
              <tr key={document.id} className="hover:bg-secondary/70">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {document.thumbnailUrl ? (
                      <img
                        src={document.thumbnailUrl}
                        alt="Document thumbnail"
                        className="h-12 w-12 rounded-xl object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg">
                        📄
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-primary">{document.title}</p>
                      <a
                        href={document.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Open file
                      </a>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">{document.documentType?.replace(/_/g, ' ') || '—'}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{document.status?.replace(/_/g, ' ') || '—'}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{document.filingId || 'Not linked'}</td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {document.updatedAt ? new Date(document.updatedAt).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="ghost" onClick={() => handleEdit(document)} disabled={!canManageDocuments}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-rose-600 hover:text-rose-700"
                      onClick={() => handleDelete(document)}
                      disabled={!canManageDocuments}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {documentsError ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {documentsError.message ?? 'Failed to load documents'}
        </div>
      ) : null}
      {actionError ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError}</div>
      ) : null}
      {!canManageDocuments ? (
        <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-400">You have read-only access to documents.</p>
      ) : null}

      <TaxDocumentDrawer
        open={drawerOpen}
        document={activeDocument}
        metadata={metadata}
        filings={filings?.items ?? []}
        onClose={handleClose}
        onSubmit={handleSave}
        onDelete={handleDelete}
        saving={saving}
        canEdit={canManageDocuments}
      />
    </section>
  );
}
