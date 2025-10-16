import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  getDisputeHealthWorkspace,
  createDisputeHealthBucket,
  updateDisputeHealthBucket,
  archiveDisputeHealthBucket,
  createDisputeHealthEntry,
  updateDisputeHealthEntry,
  deleteDisputeHealthEntry
} from '../../api/panelClient.js';
import { Button, FormField, Spinner, StatusPill, TextInput } from '../ui/index.js';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const numberFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
const percentFormatter = new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 0 });

const STATUS_BADGES = {
  on_track: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  monitor: 'border-amber-200 bg-amber-50 text-amber-700',
  at_risk: 'border-rose-200 bg-rose-50 text-rose-700'
};

const STATUS_LABELS = {
  on_track: 'On track',
  monitor: 'Monitor',
  at_risk: 'At risk'
};

function formatPercent(value) {
  if (!Number.isFinite(value)) return '0%';
  const safe = Math.max(0, value);
  try {
    return percentFormatter.format(Math.min(safe, 1));
  } catch (error) {
    console.warn('Failed to format percent', error);
    return `${(Math.min(safe, 1) * 100).toFixed(0)}%`;
  }
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return '0';
  try {
    return numberFormatter.format(value);
  } catch (error) {
    console.warn('Failed to format number', error);
    return String(value);
  }
}

function formatDateLabel(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function toDatetimeLocal(value) {
  const base = value ? new Date(value) : new Date();
  if (Number.isNaN(base.getTime())) {
    return '';
  }
  const adjusted = new Date(base.getTime() - base.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
}

function stringifyChecklist(items = []) {
  if (!Array.isArray(items)) return '';
  return items.join('\n');
}

function parseChecklist(text = '') {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function stringifyAttachments(attachments = []) {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return '';
  }
  return attachments
    .map((attachment) => {
      if (!attachment) return null;
      const url = typeof attachment.url === 'string' ? attachment.url : '';
      if (!url) return null;
      const label = typeof attachment.label === 'string' ? attachment.label : '';
      return label && label !== url ? `${label} | ${url}` : url;
    })
    .filter(Boolean)
    .join('\n');
}

function parseAttachments(text = '') {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [labelPart, urlPart] = line.split('|');
      if (urlPart) {
        const url = urlPart.trim();
        const label = labelPart.trim();
        if (!url) return null;
        return { label: label || url, url };
      }
      const url = labelPart.trim();
      if (!url) return null;
      return { label: url, url };
    })
    .filter(Boolean);
}

function hydrateBucketForm(bucket) {
  return {
    id: bucket.id,
    label: bucket.label ?? '',
    cadence: bucket.cadence ?? '',
    windowDurationHours: String(bucket.windowDurationHours ?? 24),
    ownerName: bucket.ownerName ?? '',
    ownerRole: bucket.ownerRole ?? '',
    escalationContact: bucket.escalationContact ?? '',
    playbookUrl: bucket.playbookUrl ?? '',
    heroImageUrl: bucket.heroImageUrl ?? '',
    status: bucket.status ?? 'on_track',
    sortOrder: String(bucket.sortOrder ?? 0),
    checklistText: stringifyChecklist(bucket.checklist ?? [])
  };
}

function hydrateEntryFormFromEntry(entry, bucketId) {
  const safeEntry = entry ?? {};
  const fallbackDate = new Date().toISOString();
  return {
    id: safeEntry.id ?? null,
    bucketId,
    periodStart: toDatetimeLocal(safeEntry.periodStart ?? fallbackDate),
    periodEnd: toDatetimeLocal(safeEntry.periodEnd ?? fallbackDate),
    escalatedCount: String(safeEntry.escalatedCount ?? 0),
    resolvedCount: String(safeEntry.resolvedCount ?? 0),
    reopenedCount: String(safeEntry.reopenedCount ?? 0),
    backlogCount: String(safeEntry.backlogCount ?? 0),
    ownerNotes: safeEntry.ownerNotes ?? '',
    attachmentsText: stringifyAttachments(safeEntry.attachments ?? [])
  };
}

function hydrateEntryForm(bucket) {
  const seed = bucket.latestEntry ?? {
    id: null,
    bucketId: bucket.id,
    periodStart: bucket.latestEntry?.periodEnd ?? new Date().toISOString(),
    periodEnd: bucket.latestEntry?.periodEnd ?? new Date().toISOString(),
    escalatedCount: bucket.metrics?.latestEscalated ?? 0,
    resolvedCount: bucket.metrics?.latestResolved ?? 0,
    reopenedCount: 0,
    backlogCount: bucket.metrics?.backlog ?? 0,
    ownerNotes: '',
    attachments: []
  };

  return hydrateEntryFormFromEntry(seed, bucket.id);
}

function buildSnapshotBuckets(snapshot = []) {
  return snapshot.map((item, index) => ({
    id: item.id || `snapshot-${index}`,
    label: item.label,
    status: item.status || 'monitor',
    metrics: {
      latestEscalated: Number(item.escalated ?? 0),
      latestResolved: Number(item.resolved ?? 0),
      latestResolutionRate:
        Number(item.escalated ?? 0) > 0 ? Number(item.resolved ?? 0) / Number(item.escalated ?? 1) : 1,
      backlog: Number(item.backlog ?? 0),
      trend: 0
    },
    commentary: item.commentary
  }));
}

function DisputeHealthWorkspace({ section }) {
  const snapshot = useMemo(() => buildSnapshotBuckets(section.data?.snapshot ?? []), [section.data?.snapshot]);
  const defaultBucketId = section.data?.defaultBucketId ?? snapshot[0]?.id ?? null;
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [selectedBucketId, setSelectedBucketId] = useState(defaultBucketId);
  const [bucketForm, setBucketForm] = useState(null);
  const [entryForm, setEntryForm] = useState(null);
  const [savingBucket, setSavingBucket] = useState(false);
  const [savingEntry, setSavingEntry] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [selectedHistoryEntryId, setSelectedHistoryEntryId] = useState(null);

  const applyWorkspace = useCallback((workspace, { bucketId: preferredBucketId = null, entryId = null } = {}) => {
    setState({ loading: false, error: null, data: workspace });
    setSelectedBucketId((currentId) => {
      const buckets = workspace?.buckets ?? [];
      if (!buckets.length) {
        setBucketForm(null);
        setEntryForm(null);
        setSelectedHistoryEntryId(null);
        return null;
      }
      const resolvedId = preferredBucketId
        ? preferredBucketId
        : buckets.some((bucket) => bucket.id === currentId)
          ? currentId
          : buckets[0].id;
      const nextBucket = buckets.find((bucket) => bucket.id === resolvedId) ?? buckets[0];
      setBucketForm(hydrateBucketForm(nextBucket));
      const preferredEntry = entryId
        ? nextBucket.entries?.find((entry) => entry.id === entryId) ?? nextBucket.latestEntry
        : nextBucket.latestEntry;
      const hydrated = preferredEntry
        ? hydrateEntryFormFromEntry(preferredEntry, nextBucket.id)
        : hydrateEntryForm(nextBucket);
      setEntryForm(hydrated);
      setSelectedHistoryEntryId(hydrated.id ?? nextBucket.latestEntry?.id ?? null);
      return resolvedId;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const { data } = await getDisputeHealthWorkspace();
        if (!cancelled) {
          applyWorkspace(data, { bucketId: defaultBucketId ?? null });
        }
      } catch (error) {
        if (cancelled) return;
        setState({ loading: false, data: null, error });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyWorkspace, defaultBucketId]);

  useEffect(() => {
    if (!section.data?.defaultBucketId) return;
    if (section.data.defaultBucketId === selectedBucketId) return;
    setSelectedBucketId(section.data.defaultBucketId);
  }, [section.data?.defaultBucketId, selectedBucketId]);

  const buckets = useMemo(() => state.data?.buckets ?? [], [state.data]);
  const selectedBucket = useMemo(
    () => buckets.find((bucket) => bucket.id === selectedBucketId) ?? null,
    [buckets, selectedBucketId]
  );

  useEffect(() => {
    if (selectedBucket) {
      setBucketForm(hydrateBucketForm(selectedBucket));
      const hydrated = hydrateEntryForm(selectedBucket);
      setEntryForm(hydrated);
      setSelectedHistoryEntryId(hydrated.id ?? selectedBucket.latestEntry?.id ?? null);
    } else {
      setBucketForm(null);
      setEntryForm(null);
      setSelectedHistoryEntryId(null);
    }
  }, [selectedBucket]);

  useEffect(() => {
    if (!selectedBucket && buckets.length > 0) {
      setSelectedBucketId(buckets[0].id);
    }
  }, [selectedBucket, buckets]);

  const summary = state.data?.summary ?? null;
  const insights = state.data?.insights ?? [];

  const summaryHeadlineCards = useMemo(() => {
    if (!summary) return [];
    return [
      {
        id: 'open',
        label: 'Open disputes',
        value: formatNumber(summary.open),
        helper: 'Monitoring across all cadence buckets'
      },
      {
        id: 'under-review',
        label: 'Under review',
        value: formatNumber(summary.underReview),
        helper: 'Awaiting evidence or client response'
      },
      {
        id: 'resolution-rate',
        label: 'Resolution rate',
        value: formatPercent(summary.resolutionRate),
        helper: `Window since ${formatDateLabel(summary.windowStart)}`
      },
      {
        id: 'backlog',
        label: 'Backlog > 72h',
        value: formatNumber(summary.backlogOlderThanTarget),
        helper: 'Requires triage to restore SLA'
      }
    ];
  }, [summary]);

  const summaryThroughputCards = useMemo(() => {
    if (!summary) return [];
    return [
      {
        id: 'opened-this-window',
        label: 'Escalated this window',
        value: formatNumber(summary.openedThisWindow),
        helper: `Since ${formatDateLabel(summary.windowStart)}`
      },
      {
        id: 'resolved-this-window',
        label: 'Resolved this window',
        value: formatNumber(summary.resolvedThisWindow),
        helper: 'Closed following investigation'
      },
      {
        id: 'reopened-this-window',
        label: 'Reopened cases',
        value: formatNumber(summary.reopenedThisWindow),
        helper: 'Returned to backlog after closure'
      }
    ];
  }, [summary]);

  const handleRefresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true }));
    setActionError(null);
    try {
      const { data } = await getDisputeHealthWorkspace({ forceRefresh: true });
      applyWorkspace(data, { bucketId: selectedBucketId ?? null, entryId: entryForm?.id ?? null });
    } catch (error) {
      setState({ loading: false, data: null, error });
    }
  }, [applyWorkspace, selectedBucketId, entryForm?.id]);

  const handleSelectBucket = useCallback(
    (bucketId) => {
      if (!state.data) {
        setSelectedBucketId(bucketId);
        return;
      }
      const bucket = state.data.buckets.find((candidate) => candidate.id === bucketId);
      if (!bucket) {
        return;
      }
      setActionError(null);
      setSelectedBucketId(bucketId);
      setBucketForm(hydrateBucketForm(bucket));
      const hydrated = hydrateEntryForm(bucket);
      setEntryForm(hydrated);
      setSelectedHistoryEntryId(hydrated.id ?? bucket.latestEntry?.id ?? null);
    },
    [state.data]
  );

  const handleBucketFieldChange = useCallback((field) => (event) => {
    const value = event.target.value;
    setBucketForm((current) => (current ? { ...current, [field]: value } : current));
  }, []);

  const activeEntryId = entryForm?.id ?? selectedHistoryEntryId ?? null;

  const handleBucketSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!bucketForm?.id) return;
      setSavingBucket(true);
      setActionError(null);
      try {
        const payload = {
          label: bucketForm.label,
          cadence: bucketForm.cadence,
          windowDurationHours: Number(bucketForm.windowDurationHours),
          ownerName: bucketForm.ownerName,
          ownerRole: bucketForm.ownerRole,
          escalationContact: bucketForm.escalationContact,
          playbookUrl: bucketForm.playbookUrl,
          heroImageUrl: bucketForm.heroImageUrl,
          status: bucketForm.status,
          sortOrder: Number(bucketForm.sortOrder),
          checklist: parseChecklist(bucketForm.checklistText)
        };
        const workspace = await updateDisputeHealthBucket(bucketForm.id, payload);
        applyWorkspace(workspace, { bucketId: bucketForm.id, entryId: activeEntryId });
      } catch (error) {
        setActionError(error?.message ?? 'Unable to save bucket');
      } finally {
        setSavingBucket(false);
      }
    },
    [bucketForm, applyWorkspace, activeEntryId]
  );

  const handleCreateBucket = useCallback(async () => {
    setSavingBucket(true);
    setActionError(null);
    try {
      const workspace = await createDisputeHealthBucket({
        sortOrder: state.data?.buckets?.length ?? 0
      });
      const newest = workspace.buckets[workspace.buckets.length - 1] ?? null;
      applyWorkspace(workspace, { bucketId: newest?.id ?? null });
    } catch (error) {
      setActionError(error?.message ?? 'Unable to create bucket');
    } finally {
      setSavingBucket(false);
    }
  }, [state.data, applyWorkspace]);

  const handleArchiveBucket = useCallback(async () => {
    if (!bucketForm?.id) return;
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'Are you sure you want to archive this dispute cadence bucket? This will hide it from the workspace.'
      );
      if (!confirmed) return;
    }
    setSavingBucket(true);
    setActionError(null);
    try {
      const workspace = await archiveDisputeHealthBucket(bucketForm.id);
      applyWorkspace(workspace);
    } catch (error) {
      setActionError(error?.message ?? 'Unable to archive bucket');
    } finally {
      setSavingBucket(false);
    }
  }, [bucketForm?.id, applyWorkspace]);

  const handleEntryFieldChange = useCallback((field) => (event) => {
    const value = event.target.value;
    setEntryForm((current) => (current ? { ...current, [field]: value } : current));
  }, []);

  const handleResetEntryWindow = useCallback(() => {
    if (!selectedBucket) return;
    const next = hydrateEntryForm({ ...selectedBucket, latestEntry: null });
    setEntryForm(next);
    setSelectedHistoryEntryId(null);
  }, [selectedBucket]);

  const handleSelectHistoryEntry = useCallback(
    (entry) => {
      if (!entry || !bucketForm?.id) return;
      setEntryForm(hydrateEntryFormFromEntry(entry, bucketForm.id));
      setSelectedHistoryEntryId(entry.id ?? null);
    },
    [bucketForm?.id]
  );

  const handleEntrySubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!entryForm || !bucketForm?.id) return;
      setSavingEntry(true);
      setActionError(null);
      const payload = {
        bucketId: bucketForm.id,
        periodStart: entryForm.periodStart,
        periodEnd: entryForm.periodEnd,
        escalatedCount: Number(entryForm.escalatedCount ?? 0),
        resolvedCount: Number(entryForm.resolvedCount ?? 0),
        reopenedCount: Number(entryForm.reopenedCount ?? 0),
        backlogCount: Number(entryForm.backlogCount ?? 0),
        ownerNotes: entryForm.ownerNotes,
        attachments: parseAttachments(entryForm.attachmentsText)
      };
      try {
        const workspace = entryForm.id
          ? await updateDisputeHealthEntry(entryForm.id, payload)
          : await createDisputeHealthEntry(payload);
        applyWorkspace(workspace, { bucketId: payload.bucketId, entryId: entryForm.id ?? null });
        const updatedBucket = workspace.buckets.find((bucket) => bucket.id === payload.bucketId);
        if (!entryForm.id && updatedBucket) {
          const hydrated = hydrateEntryForm(updatedBucket);
          setEntryForm(hydrated);
          setSelectedHistoryEntryId(hydrated.id ?? updatedBucket.latestEntry?.id ?? null);
        } else if (entryForm.id && updatedBucket) {
          const refreshedEntry = updatedBucket.entries.find((entry) => entry.id === entryForm.id);
          if (refreshedEntry) {
            setEntryForm(hydrateEntryFormFromEntry(refreshedEntry, updatedBucket.id));
            setSelectedHistoryEntryId(refreshedEntry.id ?? null);
          }
        }
      } catch (error) {
        setActionError(error?.message ?? 'Unable to save dispute metrics');
      } finally {
        setSavingEntry(false);
      }
    },
    [entryForm, bucketForm?.id, applyWorkspace]
  );

  const handleDeleteEntry = useCallback(async () => {
    if (!entryForm?.id) return;
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Delete this reporting window? This action cannot be undone.');
      if (!confirmed) return;
    }
    setSavingEntry(true);
    setActionError(null);
    try {
      const workspace = await deleteDisputeHealthEntry(entryForm.id);
      applyWorkspace(workspace, { bucketId: bucketForm?.id ?? null });
    } catch (error) {
      setActionError(error?.message ?? 'Unable to delete dispute metrics');
    } finally {
      setSavingEntry(false);
    }
  }, [entryForm?.id, bucketForm?.id, applyWorkspace]);

  const primaryBuckets = buckets.length ? buckets : [];
  const fallbackBuckets = !primaryBuckets.length ? snapshot : [];
  const isInteractive = primaryBuckets.length > 0;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-primary">{section.label}</h2>
          <p className="text-sm text-slate-600 max-w-2xl">{section.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowPathIcon}
            iconPosition="start"
            onClick={handleRefresh}
            loading={state.loading}
          >
            Refresh workspace
          </Button>
          <Button
            variant="ghost"
            size="sm"
            to="/dashboards/finance"
            icon={ArrowTopRightOnSquareIcon}
            iconPosition="end"
          >
            Open finance dashboard
          </Button>
          {selectedBucketId ? (
            <Button
              variant="ghost"
              size="sm"
              to={`/admin/disputes/health/${selectedBucketId}/history`}
              icon={ArrowTopRightOnSquareIcon}
              iconPosition="end"
            >
              Full timeline
            </Button>
          ) : null}
        </div>
      </div>

      {state.error ? (
        <div className="mb-4">
          <StatusPill tone="danger">Failed to load dispute health — {state.error.message}</StatusPill>
        </div>
      ) : null}
      {actionError ? (
        <div className="mb-4">
          <StatusPill tone="danger">{actionError}</StatusPill>
        </div>
      ) : null}

      {summaryHeadlineCards.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryHeadlineCards.map((card) => (
            <div key={card.id} className="rounded-2xl border border-accent/10 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-primary/60">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-primary">{card.value}</p>
              <p className="mt-2 text-xs text-slate-500">{card.helper}</p>
            </div>
          ))}
        </div>
      ) : null}

      {summaryThroughputCards.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaryThroughputCards.map((card) => (
            <div key={card.id} className="rounded-2xl border border-accent/10 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-primary/60">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-primary">{card.value}</p>
              <p className="mt-2 text-xs text-slate-500">{card.helper}</p>
            </div>
          ))}
        </div>
      ) : null}

      {insights.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {insights.map((insight) => {
            const toneClass = STATUS_BADGES[insight.status] ?? STATUS_BADGES.monitor;
            return (
              <div
                key={insight.id ?? insight.label}
                className={clsx('rounded-2xl border p-4 shadow-sm', toneClass)}
              >
                <p className="text-sm font-semibold text-primary">{insight.label}</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-primary/70">
                  Resolution rate {formatPercent(insight.latestResolutionRate)}
                </p>
                <p className="mt-1 text-xs text-primary/70">Backlog {formatNumber(insight.backlog)}</p>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-3xl border border-accent/10 bg-white p-4 shadow-md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-primary">Cadence buckets</h3>
                <p className="text-xs text-slate-500">Live dispute windows and owners</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={PlusCircleIcon}
                iconPosition="start"
                onClick={handleCreateBucket}
                disabled={!state.data}
                loading={savingBucket && !bucketForm?.id}
              >
                New bucket
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {(isInteractive ? primaryBuckets : fallbackBuckets).map((bucket) => {
                const toneClass = STATUS_BADGES[bucket.status] ?? STATUS_BADGES.monitor;
                const isActive = bucket.id === selectedBucketId && isInteractive;
                return (
                  <button
                    key={bucket.id}
                    type="button"
                    onClick={() => handleSelectBucket(bucket.id)}
                    disabled={!isInteractive}
                    className={clsx(
                      'w-full rounded-2xl border px-4 py-3 text-left shadow-sm transition',
                      toneClass,
                      isActive ? 'ring-2 ring-offset-2 ring-primary/60' : 'hover:border-primary/30'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-primary">{bucket.label}</p>
                        <p className="text-xs text-primary/70">
                          {STATUS_LABELS[bucket.status] ?? STATUS_LABELS.monitor}
                        </p>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary/70">
                        {formatPercent(bucket.metrics?.latestResolutionRate ?? 0)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-primary/70">
                      <span>Escalated {formatNumber(bucket.metrics?.latestEscalated ?? 0)}</span>
                      <span>Resolved {formatNumber(bucket.metrics?.latestResolved ?? 0)}</span>
                    </div>
                    {bucket.commentary ? (
                      <p className="mt-3 text-xs text-primary/60">{bucket.commentary}</p>
                    ) : null}
                  </button>
                );
              })}
              {!isInteractive && !state.loading ? (
                <p className="rounded-2xl border border-dashed border-accent/30 bg-secondary px-4 py-3 text-sm text-slate-500">
                  No dispute cadence buckets have been configured yet. Create one to begin tracking resolution health.
                </p>
              ) : null}
            </div>
          </div>
          {state.loading ? (
            <div className="rounded-3xl border border-dashed border-accent/30 bg-secondary/60 p-6 text-center text-sm text-slate-500">
              <div className="flex items-center justify-center gap-3">
                <Spinner className="h-5 w-5" />
                <span>Synchronising dispute workspace…</span>
              </div>
            </div>
          ) : null}
        </aside>

        <div className="space-y-6">
          {selectedBucket && bucketForm ? (
            <form
              className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md space-y-4"
              onSubmit={handleBucketSubmit}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-primary">Bucket configuration</h3>
                  <p className="text-xs text-slate-500">
                    Update cadence metadata, escalation contacts, and linked playbooks.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={TrashIcon}
                    type="button"
                    onClick={handleArchiveBucket}
                    disabled={savingBucket}
                  >
                    Archive bucket
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={DocumentTextIcon}
                    type="submit"
                    loading={savingBucket}
                  >
                    Save bucket
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField id="bucket-label" label="Bucket name">
                  <TextInput value={bucketForm.label} onChange={handleBucketFieldChange('label')} required />
                </FormField>
                <FormField id="bucket-cadence" label="Cadence window label">
                  <TextInput value={bucketForm.cadence} onChange={handleBucketFieldChange('cadence')} required />
                </FormField>
                <FormField id="bucket-window" label="Window duration" hint="Measured in hours">
                  <TextInput
                    type="number"
                    min="1"
                    value={bucketForm.windowDurationHours}
                    onChange={handleBucketFieldChange('windowDurationHours')}
                    required
                  />
                </FormField>
                <FormField id="bucket-sort" label="Sort order" hint="Lower values appear first">
                  <TextInput
                    type="number"
                    value={bucketForm.sortOrder}
                    onChange={handleBucketFieldChange('sortOrder')}
                  />
                </FormField>
                <FormField id="bucket-owner" label="Cadence owner">
                  <TextInput value={bucketForm.ownerName} onChange={handleBucketFieldChange('ownerName')} />
                </FormField>
                <FormField id="bucket-role" label="Owner role">
                  <TextInput value={bucketForm.ownerRole} onChange={handleBucketFieldChange('ownerRole')} />
                </FormField>
                <FormField id="bucket-contact" label="Escalation contact">
                  <TextInput value={bucketForm.escalationContact} onChange={handleBucketFieldChange('escalationContact')} />
                </FormField>
                <FormField id="bucket-status" label="Status">
                  <select
                    id="bucket-status"
                    className="fx-text-input"
                    value={bucketForm.status}
                    onChange={handleBucketFieldChange('status')}
                  >
                    <option value="on_track">On track</option>
                    <option value="monitor">Monitor</option>
                    <option value="at_risk">At risk</option>
                  </select>
                </FormField>
                <FormField id="bucket-playbook" label="Runbook URL" optionalLabel="Optional">
                  <TextInput
                    type="url"
                    value={bucketForm.playbookUrl}
                    onChange={handleBucketFieldChange('playbookUrl')}
                  />
                </FormField>
                <FormField id="bucket-hero" label="Hero image" optionalLabel="Optional">
                  <TextInput
                    type="url"
                    value={bucketForm.heroImageUrl}
                    onChange={handleBucketFieldChange('heroImageUrl')}
                    hint="Provide a hosted illustration or chart to surface in the workspace."
                  />
                </FormField>
              </div>

              <FormField
                id="bucket-checklist"
                label="Resolution checklist"
                hint="One item per line. Displayed to reviewers in the dispute workspace."
              >
                <textarea
                  id="bucket-checklist"
                  className="fx-text-input min-h-[120px]"
                  value={bucketForm.checklistText}
                  onChange={handleBucketFieldChange('checklistText')}
                />
              </FormField>

              {bucketForm.playbookUrl ? (
                <div className="flex flex-wrap items-center gap-3 text-sm text-primary/70">
                  <Button
                    href={bucketForm.playbookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="ghost"
                    size="sm"
                    icon={ArrowTopRightOnSquareIcon}
                    iconPosition="end"
                  >
                    Launch dispute runbook
                  </Button>
                </div>
              ) : null}

              {bucketForm.heroImageUrl ? (
                <div className="rounded-2xl border border-accent/10 bg-secondary/40 p-3">
                  <img
                    src={bucketForm.heroImageUrl}
                    alt={`${bucketForm.label} hero`}
                    className="h-48 w-full rounded-2xl object-cover"
                  />
                </div>
              ) : null}
            </form>
          ) : null}

          {selectedBucket && entryForm ? (
            <form
              className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md space-y-4"
              onSubmit={handleEntrySubmit}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-primary">Reporting window metrics</h3>
                  <p className="text-xs text-slate-500">
                    Record escalations, resolutions, and backlog notes for the selected cadence window.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={handleResetEntryWindow} type="button">
                    Start new window
                  </Button>
                  {entryForm.id ? (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={TrashIcon}
                      type="button"
                      onClick={handleDeleteEntry}
                      loading={savingEntry}
                    >
                      Delete window
                    </Button>
                  ) : null}
                  <Button
                    variant="primary"
                    size="sm"
                    icon={DocumentTextIcon}
                    type="submit"
                    loading={savingEntry}
                  >
                    Save metrics
                  </Button>
                </div>
              </div>

              {entryForm.id ? (
                <StatusPill tone="info">
                  Editing window recorded {formatDateLabel(entryForm.periodStart)} → {formatDateLabel(entryForm.periodEnd)}
                </StatusPill>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <FormField id="entry-period-start" label="Period start">
                  <TextInput
                    type="datetime-local"
                    value={entryForm.periodStart}
                    onChange={handleEntryFieldChange('periodStart')}
                    required
                  />
                </FormField>
                <FormField id="entry-period-end" label="Period end">
                  <TextInput
                    type="datetime-local"
                    value={entryForm.periodEnd}
                    onChange={handleEntryFieldChange('periodEnd')}
                    required
                  />
                </FormField>
                <FormField id="entry-escalated" label="Escalated" hint="New disputes escalated in this window">
                  <TextInput
                    type="number"
                    min="0"
                    value={entryForm.escalatedCount}
                    onChange={handleEntryFieldChange('escalatedCount')}
                    required
                  />
                </FormField>
                <FormField id="entry-resolved" label="Resolved" hint="Disputes closed in this window">
                  <TextInput
                    type="number"
                    min="0"
                    value={entryForm.resolvedCount}
                    onChange={handleEntryFieldChange('resolvedCount')}
                    required
                  />
                </FormField>
                <FormField id="entry-reopened" label="Reopened" hint="Reopened disputes">
                  <TextInput
                    type="number"
                    min="0"
                    value={entryForm.reopenedCount}
                    onChange={handleEntryFieldChange('reopenedCount')}
                  />
                </FormField>
                <FormField id="entry-backlog" label="Backlog" hint="Cases still awaiting action">
                  <TextInput
                    type="number"
                    min="0"
                    value={entryForm.backlogCount}
                    onChange={handleEntryFieldChange('backlogCount')}
                  />
                </FormField>
              </div>

              <FormField id="entry-notes" label="Owner notes" optionalLabel="Optional">
                <textarea
                  id="entry-notes"
                  className="fx-text-input min-h-[120px]"
                  value={entryForm.ownerNotes}
                  onChange={handleEntryFieldChange('ownerNotes')}
                />
              </FormField>

              <FormField
                id="entry-attachments"
                label="Evidence attachments"
                hint="One per line. Use `Label | https://link` format."
              >
                <textarea
                  id="entry-attachments"
                  className="fx-text-input min-h-[100px]"
                  value={entryForm.attachmentsText}
                  onChange={handleEntryFieldChange('attachmentsText')}
                />
              </FormField>

              {selectedBucket.latestEntry?.attachments?.length ? (
                <div className="rounded-2xl border border-accent/10 bg-secondary/40 p-4">
                  <h4 className="text-sm font-semibold text-primary">Latest evidence</h4>
                  <ul className="mt-3 space-y-2 text-sm text-primary/70">
                    {selectedBucket.latestEntry.attachments.map((attachment) => (
                      <li key={attachment.id || attachment.url} className="flex items-center justify-between gap-3">
                        <span>{attachment.label}</span>
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
                </div>
              ) : null}
            </form>
          ) : null}

          {selectedBucket ? (
            <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-primary">Historical windows</h3>
                <span className="text-xs uppercase tracking-wide text-primary/60">
                  {selectedBucket.entries?.length ?? 0} entries
                </span>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-secondary text-primary">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">Period</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">Escalated</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">Resolved</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">Backlog</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/10 text-slate-700">
                    {(selectedBucket.entries ?? []).slice(0, 6).map((entry) => {
                      const isSelected = entry.id && entry.id === selectedHistoryEntryId;
                      return (
                        <tr
                          key={entry.id ?? `${entry.periodStart}-${entry.periodEnd}`}
                          className={clsx('align-top cursor-pointer transition hover:bg-primary/5', isSelected && 'bg-primary/10')}
                          onClick={() => handleSelectHistoryEntry(entry)}
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-primary">{formatDateLabel(entry.periodStart)}</p>
                            <p className="text-xs text-primary/60">→ {formatDateLabel(entry.periodEnd)}</p>
                          </td>
                          <td className="px-4 py-3">{formatNumber(entry.escalatedCount)}</td>
                          <td className="px-4 py-3">{formatNumber(entry.resolvedCount)}</td>
                          <td className="px-4 py-3">{formatNumber(entry.backlogCount)}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            {entry.ownerNotes ? entry.ownerNotes : <span className="text-slate-400">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                    {!selectedBucket.entries?.length ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                          No historical entries recorded yet. Capture the first reporting window to populate the timeline.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

DisputeHealthWorkspace.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    data: PropTypes.shape({
      snapshot: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          label: PropTypes.string,
          escalated: PropTypes.number,
          resolved: PropTypes.number,
          status: PropTypes.string,
          commentary: PropTypes.string
        })
      ),
      defaultBucketId: PropTypes.string
    })
  }).isRequired
};

export default DisputeHealthWorkspace;
