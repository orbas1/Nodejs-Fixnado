import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { fetchFinanceOverview, fetchOrderFinanceTimeline } from '../api/financeClient.js';
import Spinner from '../components/ui/Spinner.jsx';
import { formatCurrency } from '../utils/numberFormatters.js';

function SummaryCard({ label, value, tone = 'slate' }) {
  const toneStyles = {
    slate: 'from-slate-100 via-slate-50 to-transparent text-slate-800 border-slate-200',
    emerald: 'from-emerald-100 via-emerald-50 to-transparent text-emerald-800 border-emerald-200',
    amber: 'from-amber-100 via-amber-50 to-transparent text-amber-800 border-amber-200',
    rose: 'from-rose-100 via-rose-50 to-transparent text-rose-800 border-rose-200'
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl border bg-white p-6 shadow-sm ${toneStyles[tone]}`.trim()}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${toneStyles[tone].split(' ')[0]} opacity-70`} />
      <div className="relative space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  tone: PropTypes.oneOf(['slate', 'emerald', 'amber', 'rose'])
};

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-center">
      <div className="mb-3 h-12 w-12 rounded-full bg-slate-100 text-slate-500">💡</div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-600">{description}</p>
    </div>
  );
}

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired
};

function TimelinePanel({ orderId, timeline, onClose, loading }) {
  if (!orderId) {
    return (
      <div className="flex h-full items-center justify-center border-l border-slate-200 bg-white">
        <EmptyState
          title="Select a payment"
          description="Choose a payment to review escrow milestones, invoice history, and dispute activity."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center border-l border-slate-200 bg-white">
        <Spinner className="h-6 w-6 text-primary" />
      </div>
    );
  }

  if (!timeline) {
    return (
      <div className="flex h-full items-center justify-center border-l border-slate-200 bg-white">
        <EmptyState
          title="Timeline unavailable"
          description="We were unable to load finance events for this order. Retry or contact operations support."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border-l border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Order</p>
          <p className="font-semibold text-slate-900">{timeline.order?.id}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Close
        </button>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <section>
          <h3 className="text-sm font-semibold text-slate-900">Payment events</h3>
          <ul className="mt-3 space-y-2 text-xs text-slate-600">
            {timeline.history?.map((event) => (
              <li key={event.id || `${event.eventType}-${event.occurredAt}`}
                className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <p className="font-semibold text-slate-800">{event.eventType}</p>
                <p className="mt-1 text-slate-500">
                  {event.occurredAt ? new Date(event.occurredAt).toLocaleString() : 'Unscheduled'}
                </p>
                {event.snapshot && (
                  <pre className="mt-2 max-h-32 overflow-y-auto rounded-lg bg-white/70 p-2 text-[11px] leading-relaxed text-slate-600">
                    {JSON.stringify(event.snapshot, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-3 text-xs text-slate-600">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <h4 className="text-sm font-semibold text-emerald-700">Escrow</h4>
            <p className="mt-1 text-emerald-600">
              Status: <span className="font-semibold">{timeline.escrow?.status ?? 'pending'}</span>
            </p>
            {timeline.escrow?.fundedAt && (
              <p className="mt-1">Funded {new Date(timeline.escrow.fundedAt).toLocaleString()}</p>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <h4 className="text-sm font-semibold text-slate-800">Invoice</h4>
            <p>Status: <span className="font-semibold">{timeline.invoice?.status ?? 'draft'}</span></p>
            <p>Amount due: {formatCurrency(Number(timeline.invoice?.amountDue || 0), timeline.invoice?.currency)}</p>
          </div>
          {timeline.disputes?.length > 0 && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-rose-700">
              <h4 className="text-sm font-semibold">Disputes</h4>
              <ul className="mt-2 space-y-1 text-xs">
                {timeline.disputes.map((dispute) => (
                  <li key={dispute.id}>
                    {dispute.status} — opened {new Date(dispute.openedAt || dispute.createdAt).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

TimelinePanel.propTypes = {
  orderId: PropTypes.string,
  timeline: PropTypes.shape({
    order: PropTypes.object,
    history: PropTypes.array,
    escrow: PropTypes.object,
    invoice: PropTypes.object,
    disputes: PropTypes.array
  }),
  onClose: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

TimelinePanel.defaultProps = {
  orderId: null,
  timeline: null,
  loading: false
};

const FinanceOverview = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timeline, setTimeline] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const totals = useMemo(() => overview?.totals ?? {}, [overview]);

  const refreshOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFinanceOverview();
      setOverview(data);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to load finance overview';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTimeline = useCallback(async (orderId) => {
    if (!orderId) {
      setTimeline(null);
      setSelectedOrderId(null);
      return;
    }
    setTimelineLoading(true);
    setSelectedOrderId(orderId);
    try {
      const payload = await fetchOrderFinanceTimeline(orderId);
      setTimeline(payload);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to load finance timeline';
      setError(message);
      setTimeline(null);
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshOverview();
  }, [refreshOverview]);

  const payments = overview?.payments ?? [];
  const payouts = overview?.payouts ?? [];
  const invoices = overview?.invoices ?? [];
  const disputes = overview?.disputes ?? [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-accent">Finance Control Center</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold text-slate-900">Revenue, escrow and payout orchestration</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-600">
                Monitor captured revenue, escrow health, payout readiness and dispute workloads. Select a payment to review
                its complete audit timeline and supporting evidence captured by the orchestration service.
              </p>
            </div>
            <button
              type="button"
              onClick={refreshOverview}
              className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white px-5 py-2 text-sm font-semibold text-accent shadow-sm hover:border-accent"
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh overview'}
            </button>
          </div>
        </header>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Captured revenue (last 50 payments)"
            value={formatCurrency(Number(totals.captured || 0), 'GBP')}
            tone="emerald"
          />
          <SummaryCard
            label="Refunded volume"
            value={formatCurrency(Number(totals.refunded || 0), 'GBP')}
            tone="rose"
          />
          <SummaryCard
            label="Outstanding invoices"
            value={totals.outstandingInvoices ?? 0}
            tone="amber"
          />
          <SummaryCard
            label="Pending payout requests"
            value={totals.pendingPayouts ?? 0}
            tone="slate"
          />
        </section>

        <div className="mt-12 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Latest payments</h2>
                  <p className="text-sm text-slate-600">Track captured, pending and refunded payments.</p>
                </div>
              </div>
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Captured</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className={`cursor-pointer transition hover:bg-slate-50 ${
                          selectedOrderId === payment.orderId ? 'bg-slate-50/70' : 'bg-white'
                        }`}
                        onClick={() => loadTimeline(payment.orderId)}
                      >
                        <td className="px-4 py-3 font-medium text-primary">{payment.orderId}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{formatCurrency(Number(payment.amount || 0), payment.currency)}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {payment.capturedAt ? new Date(payment.capturedAt).toLocaleString() : 'Pending'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {payments.length === 0 && (
                  <div className="p-8">
                    <EmptyState
                      title="No payments yet"
                      description="Capture or import payments to populate finance metrics and unlock payout automation."
                    />
                  </div>
                )}
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Payout queue</h3>
                <p className="mt-1 text-sm text-slate-600">Upcoming releases to provider wallets.</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {payouts.map((payout) => (
                    <li key={payout.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <p className="font-semibold text-slate-800">{formatCurrency(Number(payout.amount || 0), payout.currency)}</p>
                      <p className="text-xs text-slate-500">Status: {payout.status}</p>
                      {payout.scheduledFor && (
                        <p className="text-xs text-slate-500">
                          Scheduled {new Date(payout.scheduledFor).toLocaleDateString()}
                        </p>
                      )}
                    </li>
                  ))}
                  {payouts.length === 0 && (
                    <EmptyState
                      title="No payouts pending"
                      description="Captured revenue has been released. Approvals will appear here when payouts are queued."
                    />
                  )}
                </ul>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Invoice health</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {invoices.map((invoice) => (
                    <li key={invoice.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <p className="font-semibold text-slate-800">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-slate-500">Status: {invoice.status}</p>
                      <p className="text-xs text-slate-500">
                        Amount due: {formatCurrency(Number(invoice.amountDue || 0), invoice.currency)}
                      </p>
                    </li>
                  ))}
                  {invoices.length === 0 && (
                    <EmptyState
                      title="Invoices will appear here"
                      description="Issue or import invoices from the orchestration service to track settlement progress."
                    />
                  )}
                </ul>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Disputes & risk follow-up</h3>
              <p className="mt-1 text-sm text-slate-600">Active disputes requiring finance or operations intervention.</p>
              <div className="mt-4 space-y-3">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-700">
                    <p className="font-semibold">{dispute.status}</p>
                    <p className="mt-1 text-xs">
                      Opened {new Date(dispute.openedAt || dispute.createdAt).toLocaleString()} — {dispute.reason || 'Reason pending'}
                    </p>
                  </div>
                ))}
                {disputes.length === 0 && (
                  <EmptyState
                    title="No disputes open"
                    description="Finance automations will surface any disputes requiring action."
                  />
                )}
              </div>
            </section>
          </div>

          <div className="h-full rounded-3xl border border-slate-200 bg-white">
            <TimelinePanel
              orderId={selectedOrderId}
              timeline={timeline}
              loading={timelineLoading}
              onClose={() => loadTimeline(null)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceOverview;
