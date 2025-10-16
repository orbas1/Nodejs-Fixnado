import { ArrowPathIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/blueprints/PageHeader.jsx';
import useAdminRentalWorkspace from './hooks/useAdminRentalWorkspace.js';
import {
  STATUS_FILTERS,
  DEPOSIT_STATUS_TONE,
  RENTAL_STATUS_TONE,
  DEPOSIT_STATUS_OPTIONS,
  INSPECTION_OUTCOMES,
  CHECKPOINT_TYPES
} from './constants.js';
import RentalListPanel from './components/RentalListPanel.jsx';
import RentalDetailPanel from './components/RentalDetailPanel.jsx';
import RentalCreateCard from './components/RentalCreateCard.jsx';

export default function AdminRentalWorkspace() {
  const workspace = useAdminRentalWorkspace();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-secondary/60 to-white">
      <PageHeader
        eyebrow="Admin control centre"
        title="Rental management"
        description="Oversee asset rentals, lifecycle checkpoints, deposits, and operational readiness across tenants."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Rental management' }
        ]}
        actions={[
          {
            label: 'Refresh data',
            icon: ArrowPathIcon,
            onClick: workspace.reloadList
          }
        ]}
        meta={workspace.headerMeta}
      />

      <main className="mx-auto max-w-7xl px-6 py-10 space-y-10">
        <section className="grid gap-10 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <RentalListPanel
            statusFilter={workspace.statusFilter}
            onStatusFilterChange={workspace.setStatusFilter}
            statusOptions={STATUS_FILTERS}
            searchTerm={workspace.searchTerm}
            onSearchTermChange={workspace.setSearchTerm}
            listState={workspace.listState}
            rentals={workspace.filteredRentals}
            selectedRentalId={workspace.selectedRentalId}
            onSelectRental={workspace.handleSelectRental}
            depositStatusTone={DEPOSIT_STATUS_TONE}
            rentalStatusTone={RENTAL_STATUS_TONE}
          />
          <RentalDetailPanel
            rental={workspace.selectedRental}
            selectedState={workspace.selectedState}
            actionLoading={workspace.actionLoading}
            detailStatus={workspace.detailStatus}
            clearDetailStatus={workspace.clearDetailStatus}
            onOpenNewWindow={workspace.handleOpenNewWindow}
            canApprove={workspace.canApprove}
            canSchedule={workspace.canSchedule}
            canCheckout={workspace.canCheckout}
            canReturn={workspace.canReturn}
            canInspect={workspace.canInspect}
            canCancel={workspace.canCancel}
            approveForm={workspace.approveForm}
            onApproveFormChange={workspace.setApproveForm}
            pickupForm={workspace.pickupForm}
            onPickupFormChange={workspace.setPickupForm}
            checkoutForm={workspace.checkoutForm}
            onCheckoutFormChange={workspace.setCheckoutForm}
            returnForm={workspace.returnForm}
            onReturnFormChange={workspace.setReturnForm}
            inspectionForm={workspace.inspectionForm}
            onInspectionFormChange={workspace.setInspectionForm}
            cancelForm={workspace.cancelForm}
            onCancelFormChange={workspace.setCancelForm}
            checkpointForm={workspace.checkpointForm}
            onCheckpointFormChange={workspace.setCheckpointForm}
            scheduleForm={workspace.scheduleForm}
            onScheduleFormChange={workspace.setScheduleForm}
            financialForm={workspace.financialForm}
            onFinancialFormChange={workspace.setFinancialForm}
            associationForm={workspace.associationForm}
            onAssociationFormChange={workspace.setAssociationForm}
            updateStatus={workspace.updateStatus}
            onApprove={workspace.handleApprove}
            onSchedule={workspace.handleSchedule}
            onCheckout={workspace.handleCheckout}
            onReturn={workspace.handleReturn}
            onInspect={workspace.handleInspection}
            onCancel={workspace.handleCancel}
            onCheckpoint={workspace.handleCheckpoint}
            onUpdateSchedule={workspace.handleUpdateSchedule}
            onUpdateFinancial={workspace.handleUpdateFinancial}
            onUpdateAssociations={workspace.handleUpdateAssociations}
            reloadSelected={workspace.reloadSelected}
            depositStatusTone={DEPOSIT_STATUS_TONE}
            statusTone={RENTAL_STATUS_TONE}
            depositStatusOptions={DEPOSIT_STATUS_OPTIONS}
            inspectionOutcomes={INSPECTION_OUTCOMES}
            checkpointTypes={CHECKPOINT_TYPES}
          />
        </section>
        <RentalCreateCard
          form={workspace.createForm}
          onChange={workspace.setCreateForm}
          onSubmit={workspace.handleCreateRental}
          status={workspace.createStatus}
        />
      </main>
    </div>
  );
}
