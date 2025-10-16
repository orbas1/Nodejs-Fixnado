import PropTypes from 'prop-types';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Button, FormField, StatusPill, TextInput, Spinner } from '../../../components/ui/index.js';
import RentalTimeline from './RentalTimeline.jsx';
import { formatCurrency, formatDateTime, formatRelative, toFriendlyLabel } from '../utils.js';

function DepositSummary({ rental, depositStatusTone }) {
  if (!rental) return null;
  const tone = depositStatusTone[rental.depositStatus] ?? 'neutral';
  const depositLabel =
    rental.depositAmount != null ? formatCurrency(rental.depositAmount, rental.depositCurrency) : '—';
  return (
    <div className="space-y-2 rounded-2xl border border-accent/20 bg-secondary/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-primary">Deposit tracking</p>
        <StatusPill tone={tone}>{toFriendlyLabel(rental.depositStatus)}</StatusPill>
      </div>
      <dl className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-500">Deposit amount</dt>
          <dd className="mt-1 text-sm text-primary">{depositLabel}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Daily rate</dt>
          <dd className="mt-1 text-sm text-primary">
            {rental.dailyRate != null ? formatCurrency(rental.dailyRate, rental.rateCurrency) : '—'}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Rental window</dt>
          <dd className="mt-1">
            {formatDateTime(rental.rentalStartAt)} → {formatDateTime(rental.returnDueAt || rental.rentalEndAt)}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Last status update</dt>
          <dd className="mt-1">{formatRelative(rental.lastStatusTransitionAt) || '—'}</dd>
        </div>
      </dl>
    </div>
  );
}

DepositSummary.propTypes = {
  rental: PropTypes.object,
  depositStatusTone: PropTypes.object.isRequired
};

DepositSummary.defaultProps = {
  rental: null
};

function DetailMessage({ detailStatus, onClear }) {
  if (!detailStatus) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/80 p-3">
      <StatusPill tone={detailStatus.tone}>{detailStatus.message}</StatusPill>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}

DetailMessage.propTypes = {
  detailStatus: PropTypes.shape({
    tone: PropTypes.string,
    message: PropTypes.string
  }),
  onClear: PropTypes.func.isRequired
};

DetailMessage.defaultProps = {
  detailStatus: null
};

export default function RentalDetailPanel({
  rental,
  selectedState,
  actionLoading,
  detailStatus,
  clearDetailStatus,
  onOpenNewWindow,
  canApprove,
  canSchedule,
  canCheckout,
  canReturn,
  canInspect,
  canCancel,
  approveForm,
  onApproveFormChange,
  pickupForm,
  onPickupFormChange,
  checkoutForm,
  onCheckoutFormChange,
  returnForm,
  onReturnFormChange,
  inspectionForm,
  onInspectionFormChange,
  cancelForm,
  onCancelFormChange,
  checkpointForm,
  onCheckpointFormChange,
  scheduleForm,
  onScheduleFormChange,
  financialForm,
  onFinancialFormChange,
  associationForm,
  onAssociationFormChange,
  updateStatus,
  onApprove,
  onSchedule,
  onCheckout,
  onReturn,
  onInspect,
  onCancel,
  onCheckpoint,
  onUpdateSchedule,
  onUpdateFinancial,
  onUpdateAssociations,
  reloadSelected,
  depositStatusTone,
  statusTone,
  depositStatusOptions,
  inspectionOutcomes,
  checkpointTypes
}) {
  if (selectedState.loading) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading rental details…
        </div>
      </div>
    );
  }

  if (selectedState.error) {
    return (
      <div className="space-y-4 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
        <h2 className="text-lg font-semibold">Unable to load rental</h2>
        <p className="text-sm">{selectedState.error.message || 'An unexpected error occurred.'}</p>
        <Button variant="secondary" onClick={reloadSelected}>
          Retry
        </Button>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-primary/5">
        <h2 className="text-xl font-semibold text-primary">Select a rental to manage</h2>
        <p className="text-sm text-slate-600">
          Choose a rental from the agreements table to view lifecycle status, deposits, and available actions.
        </p>
      </div>
    );
  }

  const timeline = rental.timeline ?? rental.timelinePreview ?? [];

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-primary/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-primary">{rental.rentalNumber}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusPill tone={statusTone[rental.status] ?? 'info'}>{toFriendlyLabel(rental.status)}</StatusPill>
              <StatusPill tone={depositStatusTone[rental.depositStatus] ?? 'neutral'}>
                Deposit {toFriendlyLabel(rental.depositStatus)}
              </StatusPill>
              <StatusPill tone="neutral">Qty {rental.quantity}</StatusPill>
            </div>
            <dl className="mt-6 grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
              <div>
                <dt className="font-medium text-slate-500">Asset</dt>
                <dd className="mt-1 text-sm text-primary">{rental.item?.name || 'Unassigned asset'}</dd>
                <p className="text-xs text-slate-500">SKU: {rental.item?.sku || '—'}</p>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Booking</dt>
                <dd className="mt-1 text-sm text-primary">{rental.booking?.id || rental.bookingId || '—'}</dd>
                <p className="text-xs text-slate-500">Reference: {rental.booking?.reference || '—'}</p>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Renter</dt>
                <dd className="mt-1 text-sm text-primary">{rental.renterId || '—'}</dd>
                <p className="text-xs text-slate-500">Company: {rental.companyId || '—'}</p>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Lifecycle</dt>
                <dd className="mt-1">
                  {formatDateTime(rental.pickupAt || rental.rentalStartAt)} → {formatDateTime(rental.returnDueAt || rental.rentalEndAt)}
                </dd>
              </div>
            </dl>
          </div>
          <div className="flex flex-col items-end gap-3">
            <Button variant="secondary" icon={ArrowTopRightOnSquareIcon} onClick={onOpenNewWindow}>
              Open in new window
            </Button>
            <Button variant="ghost" onClick={reloadSelected}>
              Refresh rental
            </Button>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <DepositSummary rental={rental} depositStatusTone={depositStatusTone} />
          <DetailMessage detailStatus={detailStatus} onClear={clearDetailStatus} />
        </div>
      </div>

      <div className="space-y-6">
        <form onSubmit={onUpdateSchedule} className="rounded-2xl border border-slate-200 bg-white/90 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-primary">Scheduling windows</p>
            <Button type="submit" disabled={updateStatus.schedule.loading}>
              {updateStatus.schedule.loading ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Update rental, pickup, and return windows. Use local timezone values.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <TextInput
              label="Rental start"
              type="datetime-local"
              value={scheduleForm.rentalStartAt}
              onChange={(event) => onScheduleFormChange((current) => ({ ...current, rentalStartAt: event.target.value }))}
            />
            <TextInput
              label="Rental end"
              type="datetime-local"
              value={scheduleForm.rentalEndAt}
              onChange={(event) => onScheduleFormChange((current) => ({ ...current, rentalEndAt: event.target.value }))}
            />
            <TextInput
              label="Pickup at"
              type="datetime-local"
              value={scheduleForm.pickupAt}
              onChange={(event) => onScheduleFormChange((current) => ({ ...current, pickupAt: event.target.value }))}
            />
            <TextInput
              label="Return due"
              type="datetime-local"
              value={scheduleForm.returnDueAt}
              onChange={(event) => onScheduleFormChange((current) => ({ ...current, returnDueAt: event.target.value }))}
            />
          </div>
          {updateStatus.schedule.notice ? (
            <p
              className={`mt-3 text-xs font-semibold ${
                updateStatus.schedule.notice.tone === 'success' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {updateStatus.schedule.notice.message}
            </p>
          ) : null}
        </form>

        <form onSubmit={onUpdateFinancial} className="rounded-2xl border border-slate-200 bg-white/90 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-primary">Financial terms</p>
            <Button type="submit" disabled={updateStatus.financial.loading}>
              {updateStatus.financial.loading ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Update deposit tracking, currencies, and contract rates.</p>
          <div className="mt-4 grid gap-3">
            <TextInput
              label="Deposit amount"
              type="number"
              inputMode="decimal"
              value={financialForm.depositAmount}
              onChange={(event) => onFinancialFormChange((current) => ({ ...current, depositAmount: event.target.value }))}
            />
            <TextInput
              label="Deposit currency"
              value={financialForm.depositCurrency}
              onChange={(event) => onFinancialFormChange((current) => ({ ...current, depositCurrency: event.target.value }))}
              placeholder="e.g. GBP"
            />
            <FormField id="deposit-status" label="Deposit status">
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600 focus:border-primary focus:outline-none"
                value={financialForm.depositStatus}
                onChange={(event) => onFinancialFormChange((current) => ({ ...current, depositStatus: event.target.value }))}
              >
                {depositStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
            <TextInput
              label="Daily rate"
              type="number"
              inputMode="decimal"
              value={financialForm.dailyRate}
              onChange={(event) => onFinancialFormChange((current) => ({ ...current, dailyRate: event.target.value }))}
            />
            <TextInput
              label="Rate currency"
              value={financialForm.rateCurrency}
              onChange={(event) => onFinancialFormChange((current) => ({ ...current, rateCurrency: event.target.value }))}
              placeholder="e.g. GBP"
            />
          </div>
          {updateStatus.financial.notice ? (
            <p
              className={`mt-3 text-xs font-semibold ${
                updateStatus.financial.notice.tone === 'success' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {updateStatus.financial.notice.message}
            </p>
          ) : null}
        </form>

        <form onSubmit={onUpdateAssociations} className="rounded-2xl border border-slate-200 bg-white/90 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-primary">Associations & notes</p>
            <Button type="submit" disabled={updateStatus.associations.loading}>
              {updateStatus.associations.loading ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Link bookings, adjust ownership, and capture operator guidance.</p>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <TextInput
              label="Booking ID"
              value={associationForm.bookingId}
              onChange={(event) => onAssociationFormChange((current) => ({ ...current, bookingId: event.target.value }))}
            />
            <TextInput
              label="Marketplace item ID"
              value={associationForm.marketplaceItemId}
              onChange={(event) => onAssociationFormChange((current) => ({ ...current, marketplaceItemId: event.target.value }))}
            />
            <TextInput
              label="Region ID"
              value={associationForm.regionId}
              onChange={(event) => onAssociationFormChange((current) => ({ ...current, regionId: event.target.value }))}
            />
            <TextInput
              label="Renter ID"
              value={associationForm.renterId}
              onChange={(event) => onAssociationFormChange((current) => ({ ...current, renterId: event.target.value }))}
            />
            <TextInput
              label="Company ID"
              value={associationForm.companyId}
              onChange={(event) => onAssociationFormChange((current) => ({ ...current, companyId: event.target.value }))}
            />
          </div>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Logistics notes
            <textarea
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600 focus:border-primary focus:outline-none"
              rows="2"
              value={associationForm.logisticsNotes}
              onChange={(event) => onAssociationFormChange((current) => ({ ...current, logisticsNotes: event.target.value }))}
            />
          </label>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Internal notes
            <textarea
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600 focus:border-primary focus:outline-none"
              rows="3"
              value={associationForm.notes}
              onChange={(event) => onAssociationFormChange((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>
          {updateStatus.associations.notice ? (
            <p
              className={`mt-3 text-xs font-semibold ${
                updateStatus.associations.notice.tone === 'success' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {updateStatus.associations.notice.message}
            </p>
          ) : null}
        </form>
      </div>

      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-primary">Lifecycle actions</h3>
        </div>
        <div className="space-y-6">
          <form onSubmit={onApprove} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-primary">Approve rental</p>
              <Button type="submit" disabled={!canApprove || actionLoading === 'approve'}>
                {actionLoading === 'approve' ? 'Approving…' : 'Approve'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Approve requested rentals to notify provider operations and reserve the asset.</p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Approval notes
              <textarea
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600 focus:border-primary focus:outline-none"
                rows="2"
                value={approveForm.notes}
                onChange={(event) => onApproveFormChange({ notes: event.target.value })}
                disabled={!canApprove}
              />
            </label>
          </form>

          <form onSubmit={onSchedule} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-primary">Schedule pickup</p>
              <Button type="submit" disabled={!canSchedule || actionLoading === 'schedule'}>
                {actionLoading === 'schedule' ? 'Scheduling…' : 'Schedule'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Confirm pickup and return windows before the crew handover.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <TextInput
                label="Pickup at"
                type="datetime-local"
                value={pickupForm.pickupAt}
                onChange={(event) => onPickupFormChange((current) => ({ ...current, pickupAt: event.target.value }))}
                disabled={!canSchedule}
              />
              <TextInput
                label="Return due"
                type="datetime-local"
                value={pickupForm.returnDueAt}
                onChange={(event) => onPickupFormChange((current) => ({ ...current, returnDueAt: event.target.value }))}
                disabled={!canSchedule}
              />
            </div>
            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Logistics notes
              <textarea
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600 focus:border-primary focus:outline-none"
                rows="2"
                value={pickupForm.logisticsNotes}
                onChange={(event) => onPickupFormChange((current) => ({ ...current, logisticsNotes: event.target.value }))}
                disabled={!canSchedule}
              />
            </label>
          </form>

          <form onSubmit={onCheckout} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-primary">Record checkout</p>
              <Button type="submit" disabled={!canCheckout || actionLoading === 'checkout'}>
                {actionLoading === 'checkout' ? 'Saving…' : 'Checkout'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Capture handover condition, media, and start tracking usage.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <TextInput
                label="Rental start"
                type="datetime-local"
                value={checkoutForm.rentalStartAt}
                onChange={(event) => onCheckoutFormChange((current) => ({ ...current, rentalStartAt: event.target.value }))}
                disabled={!canCheckout}
              />
              <TextInput
                label="Condition notes"
                value={checkoutForm.conditionNotes}
                onChange={(event) => onCheckoutFormChange((current) => ({ ...current, conditionNotes: event.target.value }))}
                disabled={!canCheckout}
              />
              <TextInput
                label="Image URLs"
                placeholder="Comma separated"
                value={checkoutForm.conditionImages}
                onChange={(event) => onCheckoutFormChange((current) => ({ ...current, conditionImages: event.target.value }))}
                disabled={!canCheckout}
              />
              <TextInput
                label="Handover notes"
                value={checkoutForm.handoverNotes}
                onChange={(event) => onCheckoutFormChange((current) => ({ ...current, handoverNotes: event.target.value }))}
                disabled={!canCheckout}
              />
            </div>
          </form>

          <form onSubmit={onReturn} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-primary">Mark returned</p>
              <Button type="submit" disabled={!canReturn || actionLoading === 'return'}>
                {actionLoading === 'return' ? 'Saving…' : 'Mark returned'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Register the return event and capture the inbound condition summary.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <TextInput
                label="Returned at"
                type="datetime-local"
                value={returnForm.returnedAt}
                onChange={(event) => onReturnFormChange((current) => ({ ...current, returnedAt: event.target.value }))}
                disabled={!canReturn}
              />
              <TextInput
                label="Condition notes"
                value={returnForm.conditionNotes}
                onChange={(event) => onReturnFormChange((current) => ({ ...current, conditionNotes: event.target.value }))}
                disabled={!canReturn}
              />
              <TextInput
                label="Image URLs"
                placeholder="Comma separated"
                value={returnForm.conditionImages}
                onChange={(event) => onReturnFormChange((current) => ({ ...current, conditionImages: event.target.value }))}
                disabled={!canReturn}
              />
              <TextInput
                label="Inspection notes"
                value={returnForm.notes}
                onChange={(event) => onReturnFormChange((current) => ({ ...current, notes: event.target.value }))}
                disabled={!canReturn}
              />
            </div>
          </form>

          <form onSubmit={onInspect} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-primary">Complete inspection</p>
              <Button type="submit" disabled={!canInspect || actionLoading === 'inspection'}>
                {actionLoading === 'inspection' ? 'Saving…' : 'Complete inspection'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Record inspection findings and any additional charges before settling deposits.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Outcome
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600 focus:border-primary focus:outline-none"
                  value={inspectionForm.outcome}
                  onChange={(event) => onInspectionFormChange((current) => ({ ...current, outcome: event.target.value }))}
                  disabled={!canInspect}
                >
                  {inspectionOutcomes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <TextInput
                label="Inspection notes"
                value={inspectionForm.inspectionNotes}
                onChange={(event) => onInspectionFormChange((current) => ({ ...current, inspectionNotes: event.target.value }))}
                disabled={!canInspect}
              />
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Additional charges</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    onInspectionFormChange((current) => ({
                      ...current,
                      charges: [...current.charges, { label: '', amount: '', currency: 'GBP', description: '' }]
                    }))
                  }
                  disabled={!canInspect}
                >
                  Add charge
                </Button>
              </div>
              {inspectionForm.charges.map((charge, index) => (
                <div key={`charge-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-secondary/30 p-3 md:grid-cols-4">
                  <TextInput
                    label="Label"
                    value={charge.label}
                    onChange={(event) =>
                      onInspectionFormChange((current) => {
                        const next = current.charges.map((entry, idx) =>
                          idx === index ? { ...entry, label: event.target.value } : entry
                        );
                        return { ...current, charges: next };
                      })
                    }
                    disabled={!canInspect}
                  />
                  <TextInput
                    label="Amount"
                    type="number"
                    value={charge.amount}
                    onChange={(event) =>
                      onInspectionFormChange((current) => {
                        const next = current.charges.map((entry, idx) =>
                          idx === index ? { ...entry, amount: event.target.value } : entry
                        );
                        return { ...current, charges: next };
                      })
                    }
                    disabled={!canInspect}
                  />
                  <TextInput
                    label="Currency"
                    value={charge.currency}
                    onChange={(event) =>
                      onInspectionFormChange((current) => {
                        const next = current.charges.map((entry, idx) =>
                          idx === index ? { ...entry, currency: event.target.value } : entry
                        );
                        return { ...current, charges: next };
                      })
                    }
                    disabled={!canInspect}
                  />
                  <TextInput
                    label="Description"
                    value={charge.description}
                    onChange={(event) =>
                      onInspectionFormChange((current) => {
                        const next = current.charges.map((entry, idx) =>
                          idx === index ? { ...entry, description: event.target.value } : entry
                        );
                        return { ...current, charges: next };
                      })
                    }
                    disabled={!canInspect}
                  />
                </div>
              ))}
            </div>
          </form>

          <form onSubmit={onCancel} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-primary">Cancel rental</p>
              <Button type="submit" variant="danger" disabled={!canCancel || actionLoading === 'cancel'}>
                {actionLoading === 'cancel' ? 'Cancelling…' : 'Cancel rental'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Release reserved inventory and notify the renter before checkout.</p>
            <TextInput
              label="Cancellation reason"
              value={cancelForm.reason}
              onChange={(event) => onCancelFormChange({ reason: event.target.value })}
              disabled={!canCancel}
            />
          </form>

          <form onSubmit={onCheckpoint} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-primary">Add timeline checkpoint</p>
              <Button type="submit" disabled={actionLoading === 'checkpoint'}>
                {actionLoading === 'checkpoint' ? 'Saving…' : 'Add checkpoint'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Annotate the rental timeline with manual notes or logistics updates.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Type
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600 focus:border-primary focus:outline-none"
                  value={checkpointForm.type}
                  onChange={(event) => onCheckpointFormChange((current) => ({ ...current, type: event.target.value }))}
                >
                  {checkpointTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <TextInput
                label="Description"
                value={checkpointForm.description}
                onChange={(event) => onCheckpointFormChange((current) => ({ ...current, description: event.target.value }))}
                required
              />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <TextInput
                label="Notes"
                value={checkpointForm.notes}
                onChange={(event) => onCheckpointFormChange((current) => ({ ...current, notes: event.target.value }))}
              />
              <TextInput
                label="Image URLs"
                placeholder="Comma separated"
                value={checkpointForm.images}
                onChange={(event) => onCheckpointFormChange((current) => ({ ...current, images: event.target.value }))}
              />
            </div>
          </form>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-primary">Timeline</h3>
        <p className="mt-1 text-xs text-slate-500">Every rental checkpoint, inspection, and deposit event is logged for audit purposes.</p>
        <div className="mt-4">
          <RentalTimeline timeline={timeline} />
        </div>
      </div>
    </div>
  );
}

RentalDetailPanel.propTypes = {
  rental: PropTypes.object,
  selectedState: PropTypes.shape({
    loading: PropTypes.bool,
    error: PropTypes.instanceOf(Error)
  }).isRequired,
  actionLoading: PropTypes.string,
  detailStatus: PropTypes.shape({
    tone: PropTypes.string,
    message: PropTypes.string
  }),
  clearDetailStatus: PropTypes.func.isRequired,
  onOpenNewWindow: PropTypes.func.isRequired,
  canApprove: PropTypes.bool,
  canSchedule: PropTypes.bool,
  canCheckout: PropTypes.bool,
  canReturn: PropTypes.bool,
  canInspect: PropTypes.bool,
  canCancel: PropTypes.bool,
  approveForm: PropTypes.object.isRequired,
  onApproveFormChange: PropTypes.func.isRequired,
  pickupForm: PropTypes.object.isRequired,
  onPickupFormChange: PropTypes.func.isRequired,
  checkoutForm: PropTypes.object.isRequired,
  onCheckoutFormChange: PropTypes.func.isRequired,
  returnForm: PropTypes.object.isRequired,
  onReturnFormChange: PropTypes.func.isRequired,
  inspectionForm: PropTypes.shape({
    outcome: PropTypes.string,
    inspectionNotes: PropTypes.string,
    charges: PropTypes.array
  }).isRequired,
  onInspectionFormChange: PropTypes.func.isRequired,
  cancelForm: PropTypes.object.isRequired,
  onCancelFormChange: PropTypes.func.isRequired,
  checkpointForm: PropTypes.object.isRequired,
  onCheckpointFormChange: PropTypes.func.isRequired,
  scheduleForm: PropTypes.object.isRequired,
  onScheduleFormChange: PropTypes.func.isRequired,
  financialForm: PropTypes.object.isRequired,
  onFinancialFormChange: PropTypes.func.isRequired,
  associationForm: PropTypes.object.isRequired,
  onAssociationFormChange: PropTypes.func.isRequired,
  updateStatus: PropTypes.shape({
    schedule: PropTypes.object,
    financial: PropTypes.object,
    associations: PropTypes.object
  }).isRequired,
  onApprove: PropTypes.func.isRequired,
  onSchedule: PropTypes.func.isRequired,
  onCheckout: PropTypes.func.isRequired,
  onReturn: PropTypes.func.isRequired,
  onInspect: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onCheckpoint: PropTypes.func.isRequired,
  onUpdateSchedule: PropTypes.func.isRequired,
  onUpdateFinancial: PropTypes.func.isRequired,
  onUpdateAssociations: PropTypes.func.isRequired,
  reloadSelected: PropTypes.func.isRequired,
  depositStatusTone: PropTypes.object.isRequired,
  statusTone: PropTypes.object.isRequired,
  depositStatusOptions: PropTypes.array.isRequired,
  inspectionOutcomes: PropTypes.array.isRequired,
  checkpointTypes: PropTypes.array.isRequired
};

RentalDetailPanel.defaultProps = {
  rental: null,
  actionLoading: null,
  detailStatus: null,
  canApprove: false,
  canSchedule: false,
  canCheckout: false,
  canReturn: false,
  canInspect: false,
  canCancel: false
};
