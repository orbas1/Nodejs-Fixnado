import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import {
  createDataSubjectRequest,
  fetchDataSubjectRequests,
  triggerDataSubjectExport,
  updateDataSubjectRequestStatus,
  fetchWarehouseExportRuns,
  triggerWarehouseExportRun
} from '../api/complianceClient.js';
import Spinner from '../components/ui/Spinner.jsx';

const REQUEST_TYPES = [
  { value: 'access', label: 'Access / Export' },
  { value: 'erasure', label: 'Erasure' },
  { value: 'rectification', label: 'Rectification' }
];

const STATUS_OPTIONS = [
  { value: 'received', label: 'Received' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' }
];

const REGION_OPTIONS = [
  { value: 'GB', label: 'United Kingdom (GB)' },
  { value: 'IE', label: 'Ireland (IE)' },
  { value: 'AE', label: 'United Arab Emirates (AE)' }
];

const DATASET_OPTIONS = [
  { value: 'orders', label: 'Orders & fulfilment' },
  { value: 'finance', label: 'Finance history' },
  { value: 'communications', label: 'Communications ledger' }
];

function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  try {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function StatusBadge({ status }) {
  const colourMap = {
    received: 'bg-blue-100 text-blue-700 ring-blue-200',
    in_progress: 'bg-amber-100 text-amber-700 ring-amber-200',
    completed: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    rejected: 'bg-rose-100 text-rose-700 ring-rose-200',
    running: 'bg-sky-100 text-sky-700 ring-sky-200',
    succeeded: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    failed: 'bg-rose-100 text-rose-700 ring-rose-200'
  };
  const styles = colourMap[status] || 'bg-slate-100 text-slate-700 ring-slate-200';
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired
};

export default function CompliancePortal() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [formState, setFormState] = useState({
    subjectEmail: '',
    requestType: 'access',
    justification: '',
    regionCode: 'GB'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeExportId, setActiveExportId] = useState('');
  const [statusUpdatingId, setStatusUpdatingId] = useState('');
  const [warehouseRuns, setWarehouseRuns] = useState([]);
  const [warehouseLoading, setWarehouseLoading] = useState(true);
  const [warehouseError, setWarehouseError] = useState(null);
  const [warehouseDatasetFilter, setWarehouseDatasetFilter] = useState('');
  const [warehouseReloadToken, setWarehouseReloadToken] = useState(0);
  const [datasetSelection, setDatasetSelection] = useState('orders');
  const [regionSelection, setRegionSelection] = useState('GB');
  const [isTriggeringWarehouse, setIsTriggeringWarehouse] = useState(false);

  useEffect(() => {
    let abortController = new AbortController();
    async function loadRequests() {
      setIsLoading(true);
      setError(null);
      try {
        const results = await fetchDataSubjectRequests(
          { status: statusFilter || undefined },
          { signal: abortController.signal }
        );
        setRequests(results);
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message || 'Failed to load compliance requests.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadRequests();
    return () => {
      abortController.abort();
    };
  }, [statusFilter]);

  useEffect(() => {
    let abortController = new AbortController();
    async function loadWarehouse() {
      setWarehouseLoading(true);
      setWarehouseError(null);
      try {
        const runs = await fetchWarehouseExportRuns(
          {
            dataset: warehouseDatasetFilter || undefined
          },
          { signal: abortController.signal }
        );
        setWarehouseRuns(runs);
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setWarehouseError(loadError.message || 'Failed to load warehouse export history.');
        }
      } finally {
        setWarehouseLoading(false);
      }
    }

    loadWarehouse();
    return () => {
      abortController.abort();
    };
  }, [warehouseDatasetFilter, warehouseReloadToken]);

  const sortedRequests = useMemo(
    () =>
      [...requests].sort((a, b) =>
        new Date(b.requestedAt ?? b.createdAt ?? 0).getTime() -
        new Date(a.requestedAt ?? a.createdAt ?? 0).getTime()
      ),
    [requests]
  );

  const sortedWarehouseRuns = useMemo(
    () =>
      [...warehouseRuns].sort((a, b) =>
        new Date(b.runStartedAt ?? b.createdAt ?? 0).getTime() -
        new Date(a.runStartedAt ?? a.createdAt ?? 0).getTime()
      ),
    [warehouseRuns]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...formState,
        subjectEmail: formState.subjectEmail.trim(),
        justification: formState.justification.trim()
      };
      const created = await createDataSubjectRequest(payload);
      setRequests((current) => [created, ...current]);
      setFormState({ subjectEmail: '', requestType: 'access', justification: '', regionCode: 'GB' });
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit data subject request.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleExport(requestId) {
    setActiveExportId(requestId);
    setError(null);
    try {
      const result = await triggerDataSubjectExport(requestId, {});
      if (result?.filePath) {
        setRequests((current) =>
          current.map((item) => (item.id === requestId ? { ...item, ...result.request } : item))
        );
      }
    } catch (exportError) {
      setError(exportError.message || 'Failed to generate export package.');
    } finally {
      setActiveExportId('');
    }
  }

  async function handleStatusChange(requestId, status) {
    setStatusUpdatingId(requestId);
    setError(null);
    try {
      const updated = await updateDataSubjectRequestStatus(requestId, { status });
      setRequests((current) => current.map((item) => (item.id === requestId ? updated : item)));
    } catch (updateError) {
      setError(updateError.message || 'Failed to update request status.');
    } finally {
      setStatusUpdatingId('');
    }
  }

  function refreshWarehouseRuns() {
    setWarehouseReloadToken((value) => value + 1);
  }

  async function handleWarehouseTrigger() {
    setIsTriggeringWarehouse(true);
    setWarehouseError(null);
    try {
      const run = await triggerWarehouseExportRun({
        dataset: datasetSelection,
        regionCode: regionSelection
      });
      setWarehouseRuns((current) => [run, ...current]);
    } catch (triggerError) {
      setWarehouseError(triggerError.message || 'Failed to trigger warehouse export.');
    } finally {
      setIsTriggeringWarehouse(false);
    }
  }

  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-white">Compliance &amp; Data Governance</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Coordinate GDPR data subject requests across regions, track fulfilment statuses, and generate auditable exports for
            regulatory evidence.
          </p>
        </header>

        <section className="mb-12 rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-900/60">
          <h2 className="text-xl font-semibold text-white">Log a new request</h2>
          <p className="mt-1 text-sm text-slate-300">
            Capture the subject&apos;s email, request type, and context. The system associates prior activity automatically and stores
            an immutable audit trail.
          </p>
          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1 text-sm text-slate-200">
              Subject email
              <input
                required
                type="email"
                value={formState.subjectEmail}
                onChange={(event) => setFormState((prev) => ({ ...prev, subjectEmail: event.target.value }))}
                className="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white shadow-inner shadow-slate-900 focus:border-primary focus:outline-none"
                placeholder="privacy.contact@example.com"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-200">
              Request type
              <select
                value={formState.requestType}
                onChange={(event) => setFormState((prev) => ({ ...prev, requestType: event.target.value }))}
                className="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white focus:border-primary focus:outline-none"
              >
                {REQUEST_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-200">
              Region
              <select
                value={formState.regionCode}
                onChange={(event) => setFormState((prev) => ({ ...prev, regionCode: event.target.value }))}
                className="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white focus:border-primary focus:outline-none"
              >
                {REGION_OPTIONS.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2 flex flex-col gap-1 text-sm text-slate-200">
              Business context (optional)
              <textarea
                rows={3}
                value={formState.justification}
                onChange={(event) => setFormState((prev) => ({ ...prev, justification: event.target.value }))}
                className="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white focus:border-primary focus:outline-none"
                placeholder="Include ticket references, legal basis, or customer communication notes"
              />
            </label>
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/40 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60"
              >
                {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
                <span>{isSubmitting ? 'Submitting...' : 'Create request'}</span>
              </button>
              <p className="text-xs text-slate-400">
                Submission automatically timestamps the audit log and routes escalations to the compliance inbox.
              </p>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-900/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Requests overview</h2>
              <p className="text-sm text-slate-300">
                Track fulfilment progress across every region. Completed exports record the storage path for audit verification.
              </p>
            </div>
            <label className="text-sm text-slate-200">
              Filter by status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="ml-2 rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white focus:border-primary focus:outline-none"
              >
                <option value="">All</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && <p className="mt-4 rounded-md border border-rose-400 bg-rose-900/30 px-4 py-3 text-sm text-rose-100">{error}</p>}

          {isLoading ? (
            <div className="mt-8 flex justify-center" role="status" aria-live="polite">
              <Spinner className="h-6 w-6 text-primary" />
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-900/60">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Subject
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Request type
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Region
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Requested
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Export path
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm text-slate-100">
                  {sortedRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-slate-900/80">
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-white">{request.subjectEmail}</div>
                        <div className="text-xs text-slate-400">
                          {request.requester?.firstName ? `${request.requester.firstName} ${request.requester.lastName ?? ''}` : 'Unassigned'}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top capitalize">{request.requestType.replace('_', ' ')}</td>
                      <td className="px-4 py-3 align-top">{request.region?.code || 'GB'}</td>
                      <td className="px-4 py-3 align-top">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div>{formatDateTime(request.requestedAt || request.createdAt)}</div>
                        {request.processedAt && (
                          <div className="text-xs text-slate-400">Closed {formatDateTime(request.processedAt)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {request.payloadLocation ? (
                          <code className="block max-w-xs truncate rounded bg-slate-950/60 px-2 py-1 text-xs text-primary">
                            {request.payloadLocation}
                          </code>
                        ) : (
                          <span className="text-xs text-slate-500">Not generated</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-2 text-xs">
                          {request.requestType === 'access' && request.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => handleExport(request.id)}
                              disabled={activeExportId === request.id}
                              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-700 px-3 py-1 font-semibold text-slate-200 transition hover:border-primary hover:text-white disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
                            >
                              {activeExportId === request.id ? <Spinner className="h-3 w-3" /> : null}
                              <span>{activeExportId === request.id ? 'Generating…' : 'Generate export'}</span>
                            </button>
                          )}
                          <label className="flex items-center gap-2 text-slate-300">
                            <span>Status</span>
                            <select
                              value={request.status}
                              onChange={(event) => handleStatusChange(request.id, event.target.value)}
                              disabled={statusUpdatingId === request.id}
                              className="rounded border border-slate-700 bg-slate-950/80 px-2 py-1 text-xs text-white focus:border-primary focus:outline-none disabled:cursor-wait"
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sortedRequests.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                        No data subject requests recorded for this filter yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-12 rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-900/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Warehouse CDC exports</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-300">
                Schedule region-aware data exports for downstream analytics and regulatory retention. Every run captures the
                generated bundle path, row count, and completion timestamps for DPIA evidence.
              </p>
            </div>
            <div className="grid w-full gap-3 md:w-auto md:grid-cols-3 md:items-end">
              <label className="flex flex-col gap-1 text-sm text-slate-200">
                Dataset
                <select
                  value={datasetSelection}
                  onChange={(event) => setDatasetSelection(event.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white focus:border-primary focus:outline-none"
                >
                  {DATASET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-200">
                Region
                <select
                  value={regionSelection}
                  onChange={(event) => setRegionSelection(event.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white focus:border-primary focus:outline-none"
                >
                  <option value="">Global rollup</option>
                  {REGION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={handleWarehouseTrigger}
                disabled={isTriggeringWarehouse}
                className="mt-1 inline-flex items-center justify-center rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-400"
              >
                {isTriggeringWarehouse ? 'Triggering…' : 'Trigger export'}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-200">
                Filter dataset
                <select
                  value={warehouseDatasetFilter}
                  onChange={(event) => setWarehouseDatasetFilter(event.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white focus:border-primary focus:outline-none"
                >
                  <option value="">All datasets</option>
                  {DATASET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={refreshWarehouseRuns}
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-primary hover:text-primary"
            >
              Refresh exports
            </button>
          </div>

          {warehouseError && (
            <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {warehouseError}
            </div>
          )}

          {warehouseLoading ? (
            <div className="py-12">
              <Spinner />
            </div>
          ) : sortedWarehouseRuns.length === 0 ? (
            <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-8 text-center text-sm text-slate-300">
              No export runs captured yet. Trigger an export to populate the warehouse and compliance evidence trail.
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
                <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th scope="col" className="px-3 py-2">Dataset</th>
                    <th scope="col" className="px-3 py-2">Region</th>
                    <th scope="col" className="px-3 py-2">Status</th>
                    <th scope="col" className="px-3 py-2 text-right">Rows</th>
                    <th scope="col" className="px-3 py-2">Started</th>
                    <th scope="col" className="px-3 py-2">Completed</th>
                    <th scope="col" className="px-3 py-2">File path</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sortedWarehouseRuns.map((run) => (
                    <tr key={run.id}>
                      <td className="px-3 py-3 font-semibold capitalize text-white">{run.dataset}</td>
                      <td className="px-3 py-3 text-slate-300">{run.region?.code ?? 'GLOBAL'}</td>
                      <td className="px-3 py-3"><StatusBadge status={run.status} /></td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-200">
                        {typeof run.rowCount === 'number' ? run.rowCount.toLocaleString('en-GB') : '—'}
                      </td>
                      <td className="px-3 py-3 text-slate-300">{formatDateTime(run.runStartedAt)}</td>
                      <td className="px-3 py-3 text-slate-300">{formatDateTime(run.runFinishedAt)}</td>
                      <td className="px-3 py-3 text-xs text-slate-400">
                        {run.filePath ? <span className="break-all">{run.filePath}</span> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
