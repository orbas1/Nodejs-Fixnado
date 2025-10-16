import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../../ui/Button.jsx';
import FormField from '../../ui/FormField.jsx';
import TextInput from '../../ui/TextInput.jsx';
import StatusPill from '../../ui/StatusPill.jsx';
import Spinner from '../../ui/Spinner.jsx';
import {
  addRentalCheckpoint,
  approveRental,
  cancelRental,
  checkoutRental,
  completeRentalInspection,
  markRentalReturned,
  scheduleRentalPickup,
  updateRentalDeposit
} from '../../../api/rentalClient.js';
import {
  depositStatusLabels,
  depositTone,
  formatCurrency,
  formatDate,
  rentalShape,
  statusTone
} from './rentalUtils.js';

function toInputDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num) => `${num}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

export default function RentalDetailDrawer({
  open,
  onClose,
  rental,
  timezone,
  depositOptions,
  currency,
  onRefresh,
  resolveActorId,
  onDispute
}) {
  const [action, setAction] = useState({ type: null, loading: false, error: null });
  const [depositForm, setDepositForm] = useState({ status: '', amount: '', reason: '' });
  const [scheduleForm, setScheduleForm] = useState({ pickupAt: '', returnDueAt: '', notes: '' });
  const [checkoutForm, setCheckoutForm] = useState({ startAt: '', notes: '' });
  const [returnForm, setReturnForm] = useState({ returnedAt: '', notes: '' });
  const [inspectionOutcome, setInspectionOutcome] = useState('clear');
  const [inspectionCharge, setInspectionCharge] = useState({ amount: '', currency });
  const [checkpointNote, setCheckpointNote] = useState('');
  const actorRole = 'customer';
  const canStartDispute = rental && ['in_use', 'inspection_pending', 'settled'].includes(rental.status);

  useEffect(() => {
    if (!open || !rental) {
      return;
    }
    setAction({ type: null, loading: false, error: null });
    setDepositForm({
      status: rental.depositStatus || depositOptions[0]?.value || 'pending',
      amount: '',
      reason: ''
    });
    setScheduleForm({
      pickupAt: toInputDateTime(rental.pickupAt),
      returnDueAt: toInputDateTime(rental.returnDueAt),
      notes: ''
    });
    setCheckoutForm({ startAt: toInputDateTime(rental.rentalStartAt), notes: '' });
    setReturnForm({ returnedAt: toInputDateTime(rental.returnedAt), notes: '' });
    setInspectionOutcome('clear');
    setInspectionCharge({ amount: '', currency });
    setCheckpointNote('');
  }, [currency, depositOptions, open, rental]);

  const depositAdjustments = useMemo(() => {
    if (!rental) return [];
    const adjustments = Array.isArray(rental.meta?.depositAdjustments)
      ? rental.meta.depositAdjustments
      : [];
    return adjustments
      .map((entry) => ({
        ...entry,
        occurredAt: entry.occurredAt || entry.timestamp || null
      }))
      .reverse();
  }, [rental]);

  const runAction = useCallback(
    async (type, exec) => {
      setAction({ type, loading: true, error: null });
      try {
        await exec();
        await onRefresh();
        setAction({ type: null, loading: false, error: null });
      } catch (error) {
        console.error('Rental action failed', error);
        setAction({
          type,
          loading: false,
          error: error instanceof Error ? error.message : 'Action failed'
        });
      }
    },
    [onRefresh]
  );

  const handleApprove = useCallback(() => {
    if (!rental) return;
    const actorId = resolveActorId(rental);
    if (!actorId) {
      setAction({ type: 'approve', loading: false, error: 'Actor ID unavailable for approval' });
      return;
    }
    runAction('approve', () => approveRental(rental.id, { actorId, actorRole }));
  }, [actorRole, rental, resolveActorId, runAction]);

  const handleCancel = useCallback(() => {
    if (!rental) return;
    const actorId = resolveActorId(rental);
    if (!actorId) {
      setAction({ type: 'cancel', loading: false, error: 'Actor ID unavailable for cancellation' });
      return;
    }
    runAction('cancel', () => cancelRental(rental.id, { actorId, actorRole }));
  }, [actorRole, rental, resolveActorId, runAction]);

  const handleSchedule = useCallback(
    (event) => {
      event.preventDefault();
      if (!rental) return;
      const actorId = resolveActorId(rental);
      if (!actorId) {
        setAction({ type: 'schedule', loading: false, error: 'Actor ID unavailable for scheduling' });
        return;
      }
      if (!scheduleForm.pickupAt || !scheduleForm.returnDueAt) {
        setAction({ type: 'schedule', loading: false, error: 'Pickup and return windows are required' });
        return;
      }
      runAction('schedule', () =>
        scheduleRentalPickup(rental.id, {
          actorId,
          actorRole,
          pickupAt: new Date(scheduleForm.pickupAt).toISOString(),
          returnDueAt: new Date(scheduleForm.returnDueAt).toISOString(),
          logisticsNotes: scheduleForm.notes || null
        })
      );
    },
    [actorRole, rental, resolveActorId, runAction, scheduleForm]
  );

  const handleCheckout = useCallback(
    (event) => {
      event.preventDefault();
      if (!rental) return;
      const actorId = resolveActorId(rental);
      if (!actorId) {
        setAction({ type: 'checkout', loading: false, error: 'Actor ID unavailable for checkout' });
        return;
      }
      runAction('checkout', () =>
        checkoutRental(rental.id, {
          actorId,
          actorRole,
          rentalStartAt: checkoutForm.startAt ? new Date(checkoutForm.startAt).toISOString() : null,
          handoverNotes: checkoutForm.notes || null,
          conditionOut: checkoutForm.notes ? { notes: checkoutForm.notes } : {}
        })
      );
    },
    [actorRole, checkoutForm, rental, resolveActorId, runAction]
  );

  const handleReturn = useCallback(
    (event) => {
      event.preventDefault();
      if (!rental) return;
      const actorId = resolveActorId(rental);
      if (!actorId) {
        setAction({ type: 'return', loading: false, error: 'Actor ID unavailable for return' });
        return;
      }
      runAction('return', () =>
        markRentalReturned(rental.id, {
          actorId,
          actorRole,
          returnedAt: returnForm.returnedAt ? new Date(returnForm.returnedAt).toISOString() : null,
          notes: returnForm.notes || null,
          conditionIn: returnForm.notes ? { notes: returnForm.notes } : {}
        })
      );
    },
    [actorRole, rental, resolveActorId, returnForm, runAction]
  );

  const handleInspection = useCallback(
    (event) => {
      event.preventDefault();
      if (!rental) return;
      const actorId = resolveActorId(rental);
      if (!actorId) {
        setAction({ type: 'inspection', loading: false, error: 'Actor ID unavailable for inspection' });
        return;
      }
      const charges = [];
      const amount = Number.parseFloat(inspectionCharge.amount);
      if (['damaged', 'partial'].includes(inspectionOutcome) && Number.isFinite(amount) && amount > 0) {
        charges.push({ amount, currency: inspectionCharge.currency || currency });
      }
      runAction('inspection', () =>
        completeRentalInspection(rental.id, {
          actorId,
          actorRole,
          outcome: inspectionOutcome,
          charges,
          inspectionNotes: charges.length > 0 ? 'Additional charges applied' : null
        })
      );
    },
    [actorRole, currency, inspectionCharge, inspectionOutcome, rental, resolveActorId, runAction]
  );

  const handleCheckpoint = useCallback(
    (event) => {
      event.preventDefault();
      if (!rental) return;
      const actorId = resolveActorId(rental);
      if (!actorId) {
        setAction({ type: 'checkpoint', loading: false, error: 'Actor ID unavailable for notes' });
        return;
      }
      if (!checkpointNote.trim()) {
        setAction({ type: 'checkpoint', loading: false, error: 'Checkpoint note cannot be empty' });
        return;
      }
      runAction('checkpoint', async () => {
        await addRentalCheckpoint(rental.id, {
          type: 'note',
          description: checkpointNote.trim(),
          recordedBy: actorId,
          recordedByRole: actorRole,
          payload: { notes: checkpointNote.trim() }
        });
        setCheckpointNote('');
      });
    },
    [actorRole, checkpointNote, rental, resolveActorId, runAction]
  );

  const handleDepositUpdate = useCallback(
    (event) => {
      event.preventDefault();
      if (!rental) return;
      const actorId = resolveActorId(rental);
      if (!actorId) {
        setAction({ type: 'deposit', loading: false, error: 'Actor ID unavailable for deposit update' });
        return;
      }
      if (!depositForm.status) {
        setAction({ type: 'deposit', loading: false, error: 'Select a deposit status' });
        return;
      }
      const amount = depositForm.amount ? Number.parseFloat(depositForm.amount) : null;
      if (depositForm.amount && !Number.isFinite(amount)) {
        setAction({ type: 'deposit', loading: false, error: 'Deposit amount must be a number' });
        return;
      }
      runAction('deposit', () =>
        updateRentalDeposit(rental.id, {
          actorId,
          actorRole,
          status: depositForm.status,
          reason: depositForm.reason?.trim() || null,
          amountReleased: amount
        })
      );
    },
    [actorRole, depositForm.amount, depositForm.reason, depositForm.status, rental, resolveActorId, runAction]
  );

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 flex justify-end">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="w-full max-w-xl overflow-y-auto bg-white p-8 shadow-2xl">
                {rental ? (
                  <div className="space-y-6" data-qa="rental-detail-panel">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Dialog.Title className="text-xl font-semibold text-primary">
                          {rental.item?.name || 'Rental asset'}
                        </Dialog.Title>
                        <p className="text-sm text-slate-500">{rental.rentalNumber}</p>
                      </div>
                      <Button variant="ghost" onClick={onClose}>
                        Close
                      </Button>
                    </div>

                    {action.error ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-sm text-rose-700">
                        {action.error}
                      </div>
                    ) : null}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Status</p>
                        <div className="mt-2">
                          <StatusPill tone={statusTone[rental.status] || 'neutral'}>
                            {rental.status.replace(/_/g, ' ') || 'Unknown'}
                          </StatusPill>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Deposit</p>
                        <div className="mt-2 flex items-center gap-2">
                          <StatusPill tone={depositTone[rental.depositStatus] || 'neutral'}>
                            {rental.depositStatus.replace(/_/g, ' ') || 'Pending'}
                          </StatusPill>
                          {Number.isFinite(rental.depositAmount) ? (
                            <span className="text-sm text-slate-600">
                              {formatCurrency(rental.depositAmount, rental.depositCurrency || currency)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Return due</p>
                        <p className="mt-2 text-sm text-slate-600">{formatDate(rental.returnDueAt, timezone)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Quantity</p>
                        <p className="mt-2 text-sm text-slate-600">{rental.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Rental window</p>
                        <p className="mt-2 text-sm text-slate-600">
                          {formatDate(rental.rentalStartAt, timezone)} → {formatDate(rental.rentalEndAt, timezone)}
                        </p>
                      </div>
                      {rental.booking?.id ? (
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Booking</p>
                          <p className="mt-2 text-sm text-slate-600">
                            {rental.booking.reference || rental.booking.title || rental.booking.id}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-4">
                      <h3 className="text-sm font-semibold text-primary">Escrow & deposit</h3>
                      <form className="space-y-3" onSubmit={handleDepositUpdate}>
                        <FormField id="deposit-status" label="Deposit status">
                          <select
                            id="deposit-status"
                            className="w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700"
                            value={depositForm.status}
                            onChange={(event) => setDepositForm((prev) => ({ ...prev, status: event.target.value }))}
                          >
                            {depositOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </FormField>
                        <TextInput
                          id="deposit-amount"
                          label="Amount released"
                          optionalLabel="Optional"
                          type="number"
                          min="0"
                          step="0.01"
                          value={depositForm.amount}
                          onChange={(event) => setDepositForm((prev) => ({ ...prev, amount: event.target.value }))}
                        />
                        <FormField id="deposit-reason" label="Reason" optionalLabel="Optional">
                          <textarea
                            id="deposit-reason"
                            className="w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700"
                            rows={2}
                            value={depositForm.reason}
                            onChange={(event) => setDepositForm((prev) => ({ ...prev, reason: event.target.value }))}
                          />
                        </FormField>
                        <div className="flex gap-3">
                          <Button type="submit" loading={action.loading && action.type === 'deposit'}>
                            Update deposit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              setDepositForm({
                                status: rental.depositStatus || depositOptions[0]?.value || 'pending',
                                amount: '',
                                reason: ''
                              })
                            }
                          >
                            Reset
                          </Button>
                        </div>
                      </form>
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                          Adjustment history
                        </h4>
                        {depositAdjustments.length === 0 ? (
                          <p className="text-sm text-slate-500">No adjustments recorded yet.</p>
                        ) : (
                          <ul className="space-y-2 text-sm text-slate-600">
                            {depositAdjustments.map((entry, index) => (
                              <li
                                key={`${entry.occurredAt || index}-${entry.status}`}
                                className="rounded-xl border border-slate-200 bg-secondary/40 p-3"
                              >
                                <p className="font-semibold text-primary">
                                  {depositStatusLabels[entry.status] || entry.status}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {entry.occurredAt ? formatDate(entry.occurredAt, timezone) : 'Recorded'}
                                </p>
                                {entry.amountReleased ? (
                                  <p className="mt-1 text-xs">
                                    Released {formatCurrency(entry.amountReleased, rental.depositCurrency || currency)}
                                  </p>
                                ) : null}
                                {entry.reason ? <p className="mt-1 text-xs">{entry.reason}</p> : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <h3 className="text-sm font-semibold text-primary">Lifecycle actions</h3>
                      <div className="space-y-4">
                        {rental.status === 'requested' ? (
                          <Button onClick={handleApprove} loading={action.loading && action.type === 'approve'}>
                            Approve rental
                          </Button>
                        ) : null}
                        {['requested', 'approved', 'pickup_scheduled', 'in_use'].includes(rental.status) ? (
                          <Button
                            variant="danger"
                            onClick={handleCancel}
                            loading={action.loading && action.type === 'cancel'}
                          >
                            Cancel rental
                          </Button>
                        ) : null}
                        {rental.status === 'approved' ? (
                          <form className="space-y-3" onSubmit={handleSchedule}>
                            <h4 className="text-sm font-semibold text-primary">Schedule pickup</h4>
                            <TextInput
                              id="schedule-pickup"
                              label="Pickup time"
                              type="datetime-local"
                              value={scheduleForm.pickupAt}
                              onChange={(event) =>
                                setScheduleForm((prev) => ({ ...prev, pickupAt: event.target.value }))
                              }
                              required
                            />
                            <TextInput
                              id="schedule-return"
                              label="Return due"
                              type="datetime-local"
                              value={scheduleForm.returnDueAt}
                              onChange={(event) =>
                                setScheduleForm((prev) => ({ ...prev, returnDueAt: event.target.value }))
                              }
                              required
                            />
                            <FormField id="schedule-notes" label="Logistics notes" optionalLabel="Optional">
                              <textarea
                                id="schedule-notes"
                                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700"
                                rows={2}
                                value={scheduleForm.notes}
                                onChange={(event) =>
                                  setScheduleForm((prev) => ({ ...prev, notes: event.target.value }))
                                }
                              />
                            </FormField>
                            <div className="flex gap-3">
                              <Button type="submit" loading={action.loading && action.type === 'schedule'}>
                                Save pickup
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setScheduleForm({ pickupAt: '', returnDueAt: '', notes: '' })}
                              >
                                Reset
                              </Button>
                            </div>
                          </form>
                        ) : null}
                        {['approved', 'pickup_scheduled'].includes(rental.status) ? (
                          <form className="space-y-3" onSubmit={handleCheckout}>
                            <h4 className="text-sm font-semibold text-primary">Checkout rental</h4>
                            <TextInput
                              id="checkout-start"
                              label="Start time"
                              type="datetime-local"
                              value={checkoutForm.startAt}
                              onChange={(event) =>
                                setCheckoutForm((prev) => ({ ...prev, startAt: event.target.value }))
                              }
                              optionalLabel="Optional"
                            />
                            <FormField id="checkout-notes" label="Handover notes" optionalLabel="Optional">
                              <textarea
                                id="checkout-notes"
                                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700"
                                rows={2}
                                value={checkoutForm.notes}
                                onChange={(event) =>
                                  setCheckoutForm((prev) => ({ ...prev, notes: event.target.value }))
                                }
                              />
                            </FormField>
                            <Button type="submit" loading={action.loading && action.type === 'checkout'}>
                              Confirm checkout
                            </Button>
                          </form>
                        ) : null}
                        {rental.status === 'in_use' ? (
                          <form className="space-y-3" onSubmit={handleReturn}>
                            <h4 className="text-sm font-semibold text-primary">Mark as returned</h4>
                            <TextInput
                              id="return-time"
                              label="Return time"
                              type="datetime-local"
                              value={returnForm.returnedAt}
                              onChange={(event) =>
                                setReturnForm((prev) => ({ ...prev, returnedAt: event.target.value }))
                              }
                              optionalLabel="Optional"
                            />
                            <FormField id="return-notes" label="Return notes" optionalLabel="Optional">
                              <textarea
                                id="return-notes"
                                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700"
                                rows={2}
                                value={returnForm.notes}
                                onChange={(event) =>
                                  setReturnForm((prev) => ({ ...prev, notes: event.target.value }))
                                }
                              />
                            </FormField>
                            <Button type="submit" loading={action.loading && action.type === 'return'}>
                              Mark returned
                            </Button>
                          </form>
                        ) : null}
                        {rental.status === 'inspection_pending' ? (
                          <form className="space-y-3" onSubmit={handleInspection}>
                            <h4 className="text-sm font-semibold text-primary">Inspection outcome</h4>
                            <FormField id="inspection-outcome" label="Outcome">
                              <select
                                id="inspection-outcome"
                                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700"
                                value={inspectionOutcome}
                                onChange={(event) => setInspectionOutcome(event.target.value)}
                              >
                                <option value="clear">Clear</option>
                                <option value="partial">Partial release</option>
                                <option value="damaged">Damaged</option>
                              </select>
                            </FormField>
                            {['partial', 'damaged'].includes(inspectionOutcome) ? (
                              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                                <TextInput
                                  id="inspection-charge-amount"
                                  label="Additional charge"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={inspectionCharge.amount}
                                  onChange={(event) =>
                                    setInspectionCharge((prev) => ({ ...prev, amount: event.target.value }))
                                  }
                                />
                                <FormField id="inspection-charge-currency" label="Currency">
                                  <input
                                    id="inspection-charge-currency"
                                    className="fx-text-input"
                                    value={inspectionCharge.currency}
                                    onChange={(event) =>
                                      setInspectionCharge((prev) => ({ ...prev, currency: event.target.value }))
                                    }
                                  />
                                </FormField>
                              </div>
                            ) : null}
                            <Button type="submit" loading={action.loading && action.type === 'inspection'}>
                              Complete inspection
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-4">
                      <h3 className="text-sm font-semibold text-primary">Activity log</h3>
                      <form className="space-y-3" onSubmit={handleCheckpoint}>
                        <FormField id="checkpoint-note" label="Add note" optionalLabel="Optional">
                          <textarea
                            id="checkpoint-note"
                            className="w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700"
                            rows={2}
                            value={checkpointNote}
                            onChange={(event) => setCheckpointNote(event.target.value)}
                          />
                        </FormField>
                        <Button type="submit" loading={action.loading && action.type === 'checkpoint'}>
                          Log note
                        </Button>
                      </form>
                      <ul className="space-y-3">
                        {rental.timeline.length === 0 ? (
                          <li className="text-sm text-slate-500">No checkpoints recorded yet.</li>
                        ) : (
                          rental.timeline
                            .slice()
                            .reverse()
                            .map((event) => (
                              <li key={event.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm">
                                <p className="font-semibold text-primary">{event.description}</p>
                                <p className="mt-1 text-xs text-slate-500">{formatDate(event.occurredAt, timezone)}</p>
                              </li>
                            ))
                        )}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {canStartDispute ? (
                        <Button variant="secondary" onClick={() => onDispute(rental)}>
                          Start dispute
                        </Button>
                      ) : null}
                      <Button variant="ghost" onClick={onRefresh}>
                        Refresh state
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Spinner className="h-6 w-6 text-primary" />
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

RentalDetailDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  rental: rentalShape,
  timezone: PropTypes.string,
  depositOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  currency: PropTypes.string,
  onRefresh: PropTypes.func.isRequired,
  resolveActorId: PropTypes.func.isRequired,
  onDispute: PropTypes.func.isRequired
};

RentalDetailDrawer.defaultProps = {
  rental: null,
  timezone: undefined,
  depositOptions: [],
  currency: 'GBP'
};

