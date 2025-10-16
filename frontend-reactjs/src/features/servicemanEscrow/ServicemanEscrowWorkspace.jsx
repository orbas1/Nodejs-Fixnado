import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { Button, Card, StatusPill } from '../../components/ui/index.js';
import EscrowList from '../escrowManagement/components/EscrowList.jsx';
import EscrowDetail from '../escrowManagement/components/EscrowDetail.jsx';
import ServicemanEscrowFilters from './components/ServicemanEscrowFilters.jsx';
import WorkLogsPanel from './components/WorkLogsPanel.jsx';
import useServicemanEscrows from './hooks/useServicemanEscrows.js';

function UpcomingEscrows({ items, onSelect }) {
  if (!items.length) {
    return (
      <Card className="border-slate-200 bg-white/90 p-5">
        <h3 className="text-lg font-semibold text-primary">Upcoming releases</h3>
        <p className="mt-3 text-sm text-slate-500">No release checkpoints scheduled. Keep logging progress to surface finance-ready items.</p>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white/90 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">Upcoming releases</h3>
        <StatusPill tone="info">{items.length} queued</StatusPill>
      </div>
      <ul className="mt-4 space-y-3 text-sm">
        {items.map((entry) => {
          const scheduled = entry.autoReleaseAt ? new Date(entry.autoReleaseAt).toLocaleString() : 'Schedule TBC';
          return (
            <li key={entry.id} className="rounded-2xl border border-slate-200 bg-secondary/70 p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-primary">{entry.title}</p>
                    <p className="text-xs text-slate-500">{scheduled}</p>
                  </div>
                  <StatusPill tone={entry.status === 'released' ? 'success' : entry.status === 'disputed' ? 'danger' : 'info'}>
                    {entry.status}
                  </StatusPill>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{entry.amountFormatted ?? '—'}</span>
                  <Button type="button" size="xs" variant="ghost" onClick={() => onSelect(entry)}>
                    Open escrow
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

UpcomingEscrows.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      autoReleaseAt: PropTypes.string,
      amountFormatted: PropTypes.string,
      status: PropTypes.string
    })
  ),
  onSelect: PropTypes.func.isRequired
};

UpcomingEscrows.defaultProps = {
  items: []
};

export default function ServicemanEscrowWorkspace({ section }) {
  const {
    filters,
    updateFilter,
    listPayload,
    loading,
    error,
    selectedId,
    setSelectedId,
    selected,
    selectedLoading,
    detailDraft,
    updateDetailField,
    saveDetails,
    savingDetails,
    milestoneDraft,
    changeMilestoneDraft,
    changeMilestoneLocal,
    createMilestone,
    updateMilestone,
    removeMilestone,
    addNote,
    removeNote,
    toggleNote,
    noteSaving,
    refreshList,
    createWorkLog,
    updateWorkLog,
    deleteWorkLog,
    workLogSaving,
    summaryCards,
    availablePolicies,
    pagination,
    setPage
  } = useServicemanEscrows({ initialSelectionId: section?.data?.focusId ?? null });

  const cards = useMemo(() => {
    if (summaryCards.length > 0) {
      return summaryCards;
    }
    const snapshot = section?.data?.summary;
    if (!snapshot) {
      return [];
    }
    return [
      {
        id: 'total',
        label: 'Escrow value',
        helper: 'Snapshot from analytics',
        value: snapshot.totalAmountFormatted ?? '—'
      },
      {
        id: 'ready',
        label: 'Ready for release',
        helper: 'Funded & clear of holds',
        value: snapshot.readyForRelease ?? 0
      },
      {
        id: 'holds',
        label: 'On hold',
        helper: 'Requires review',
        value: snapshot.onHold ?? 0
      },
      {
        id: 'active',
        label: 'Active milestones',
        helper: 'Awaiting approvals',
        value: snapshot.active ?? 0
      }
    ];
  }, [section, summaryCards]);

  const upcoming = useMemo(() => {
    if (Array.isArray(listPayload?.items) && listPayload.items.length > 0) {
      return listPayload.items
        .filter((item) => item.autoReleaseAt)
        .sort((a, b) => new Date(a.autoReleaseAt) - new Date(b.autoReleaseAt))
        .slice(0, 5)
        .map((item) => ({
          id: item.id,
          title: item.order?.title || item.order?.service?.title || 'Escrow',
          autoReleaseAt: item.autoReleaseAt,
          amountFormatted: item.amountFormatted,
          status: item.status
        }));
    }
    return Array.isArray(section?.data?.upcoming) ? section.data.upcoming : [];
  }, [listPayload, section]);

  const milestoneOptions = useMemo(() => {
    if (!Array.isArray(selected?.milestones)) {
      return [];
    }
    return selected.milestones.map((milestone) => ({ id: milestone.id, label: milestone.label || 'Milestone' }));
  }, [selected]);

  const handlePageChange = (nextPage) => {
    const numeric = Number.parseInt(nextPage, 10);
    if (!Number.isFinite(numeric)) {
      return;
    }
    const totalPages = pagination?.totalPages ?? 1;
    const safePage = Math.min(Math.max(numeric, 1), totalPages);
    setPage(safePage);
  };

  const handleUpcomingSelect = (entry) => {
    if (!entry?.id) {
      return;
    }
    setSelectedId(entry.id);
    refreshList({ focusId: entry.id });
  };

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-primary">{section?.label ?? 'Escrow management'}</h2>
          <p className="max-w-3xl text-sm text-slate-600">
            {section?.description ?? 'Track escrow readiness, milestone evidence, and finance coordination without leaving your cockpit.'}
          </p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={() => refreshList()} disabled={loading}>
          Refresh data
        </Button>
      </div>

      {cards.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.id} className="border-slate-200 bg-white/90 p-5">
              <p className="text-xs uppercase tracking-wide text-primary/60">{card.label}</p>
              <p className="mt-3 text-2xl font-semibold text-primary">{card.value}</p>
              {card.helper ? <p className="mt-2 text-xs text-slate-500">{card.helper}</p> : null}
            </Card>
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <ServicemanEscrowFilters
            filters={filters}
            onFilterChange={updateFilter}
            policies={availablePolicies}
            onRefresh={() => refreshList()}
            loading={loading}
            error={error}
          />
          <EscrowList
            items={listPayload?.items ?? []}
            loading={loading}
            selectedId={selectedId}
            onSelect={setSelectedId}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </div>
        <UpcomingEscrows items={upcoming} onSelect={handleUpcomingSelect} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <EscrowDetail
            selected={selected}
            selectedLoading={selectedLoading}
            detailDraft={detailDraft}
            onFieldChange={updateDetailField}
            onSaveDetails={saveDetails}
            savingDetails={savingDetails}
            availablePolicies={availablePolicies}
            milestoneDraft={milestoneDraft}
            onMilestoneDraftChange={changeMilestoneDraft}
            onCreateMilestone={createMilestone}
            onMilestoneChange={changeMilestoneLocal}
            onPersistMilestone={(milestone) =>
              updateMilestone(milestone.id, {
                label: milestone.label,
                status: milestone.status,
                amount: milestone.amount,
                dueAt: milestone.dueAt,
                sequence: milestone.sequence
              })
            }
            onDeleteMilestone={(milestone) => removeMilestone(milestone.id)}
            onAddNote={addNote}
            onDeleteNote={removeNote}
            onToggleNote={toggleNote}
            noteSaving={noteSaving}
          />
        </div>
        <WorkLogsPanel
          logs={selected?.workLogs ?? []}
          milestones={milestoneOptions}
          onCreate={createWorkLog}
          onUpdate={updateWorkLog}
          onDelete={deleteWorkLog}
          saving={workLogSaving}
        />
      </div>
    </section>
  );
}

ServicemanEscrowWorkspace.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
    data: PropTypes.shape({
      summary: PropTypes.shape({
        totalAmountFormatted: PropTypes.string,
        readyForRelease: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        onHold: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        active: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
      }),
      upcoming: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          title: PropTypes.string,
          autoReleaseAt: PropTypes.string,
          amountFormatted: PropTypes.string,
          status: PropTypes.string
        })
      ),
      focusId: PropTypes.string
    })
  }).isRequired
};
