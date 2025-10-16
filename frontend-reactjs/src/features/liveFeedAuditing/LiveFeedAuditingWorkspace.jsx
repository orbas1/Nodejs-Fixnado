import PageHeader from '../../components/blueprints/PageHeader.jsx';
import { Button } from '../../components/ui/index.js';
import AuditFiltersPanel from './components/AuditFiltersPanel.jsx';
import AuditSummary from './components/AuditSummary.jsx';
import AuditTable from './components/AuditTable.jsx';
import AuditDetailDrawer from './components/AuditDetailDrawer.jsx';
import CreateAuditDialog from './components/CreateAuditDialog.jsx';
import { useLiveFeedAuditing } from './useLiveFeedAuditing.js';

export default function LiveFeedAuditingWorkspace() {
  const {
    filters,
    setFilterValue,
    toggleFilterValue,
    setPage,
    collectionState,
    summaryCards,
    topZones,
    topActors,
    pagination,
    canGoPrev,
    canGoNext,
    detailState,
    openDetail,
    closeDetail,
    setDetailField,
    setDetailTagsFromString,
    setDetailAttachmentField,
    addDetailAttachment,
    removeDetailAttachment,
    handleDetailSubmit,
    setNoteDraft,
    setNoteTagsDraft,
    addNote,
    beginEditNote,
    cancelEditNote,
    updateNote,
    deleteNote,
    creationState,
    openCreate,
    closeCreate,
    setCreateField,
    setCreateTagsFromString,
    setCreateAttachmentField,
    addCreateAttachment,
    removeCreateAttachment,
    createAudit
  } = useLiveFeedAuditing();

  const handlePrevPage = () => {
    if (!canGoPrev) return;
    setPage((current) => Math.max(1, current - 1));
  };

  const handleNextPage = () => {
    if (!canGoNext) return;
    setPage((current) => current + 1);
  };

  return (
    <div className="pb-16">
      <PageHeader
        title="Live feed auditing"
        description="Monitor and manage every live feed action with full auditability, role assignments, and evidence capture."
        actions={
          <Button variant="primary" onClick={openCreate}>
            Log manual audit event
          </Button>
        }
      />

      <div className="px-6">
        <div className="grid gap-6 lg:grid-cols-5">
          <AuditFiltersPanel
            filters={filters}
            onTimeframeChange={(value) => setFilterValue('timeframe', value)}
            onCustomStartChange={(value) => setFilterValue('customStart', value)}
            onCustomEndChange={(value) => setFilterValue('customEnd', value)}
            onSearchChange={(value) => setFilterValue('search', value)}
            onIncludeNotesChange={(value) => setFilterValue('includeNotes', value)}
            onToggleEventType={(value) => toggleFilterValue('eventTypes', value)}
            onToggleStatus={(value) => toggleFilterValue('statuses', value)}
            onToggleSeverity={(value) => toggleFilterValue('severities', value)}
            onSortFieldChange={(value) => setFilterValue('sortBy', value)}
            onSortDirectionChange={(value) => setFilterValue('sortDirection', value)}
          />

          <AuditSummary summaryCards={summaryCards} topZones={topZones} topActors={topActors} />
        </div>

        <AuditTable
          audits={collectionState.data}
          loading={collectionState.loading}
          error={collectionState.error}
          pagination={pagination}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          onInspect={openDetail}
        />
      </div>

      <AuditDetailDrawer
        open={detailState.open}
        onClose={closeDetail}
        detail={detailState}
        onSubmit={handleDetailSubmit}
        onFieldChange={setDetailField}
        onTagsChange={setDetailTagsFromString}
        onAttachmentChange={setDetailAttachmentField}
        onAddAttachment={addDetailAttachment}
        onRemoveAttachment={removeDetailAttachment}
        onNoteDraftChange={setNoteDraft}
        onNoteTagsChange={setNoteTagsDraft}
        onAddNote={addNote}
        onBeginEditNote={beginEditNote}
        onCancelEditNote={cancelEditNote}
        onUpdateNote={updateNote}
        onDeleteNote={deleteNote}
      />

      <CreateAuditDialog
        open={creationState.open}
        creation={creationState}
        onClose={closeCreate}
        onSubmit={createAudit}
        onFieldChange={setCreateField}
        onTagsChange={setCreateTagsFromString}
        onAttachmentChange={setCreateAttachmentField}
        onAddAttachment={addCreateAttachment}
        onRemoveAttachment={removeCreateAttachment}
      />
    </div>
  );
}
