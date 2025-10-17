import { useEffect, useMemo, useState } from 'react';
import Button from '../../../../components/ui/Button.jsx';
import Spinner from '../../../../components/ui/Spinner.jsx';
import { useServicemanTax } from '../ServicemanTaxProvider.jsx';
import TaxFilingDrawer from './TaxFilingDrawer.jsx';

const confirmAction = (message) => (typeof window === 'undefined' ? true : window.confirm(message));

const toIso = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const toNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function TaxFilingsPanel() {
  const {
    workspace,
    filings,
    filingsLoading,
    filingsError,
    filingsFilters,
    setFilingsFilters,
    loadFilings,
    metadata,
    permissions,
    upsertFiling,
    changeFilingStatus,
    removeFiling
  } = useServicemanTax();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeFiling, setActiveFiling] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    loadFilings();
  }, [loadFilings]);

  const canManageFilings = permissions?.canManageFilings !== false;

  const currency = workspace?.profile?.currency ?? 'GBP';
  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch (error) {
      console.warn('Falling back to GBP formatter for tax filings', error);
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  }, [currency]);

  const handleCreate = () => {
    setActiveFiling(null);
    setDrawerOpen(true);
  };

  const handleEdit = (filing) => {
    setActiveFiling(filing);
    setDrawerOpen(true);
  };

  const handleClose = () => {
    setDrawerOpen(false);
    setActiveFiling(null);
    setActionError(null);
  };

  const handleSave = async (draft) => {
    setSaving(true);
    try {
      const payload = {
        id: draft.id ?? undefined,
        taxYear: draft.taxYear,
        period: draft.period || null,
        filingType: draft.filingType,
        submissionMethod: draft.submissionMethod,
        status: draft.status,
        dueAt: toIso(draft.dueAt),
        submittedAt: toIso(draft.submittedAt),
        amountDue: toNumber(draft.amountDue),
        amountPaid: toNumber(draft.amountPaid),
        currency: draft.currency || currency,
        reference: draft.reference || null,
        notes: draft.notes || null,
        documents: (draft.documents || [])
          .filter((doc) => doc.title && doc.fileUrl)
          .map((doc) => ({
            title: doc.title,
            fileUrl: doc.fileUrl,
            documentType: doc.documentType || 'evidence'
          }))
      };
      await upsertFiling(payload);
      await loadFilings();
      handleClose();
    } catch (error) {
      setActionError(error?.message ?? 'Failed to save filing');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (draft) => {
    if (!draft?.id) return;
    if (!confirmAction('Delete this filing? This action cannot be undone.')) {
      return;
    }
    setSaving(true);
    try {
      await removeFiling(draft.id);
      await loadFilings();
      handleClose();
    } catch (error) {
      setActionError(error?.message ?? 'Failed to delete filing');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (filing, nextStatus) => {
    if (!filing?.id) return;
    try {
      await changeFilingStatus(filing.id, { status: nextStatus });
      await loadFilings();
    } catch (error) {
      setActionError(error?.message ?? 'Failed to update filing status');
    }
  };

  const items = filings?.items ?? [];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Tax filings</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Track every return, payment, and status change. Update statuses as submissions progress through HMRC or other
            authorities and attach evidence to keep audits effortless.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleCreate}
            disabled={!canManageFilings}
            data-qa="tax-filings-create"
          >
            New filing
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status filter
            <select
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={filingsFilters.status}
              onChange={(event) => setFilingsFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="all">All statuses</option>
              {(metadata?.filingStatuses ?? ['draft', 'pending', 'submitted', 'accepted', 'overdue', 'rejected', 'cancelled']).map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            Search reference
            <input
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={filingsFilters.search ?? ''}
              placeholder="Search by reference or period"
              onChange={(event) => setFilingsFilters((current) => ({ ...current, search: event.target.value }))}
            />
          </label>
        </div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
          {filings?.meta?.total ?? 0} filings tracked
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-secondary text-primary">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Tax year</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Period</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Amounts</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Due</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Submitted</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Reference</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10 text-slate-700">
            {filingsLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Spinner className="h-4 w-4 text-primary" /> Loading filings…
                  </div>
                </td>
              </tr>
            ) : null}
            {!filingsLoading && !items.length ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-500">
                  No filings recorded yet. Create your first record to start tracking compliance.
                </td>
              </tr>
            ) : null}
            {items.map((filing) => (
              <tr key={filing.id} className="hover:bg-secondary/70">
                <td className="px-4 py-4 font-semibold text-primary">{filing.taxYear}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{filing.period || '—'}</td>
                <td className="px-4 py-4">
                  <select
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={filing.status}
                    onChange={(event) => handleStatusChange(filing, event.target.value)}
                    disabled={!canManageFilings}
                  >
                    {(metadata?.filingStatuses ?? ['draft', 'pending', 'submitted', 'accepted', 'overdue', 'rejected', 'cancelled']).map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-slate-600">
                    <div>Due {filing.amountDue != null ? currencyFormatter.format(filing.amountDue) : '—'}</div>
                    <div className="text-xs text-emerald-600">Paid {filing.amountPaid != null ? currencyFormatter.format(filing.amountPaid) : '—'}</div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {filing.dueAt ? new Date(filing.dueAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {filing.submittedAt ? new Date(filing.submittedAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">{filing.reference || '—'}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="ghost" onClick={() => handleEdit(filing)} disabled={!canManageFilings}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-rose-600 hover:text-rose-700"
                      onClick={() => handleDelete(filing)}
                      disabled={!canManageFilings}
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

      {filingsError ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {filingsError.message ?? 'Failed to load filings'}
        </div>
      ) : null}
      {actionError ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError}</div>
      ) : null}
      {!canManageFilings ? (
        <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-400">You have read-only access to filings.</p>
      ) : null}

      <TaxFilingDrawer
        open={drawerOpen}
        filing={activeFiling}
        metadata={metadata}
        onClose={handleClose}
        onSubmit={handleSave}
        onDelete={handleDelete}
        saving={saving}
        canEdit={canManageFilings}
      />
    </section>
  );
}
