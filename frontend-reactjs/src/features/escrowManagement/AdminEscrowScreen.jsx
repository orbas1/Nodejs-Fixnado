import { useState, useCallback } from 'react';
import PageHeader from '../../components/blueprints/PageHeader.jsx';
import { Button, StatusPill } from '../../components/ui/index.js';
import { useAdminSession } from '../../providers/AdminSessionProvider.jsx';
import EscrowFilters from './components/EscrowFilters.jsx';
import EscrowList from './components/EscrowList.jsx';
import EscrowDetail from './components/EscrowDetail.jsx';
import ManualEscrowForm from './components/ManualEscrowForm.jsx';
import ReleasePoliciesGrid from './components/ReleasePoliciesGrid.jsx';
import ReleasePolicyModal from './components/ReleasePolicyModal.jsx';
import { useEscrowManagement } from './hooks/useEscrowManagement.js';

export default function AdminEscrowScreen() {
  useAdminSession();
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
    refreshList,
    releasePolicies,
    policiesLoading,
    policySaving,
    policyError,
    refreshPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    createForm,
    updateCreateField,
    updateCreateMilestone,
    addCreateMilestone,
    removeCreateMilestone,
    submitCreateForm,
    creatingRecord,
    resetCreateForm
  } = useEscrowManagement();
  const [creating, setCreating] = useState(false);
  const [policyModal, setPolicyModal] = useState({ open: false, mode: 'create', policy: null });

  const handlePageChange = useCallback(
    (nextPage) => {
      setPage(Math.max(1, Math.min(nextPage, listPayload?.pagination?.totalPages ?? nextPage)));
    },
    [setPage, listPayload]
  );

  const handleManualSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const created = await submitCreateForm();
      if (created) {
        setCreating(false);
        setSelectedId(created.id);
      }
    },
    [submitCreateForm, setSelectedId]
  );

  const handleCancelManual = useCallback(() => {
    setCreating(false);
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
      const confirmationMessage = `Delete the "${policy.name}" release policy? This action cannot be undone and will affect manual escrows.`;
      const confirmed = typeof window === 'undefined' ? true : window.confirm(confirmationMessage);
      if (!confirmed) {
        return;
      }
      await deletePolicy(policy.id);
    },
    [deletePolicy]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        eyebrow="Admin control tower"
        title="Escrow management"
        description="Review escrow health, configure release policies, and manage compliance notes across the Fixnado network."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Escrow management' }
        ]}
        actions={[
          {
            label: creating ? 'Cancel manual escrow' : 'Create manual escrow',
            variant: creating ? 'ghost' : 'secondary',
            onClick: () => {
              setCreating((value) => !value);
              resetCreateForm();
            }
          }
        ]}
        meta={headerMeta}
      />

      <main className="mx-auto max-w-7xl px-6 py-12 space-y-12">
        {error ? <StatusPill tone="danger">{error}</StatusPill> : null}

        {creating ? (
          <ManualEscrowForm
            form={createForm}
            availablePolicies={availablePolicies}
            onFieldChange={updateCreateField}
            onMilestoneChange={updateCreateMilestone}
            onAddMilestone={addCreateMilestone}
            onRemoveMilestone={removeCreateMilestone}
            onSubmit={handleManualSubmit}
            onCancel={handleCancelManual}
            submitting={creatingRecord}
          />
        ) : null}

        <section className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-primary">Escrow console</h2>
              <p className="text-sm text-slate-600">
                Operate escrow releases, manage disputes, and align evidence checkpoints with milestone delivery.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" size="sm" variant="ghost" onClick={() => refreshList()} disabled={loading}>
                Refresh list
              </Button>
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

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <EscrowList
              items={listPayload?.items ?? []}
              loading={loading}
              selectedId={selectedId}
              onSelect={setSelectedId}
              pagination={listPayload?.pagination ?? { page: pagination.page, totalPages: 1 }}
              onPageChange={handlePageChange}
            />
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
                onPersistMilestone={persistMilestone}
                onDeleteMilestone={removeMilestone}
                onAddNote={addNote}
                onDeleteNote={deleteNote}
                onToggleNote={toggleNotePin}
                noteSaving={noteSaving}
              />
            </div>
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
      </main>
    </div>
  );
}
