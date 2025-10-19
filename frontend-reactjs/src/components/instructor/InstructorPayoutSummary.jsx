import PropTypes from 'prop-types';
import { useLocale } from '../../hooks/useLocale.js';
import StatusPill from '../ui/StatusPill.jsx';

const payoutTone = {
  pending: 'warning',
  scheduled: 'info',
  released: 'success',
  failed: 'critical'
};

export default function InstructorPayoutSummary({ summary, payouts, disputes, onExport, exporting }) {
  const { t, format } = useLocale();

  return (
    <section className="space-y-8" data-qa="instructor-payout-summary">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">{t('instructor.payouts.eyebrow')}</p>
        <h2 className="text-2xl font-semibold text-primary">{t('instructor.payouts.title')}</h2>
        <p className="text-sm text-slate-600">{t('instructor.payouts.description')}</p>
      </header>

      <dl className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <dt className="text-xs uppercase tracking-[0.3em] text-primary/60">{t('instructor.payouts.grossSales')}</dt>
          <dd className="mt-3 text-3xl font-semibold text-primary">{format.currency(summary.grossSales)}</dd>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <dt className="text-xs uppercase tracking-[0.3em] text-primary/60">{t('instructor.payouts.netRevenue')}</dt>
          <dd className="mt-3 text-3xl font-semibold text-primary">{format.currency(summary.netRevenue)}</dd>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <dt className="text-xs uppercase tracking-[0.3em] text-primary/60">{t('instructor.payouts.released')}</dt>
          <dd className="mt-3 text-3xl font-semibold text-primary">{format.currency(summary.payoutsReleased)}</dd>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <dt className="text-xs uppercase tracking-[0.3em] text-primary/60">{t('instructor.payouts.pending')}</dt>
          <dd className="mt-3 text-3xl font-semibold text-primary">{format.currency(summary.payoutsPending)}</dd>
        </div>
      </dl>

      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-primary">{t('instructor.payouts.tableTitle')}</h3>
            <p className="text-sm text-slate-600">{t('instructor.payouts.tableDescription')}</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-primary/20 bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
            onClick={onExport}
            disabled={exporting}
          >
            {exporting ? t('instructor.payouts.exporting') : t('instructor.payouts.exportCta')}
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50/70 text-xs uppercase tracking-[0.3em] text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">{t('instructor.payouts.columnReference')}</th>
                <th scope="col" className="px-4 py-3 font-semibold">{t('instructor.payouts.columnAmount')}</th>
                <th scope="col" className="px-4 py-3 font-semibold">{t('instructor.payouts.columnStatus')}</th>
                <th scope="col" className="px-4 py-3 font-semibold">{t('instructor.payouts.columnScheduled')}</th>
                <th scope="col" className="px-4 py-3 font-semibold">{t('instructor.payouts.columnReleased')}</th>
                <th scope="col" className="px-4 py-3 font-semibold">{t('instructor.payouts.columnAccount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                    {t('instructor.payouts.noPayouts')}
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id}>
                    <td className="px-4 py-3 text-sm font-semibold text-primary">{payout.reference || t('instructor.payouts.referencePending')}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{format.currency(payout.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={payoutTone[payout.status] ?? 'neutral'}>
                        {t(`instructor.payouts.status.${payout.status}`)}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{payout.scheduledAt ? format.dateTime(payout.scheduledAt) : '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{payout.releasedAt ? format.dateTime(payout.releasedAt) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{payout.depositAccount || t('instructor.payouts.accountPending')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-rose-600">{t('instructor.payouts.disputeTitle')}</h3>
        <p className="text-sm text-rose-600">{t('instructor.payouts.disputeDescription')}</p>
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {disputes.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-rose-200 bg-white/70 px-4 py-6 text-sm text-rose-500">
              {t('instructor.payouts.noDisputes')}
            </li>
          ) : (
            disputes.map((dispute) => (
              <li key={dispute.id} className="rounded-2xl border border-rose-200 bg-white/95 p-4 text-sm text-rose-600">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{t(`instructor.payouts.disputeStatus.${dispute.status}`)}</span>
                  <span>{format.currency(dispute.amount)}</span>
                </div>
                {dispute.openedAt ? (
                  <p className="mt-2 text-xs">{t('instructor.payouts.disputeOpened', { value: format.dateTime(dispute.openedAt) })}</p>
                ) : null}
                {dispute.reason ? <p className="mt-2 text-xs text-rose-500">{dispute.reason}</p> : null}
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}

InstructorPayoutSummary.propTypes = {
  summary: PropTypes.shape({
    grossSales: PropTypes.number.isRequired,
    netRevenue: PropTypes.number.isRequired,
    payoutsReleased: PropTypes.number.isRequired,
    payoutsPending: PropTypes.number.isRequired
  }).isRequired,
  payouts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired,
      scheduledAt: PropTypes.string,
      releasedAt: PropTypes.string,
      reference: PropTypes.string,
      depositAccount: PropTypes.string
    })
  ).isRequired,
  disputes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired,
      openedAt: PropTypes.string,
      reason: PropTypes.string
    })
  ).isRequired,
  onExport: PropTypes.func,
  exporting: PropTypes.bool
};

InstructorPayoutSummary.defaultProps = {
  onExport: undefined,
  exporting: false
};
