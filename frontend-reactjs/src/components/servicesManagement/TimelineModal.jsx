import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Button, Card, Spinner } from '../ui/index.js';
import { formatDateTime, formatMoney } from './formatters.js';

function TimelineModal({ open, onClose, loading, data, error }) {
  const finance = data?.finance ?? {};
  const payments = finance.payments ?? [];
  const payouts = finance.payouts ?? [];
  const invoices = finance.invoices ?? [];
  const disputes = finance.disputes ?? [];
  const history = finance.history ?? [];

  const capturedTotal = payments
    .filter((payment) => payment.status === 'captured')
    .reduce((sum, payment) => sum + Number.parseFloat(payment.amount ?? 0), 0);

  const outstandingInvoice = invoices.find((invoice) => invoice.status !== 'paid') ?? invoices[0] ?? null;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl border border-accent/10 bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-primary">Order timeline</Dialog.Title>
                {loading ? (
                  <div className="mt-4 flex items-center gap-3 text-sm text-slate-600">
                    <Spinner /> Loading timeline…
                  </div>
                ) : error ? (
                  <p className="mt-4 text-sm text-rose-600">{error}</p>
                ) : data ? (
                  <div className="mt-4 space-y-6">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Card padding="lg" className="border border-accent/10 bg-secondary/40">
                        <p className="text-xs uppercase tracking-wide text-primary/60">Captured payments</p>
                        <p className="mt-1 text-lg font-semibold text-primary">
                          {formatMoney(capturedTotal, data.order?.currency ?? 'GBP')}
                        </p>
                        <p className="mt-2 text-xs text-primary/60">{payments.length} payment{payments.length === 1 ? '' : 's'} recorded</p>
                      </Card>
                      <Card padding="lg" className="border border-accent/10 bg-secondary/40">
                        <p className="text-xs uppercase tracking-wide text-primary/60">Outstanding invoice</p>
                        <p className="mt-1 text-sm font-medium text-primary">
                          {outstandingInvoice
                            ? `${outstandingInvoice.status ?? 'Issued'}${
                                outstandingInvoice.amountDue
                                  ? ` • ${formatMoney(outstandingInvoice.amountDue, outstandingInvoice.currency ?? data.order?.currency ?? 'GBP')}`
                                  : ''
                              }`
                            : 'No invoice issued'}
                        </p>
                        <p className="mt-2 text-xs text-primary/60">{invoices.length} invoice{invoices.length === 1 ? '' : 's'} generated</p>
                      </Card>
                      <Card padding="lg" className="border border-accent/10 bg-secondary/40">
                        <p className="text-xs uppercase tracking-wide text-primary/60">Disputes</p>
                        <p className="mt-1 text-lg font-semibold text-primary">{disputes.length}</p>
                        <p className="mt-2 text-xs text-primary/60">Includes escrow and scheduling escalations</p>
                      </Card>
                    </div>

                    {payments.length ? (
                      <div>
                        <h4 className="text-sm font-semibold text-primary">Payments</h4>
                        <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-accent/10 bg-white/95">
                          <table className="min-w-full divide-y divide-accent/10 text-left text-sm">
                            <thead className="bg-secondary text-primary/80">
                              <tr>
                                <th className="px-4 py-2 font-semibold">Processed</th>
                                <th className="px-4 py-2 font-semibold">Status</th>
                                <th className="px-4 py-2 font-semibold">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-accent/10">
                              {payments.map((payment) => (
                                <tr key={payment.id || `${payment.status}-${payment.processedAt}`}>
                                  <td className="px-4 py-2 text-slate-600">{formatDateTime(payment.processedAt)}</td>
                                  <td className="px-4 py-2 text-slate-600 capitalize">{payment.status ?? 'unknown'}</td>
                                  <td className="px-4 py-2 text-slate-600">
                                    {formatMoney(payment.amount, payment.currency ?? data.order?.currency)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}

                    {payouts.length ? (
                      <div>
                        <h4 className="text-sm font-semibold text-primary">Payouts</h4>
                        <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-accent/10 bg-white/95">
                          <table className="min-w-full divide-y divide-accent/10 text-left text-sm">
                            <thead className="bg-secondary text-primary/80">
                              <tr>
                                <th className="px-4 py-2 font-semibold">Scheduled</th>
                                <th className="px-4 py-2 font-semibold">Status</th>
                                <th className="px-4 py-2 font-semibold">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-accent/10">
                              {payouts.map((payout) => (
                                <tr key={payout.id || `${payout.status}-${payout.expectedAt}`}>
                                  <td className="px-4 py-2 text-slate-600">{formatDateTime(payout.expectedAt)}</td>
                                  <td className="px-4 py-2 text-slate-600 capitalize">{payout.status ?? 'pending'}</td>
                                  <td className="px-4 py-2 text-slate-600">
                                    {formatMoney(payout.amount, payout.currency ?? data.order?.currency)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}

                    {disputes.length ? (
                      <div>
                        <h4 className="text-sm font-semibold text-primary">Disputes</h4>
                        <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-accent/10 bg-white/95">
                          <table className="min-w-full divide-y divide-accent/10 text-left text-sm">
                            <thead className="bg-secondary text-primary/80">
                              <tr>
                                <th className="px-4 py-2 font-semibold">Opened</th>
                                <th className="px-4 py-2 font-semibold">Status</th>
                                <th className="px-4 py-2 font-semibold">Reason</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-accent/10">
                              {disputes.map((dispute) => (
                                <tr key={dispute.id || `${dispute.status}-${dispute.createdAt}`}>
                                  <td className="px-4 py-2 text-slate-600">{formatDateTime(dispute.createdAt)}</td>
                                  <td className="px-4 py-2 text-slate-600 capitalize">{dispute.status ?? 'open'}</td>
                                  <td className="px-4 py-2 text-slate-600">{dispute.reason ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <h4 className="text-sm font-semibold text-primary">Finance history</h4>
                      <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-accent/10 bg-white/95">
                        <table className="min-w-full divide-y divide-accent/10 text-left text-sm">
                          <thead className="bg-secondary text-primary/80">
                            <tr>
                              <th className="px-4 py-2 font-semibold">When</th>
                              <th className="px-4 py-2 font-semibold">Event</th>
                              <th className="px-4 py-2 font-semibold">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-accent/10">
                            {history.map((event) => (
                              <tr key={event.id || `${event.eventType}-${event.occurredAt}`}>
                                <td className="px-4 py-2 text-slate-600">{formatDateTime(event.occurredAt)}</td>
                                <td className="px-4 py-2 text-slate-600">{event.eventType}</td>
                                <td className="px-4 py-2 text-slate-600">
                                  {event.snapshot?.amount
                                    ? formatMoney(event.snapshot.amount, event.snapshot.currency ?? data.order?.currency)
                                    : '—'}
                                </td>
                              </tr>
                            ))}
                            {!history.length ? (
                              <tr>
                                <td colSpan="3" className="px-4 py-4 text-center text-sm text-slate-500">
                                  No finance events recorded yet.
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="mt-6 flex justify-end">
                  <Button type="button" variant="secondary" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

TimelineModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  data: PropTypes.shape({
    order: PropTypes.object,
    finance: PropTypes.object
  }),
  error: PropTypes.string
};

TimelineModal.defaultProps = {
  loading: false,
  data: null,
  error: null
};

export default TimelineModal;
