import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowSmallLeftIcon,
  ArrowSmallRightIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { getDisputeHealthBucketHistory } from '../api/panelClient.js';
import { Button, Spinner, StatusPill } from '../components/ui/index.js';

const STATUS_LABELS = {
  on_track: { label: 'On track', tone: 'success' },
  monitor: { label: 'Monitor', tone: 'warning' },
  at_risk: { label: 'At risk', tone: 'danger' }
};

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '0';
  return numeric.toLocaleString();
}

function formatPercent(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '0%';
  const safe = Math.max(0, Math.min(1, numeric));
  return `${Math.round(safe * 100)}%`;
}

function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function AdminDisputeHealthHistory() {
  const { bucketId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: null, data: null, meta: null });
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const loadHistory = useCallback(async () => {
    if (!bucketId) return;
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const response = await getDisputeHealthBucketHistory({
        bucketId,
        limit,
        offset,
        forceRefresh: refreshIndex > 0
      });
      setState({ loading: false, error: null, data: response.data, meta: response.meta });
      const resolvedLimit = response.data?.pagination?.limit;
      if (Number.isFinite(resolvedLimit) && resolvedLimit > 0 && resolvedLimit !== limit) {
        setLimit(resolvedLimit);
      }
    } catch (error) {
      setState({ loading: false, error, data: null, meta: null });
    }
  }, [bucketId, limit, offset, refreshIndex]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const bucket = state.data?.bucket ?? null;
  const entries = state.data?.entries ?? [];
  const pagination = state.data?.pagination ?? { total: 0, limit, offset, hasMore: false };
  const metrics = useMemo(() => {
    const source = state.data?.metrics ?? {};
    return {
      latestResolutionRate: Number(source.latestResolutionRate ?? 0) || 0,
      latestEscalated: Number(source.latestEscalated ?? 0) || 0,
      latestResolved: Number(source.latestResolved ?? 0) || 0,
      backlog: Number(source.backlog ?? 0) || 0,
      trend: Number(source.trend ?? 0) || 0
    };
  }, [state.data?.metrics]);

  const statusTone = STATUS_LABELS[bucket?.status]?.tone ?? 'info';
  const statusLabel = STATUS_LABELS[bucket?.status]?.label ?? 'Monitor';

  const canGoBack = offset > 0;
  const canGoForward = pagination.hasMore;

  const handleNextPage = () => {
    if (!canGoForward) return;
    setOffset((current) => current + limit);
  };

  const handlePreviousPage = () => {
    if (!canGoBack) return;
    setOffset((current) => Math.max(0, current - limit));
  };

  const handleLimitChange = (event) => {
    const nextLimit = Number.parseInt(event.target.value, 10);
    if (Number.isNaN(nextLimit) || nextLimit <= 0) {
      return;
    }
    setLimit(nextLimit);
    setOffset(0);
  };

  const handleRefresh = () => {
    setRefreshIndex((current) => current + 1);
  };

  const summaryCards = useMemo(
    () => [
      {
        id: 'resolution-rate',
        label: 'Resolution rate',
        value: formatPercent(metrics.latestResolutionRate),
        helper: 'Latest completed window'
      },
      {
        id: 'escalated',
        label: 'Escalated cases',
        value: formatNumber(metrics.latestEscalated),
        helper: 'Last reported window'
      },
      {
        id: 'resolved',
        label: 'Resolved cases',
        value: formatNumber(metrics.latestResolved),
        helper: 'Last reported window'
      },
      {
        id: 'backlog',
        label: 'Backlog',
        value: formatNumber(metrics.backlog),
        helper: 'Awaiting action'
      }
    ],
    [metrics]
  );

  const totalPages = Math.max(1, Math.ceil((pagination.total ?? 0) / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Dispute health</p>
            <h1 className="mt-1 text-2xl font-semibold text-primary">{bucket?.label ?? 'Dispute cadence history'}</h1>
            <p className="mt-1 text-sm text-slate-600">
              Review every reporting window, attachments, and owner notes for this cadence bucket.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" to="/admin/dashboard" icon={ArrowLeftIcon} iconPosition="start">
              Back to admin
            </Button>
            <Button variant="ghost" size="sm" to="/dashboards/finance" icon={ArrowTopRightOnSquareIcon} iconPosition="end">
              Finance overview
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowPathIcon}
              iconPosition="start"
              onClick={handleRefresh}
              loading={state.loading}
            >
              Refresh data
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-6xl px-6">
        {state.meta?.fallback ? (
          <div className="mb-4">
            <StatusPill tone="warning">Showing cached history snapshot</StatusPill>
          </div>
        ) : null}
        {state.error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            <p className="text-sm font-semibold">Unable to load dispute history</p>
            <p className="mt-1 text-xs">{state.error?.message ?? 'Please try again shortly.'}</p>
            <div className="mt-3">
              <Button variant="primary" size="sm" onClick={loadHistory} icon={ArrowPathIcon} iconPosition="start">
                Retry
              </Button>
            </div>
          </div>
        ) : null}

        <section className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
              {bucket?.ownerName ? (
                <p className="text-sm text-slate-600">
                  Owner: <span className="font-medium text-primary">{bucket.ownerName}</span>
                  {bucket.ownerRole ? ` • ${bucket.ownerRole}` : ''}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Cadence: {bucket?.cadence ?? '—'}</span>
              <span>Window: {bucket?.windowDurationHours ?? 0} hours</span>
            </div>
          </div>

          {bucket?.checklist?.length ? (
            <div className="mt-4">
              <h2 className="text-sm font-semibold text-primary">Resolution checklist</h2>
              <ul className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                {bucket.checklist.map((item, index) => (
                  <li key={item || index} className="flex items-start gap-2">
                    <ClipboardDocumentListIcon className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div key={card.id} className="rounded-2xl border border-accent/10 bg-secondary/40 p-4">
                <p className="text-xs uppercase tracking-wide text-primary/60">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold text-primary">{card.value}</p>
                <p className="mt-1 text-xs text-slate-500">{card.helper}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-primary">Reporting windows</h2>
              <p className="text-xs text-slate-500">
                Showing {entries.length} of {pagination.total} windows. Use the controls to paginate through the backlog.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs text-slate-500">
                Rows per page
                <select className="ml-2 rounded-lg border border-slate-200 px-2 py-1 text-sm" value={limit} onChange={handleLimitChange}>
                  {[10, 20, 50, 100].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={ArrowSmallLeftIcon}
                  iconPosition="start"
                  onClick={handlePreviousPage}
                  disabled={!canGoBack || state.loading}
                >
                  Previous
                </Button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={ArrowSmallRightIcon}
                  iconPosition="end"
                  onClick={handleNextPage}
                  disabled={!canGoForward || state.loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-secondary text-primary">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">Period</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">Escalated</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">Resolved</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">Backlog</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">Reopened</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">Notes</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">Attachments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 text-slate-700">
                {entries.map((entry) => (
                  <tr key={entry.id ?? `${entry.periodStart}-${entry.periodEnd}`} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-primary">{formatDate(entry.periodStart)}</p>
                      <p className="text-xs text-primary/60">→ {formatDate(entry.periodEnd)}</p>
                    </td>
                    <td className="px-4 py-3">{formatNumber(entry.escalatedCount)}</td>
                    <td className="px-4 py-3">{formatNumber(entry.resolvedCount)}</td>
                    <td className="px-4 py-3">{formatNumber(entry.backlogCount)}</td>
                    <td className="px-4 py-3">{formatNumber(entry.reopenedCount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {entry.ownerNotes ? entry.ownerNotes : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {entry.attachments?.length ? (
                        <ul className="space-y-2 text-xs text-primary/70">
                          {entry.attachments.map((attachment) => (
                            <li key={attachment.id ?? attachment.url} className="flex items-center gap-2">
                              <span className="truncate">{attachment.label}</span>
                              <Button
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="ghost"
                                size="sm"
                                icon={ArrowTopRightOnSquareIcon}
                                iconPosition="end"
                              >
                                Open
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!entries.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                      No reporting windows found for this cadence bucket.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {state.loading ? (
            <div className="mt-6 flex items-center justify-center gap-3 text-sm text-slate-500">
              <Spinner className="h-5 w-5" />
              <span>Loading history…</span>
            </div>
          ) : null}
        </section>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" to={`/admin/dashboard?focus=dispute-health&bucket=${bucketId ?? ''}`}>
            Return to dispute workspace
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/dashboard', { replace: false })}
            icon={ArrowLeftIcon}
            iconPosition="start"
          >
            Admin dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}
