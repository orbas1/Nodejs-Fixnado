import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  addProviderEscrowNote,
  createProviderEscrow,
  createProviderReleasePolicy,
  deleteProviderEscrowMilestone,
  deleteProviderEscrowNote,
  deleteProviderReleasePolicy,
  fetchProviderEscrow,
  fetchProviderEscrows,
  fetchProviderReleasePolicies,
  upsertProviderEscrowMilestone,
  updateProviderEscrow,
  updateProviderReleasePolicy
} from '../../api/providerEscrowClient.js';
import { Button, Card, StatusPill } from '../../components/ui/index.js';
import EscrowFilters from './components/EscrowFilters.jsx';
import EscrowList from './components/EscrowList.jsx';
import EscrowDetail from './components/EscrowDetail.jsx';
import ManualEscrowForm from './components/ManualEscrowForm.jsx';
import ReleasePoliciesGrid from './components/ReleasePoliciesGrid.jsx';
import ReleasePolicyModal from './components/ReleasePolicyModal.jsx';
import { useEscrowManagement } from './hooks/useEscrowManagement.js';

const providerEscrowApi = {
  fetchEscrows: fetchProviderEscrows,
  fetchEscrow: fetchProviderEscrow,
  createEscrow: createProviderEscrow,
  updateEscrowRecord: updateProviderEscrow,
  addEscrowNoteRecord: addProviderEscrowNote,
  deleteEscrowNoteRecord: deleteProviderEscrowNote,
  upsertEscrowMilestoneRecord: upsertProviderEscrowMilestone,
  deleteEscrowMilestoneRecord: deleteProviderEscrowMilestone,
  fetchReleasePolicies: fetchProviderReleasePolicies,
  createReleasePolicyRecord: createProviderReleasePolicy,
  updateReleasePolicyRecord: updateProviderReleasePolicy,
  deleteReleasePolicyRecord: deleteProviderReleasePolicy
};

function SummaryCard({ item }) {
  return (
    <Card className={`space-y-2 border-slate-200 bg-white/90 p-5 ${item.emphasis ? 'shadow-md' : 'shadow-sm'}`}>
      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{item.label}</p>
      <p className="text-2xl font-semibold text-primary">{item.value}</p>
      {item.caption ? <p className="text-xs text-slate-500">{item.caption}</p> : null}
    </Card>
  );
}

SummaryCard.propTypes = {
  item: PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    caption: PropTypes.string,
    emphasis: PropTypes.bool
  }).isRequired
};

export default function ProviderEscrowWorkspace({ section }) {
  const {
    filters,
    updateFilter,
    pagination,
    setPage,
    listPayload,
    loading,
    error,
    availablePolicies,
    headerMeta,
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
    createMilestone,
    changeMilestoneLocal,
    persistMilestone,
    removeMilestone,
    addNote,
    deleteNote,
    toggleNotePin,
    noteSaving,
    releasePolicies,
    policiesLoading,
    policySaving,
    policyError,
    refreshPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    refreshList,
    createForm,
    updateCreateField,
    updateCreateMilestone,
    addCreateMilestone,
    removeCreateMilestone,
    submitCreateForm,
    creatingRecord,
    resetCreateForm
  } = useEscrowManagement(providerEscrowApi);

  const [creatingManual, setCreatingManual] = useState(false);
  const [policyModal, setPolicyModal] = useState({ open: false, mode: 'create', policy: null });

  const handlePageChange = useCallback(
    (nextPage) => {
      setPage(Math.max(1, Math.min(nextPage, listPayload?.pagination?.totalPages ?? nextPage)));
    },
    [listPayload?.pagination?.totalPages, setPage]
  );

  const handleSubmitManual = useCallback(
    async (event) => {
      event.preventDefault();
      const created = await submitCreateForm();
      if (created) {
        setCreatingManual(false);
        setSelectedId(created.id);
      }
    },
    [submitCreateForm, setSelectedId]
  );

  const handleCancelManual = useCallback(() => {
    setCreatingManual(false);
    resetCreateForm();
  }, [resetCreateForm]);

  const openCreatePolicy = useCallback(() => {
    setPolicyModal({ open: true, mode: 'create', policy: null });
  }, []);

  const openEditPolicy = useCallback((policy) => {
    setPolicyModal({ open: true, mode: 'edit', policy });
  }, []);

  const closePolicyModal = useCallback(() => {
    setPolicyModal({ open: false, mode: 'create', policy: null });
  }, []);

  const handlePolicySubmit = useCallback(
    async (payload) => {
      if (policyModal.mode === 'edit' && policyModal.policy) {
        const updated = await updatePolicy(policyModal.policy.id, payload);
        if (updated) {
          closePolicyModal();
        }
        return updated;
      }
      const createdPolicy = await createPolicy(payload);
      if (createdPolicy) {
        closePolicyModal();
      }
      return createdPolicy;
    },
    [policyModal, updatePolicy, createPolicy, closePolicyModal]
  );

  const handleDeletePolicy = useCallback(
    async (policy) => {
      if (!policy) {
        return;
      }
      const confirmed = typeof window === 'undefined' ? true : window.confirm(`Delete the "${policy.name}" policy?`);
      if (!confirmed) {
        return;
      }
      await deletePolicy(policy.id);
    },
    [deletePolicy]
  );

  const sectionTitle = section?.label || 'Escrow management';
  const sectionDescription =
    section?.description ||
    'Track escrow funding, ensure evidence is captured, and release funds in line with provider governance.';

  const summaryItems = useMemo(() => headerMeta ?? [], [headerMeta]);
  const restricted = Boolean(listPayload?.meta?.restricted);

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Provider command centre</p>
          <h2 className="text-2xl font-semibold text-primary">{sectionTitle}</h2>
          <p className="text-sm text-slate-600 max-w-3xl">{sectionDescription}</p>
        </div>
        {summaryItems.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryItems.map((item) => (
              <SummaryCard key={item.label} item={item} />
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" size="sm" variant="ghost" onClick={() => refreshList()} disabled={loading}>
            Refresh escrows
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setCreatingManual((value) => !value);
              resetCreateForm();
            }}
            variant={creatingManual ? 'ghost' : 'secondary'}
          >
            {creatingManual ? 'Cancel manual escrow' : 'Create manual escrow'}
          </Button>
        </div>
        {error ? <StatusPill tone="danger">{error}</StatusPill> : null}
        {restricted ? (
          <StatusPill tone="warning">
            Access limited. Escrow records will appear once this provider is linked to live service orders.
          </StatusPill>
        ) : null}
      </div>

      {creatingManual ? (
        <ManualEscrowForm
          form={createForm}
          availablePolicies={availablePolicies}
          onFieldChange={updateCreateField}
          onMilestoneChange={updateCreateMilestone}
          onAddMilestone={addCreateMilestone}
          onRemoveMilestone={removeCreateMilestone}
          onSubmit={handleSubmitManual}
          onCancel={handleCancelManual}
          submitting={creatingRecord}
        />
      ) : null}

      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-primary">Escrow pipeline</h3>
            <p className="text-sm text-slate-600">
              Search, filter, and update live escrows tied to your provider orders. Selecting a record opens the detail workspace
              for edits.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {listPayload?.meta?.fallback ? <StatusPill tone="neutral">Offline snapshot</StatusPill> : null}
            {listPayload?.meta?.fromCache && !listPayload?.meta?.fallback ? (
              <StatusPill tone="neutral">Cached</StatusPill>
            ) : null}
          </div>
        </div>

        <EscrowFilters
          filters={filters}
          onFilterChange={updateFilter}
          availablePolicies={availablePolicies}
          onRefresh={() => refreshList()}
          loading={loading}
          isFallback={Boolean(listPayload?.meta?.fallback)}
          servedFromCache={Boolean(listPayload?.meta?.fromCache && !listPayload?.meta?.fallback)}
          error={null}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <EscrowList
            loading={loading}
            escrows={listPayload?.items ?? []}
            pagination={listPayload?.pagination ?? pagination}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onPageChange={handlePageChange}
            onRefresh={() => refreshList()}
          />
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
            onPersistMilestone={persistMilestone}
            onDeleteMilestone={removeMilestone}
            onAddNote={addNote}
            onDeleteNote={deleteNote}
            onToggleNote={toggleNotePin}
            noteSaving={noteSaving}
          />
        </div>
      </section>

      <ReleasePoliciesGrid
        policies={releasePolicies}
        loading={policiesLoading}
        managing={policySaving}
        error={policyError}
        onCreate={openCreatePolicy}
        onEdit={openEditPolicy}
        onDelete={handleDeletePolicy}
        onRefresh={refreshPolicies}
      />

      <ReleasePolicyModal
        open={policyModal.open}
        mode={policyModal.mode}
        initialPolicy={policyModal.policy}
        onClose={closePolicyModal}
        onSubmit={handlePolicySubmit}
        submitting={policySaving}
        error={policyError}
      />
    </div>
  );
}

ProviderEscrowWorkspace.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string
  })
};

ProviderEscrowWorkspace.defaultProps = {
  section: null
};

