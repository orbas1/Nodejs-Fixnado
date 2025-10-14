import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { getAffiliateDashboard, affiliateFormatters } from '../../api/affiliateClient.js';

const gradientBackground =
  'relative overflow-hidden rounded-4xl border border-primary/10 bg-gradient-to-br from-white via-slate-50 to-primary/5 shadow-xl';

function MetricCard({ label, value, caption, tone = 'primary' }) {
  const tones = {
    primary: 'text-primary',
    accent: 'text-accent',
    success: 'text-emerald-600'
  };
  return (
    <article className="flex flex-col justify-between rounded-3xl border border-white/60 bg-white/80 p-6 shadow-inner backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-primary/60">{label}</p>
        <p className={`mt-4 text-2xl font-semibold ${tones[tone] ?? tones.primary}`}>{value}</p>
      </div>
      {caption ? <p className="mt-3 text-xs text-slate-500">{caption}</p> : null}
    </article>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  caption: PropTypes.node,
  tone: PropTypes.oneOf(['primary', 'accent', 'success'])
};

function ReferralRow({ referral }) {
  return (
    <tr className="border-b border-slate-200 last:border-0">
      <td className="whitespace-nowrap py-3 text-sm font-semibold text-primary">{referral.referralCodeUsed}</td>
      <td className="whitespace-nowrap py-3 text-xs uppercase tracking-[0.28em] text-primary/70">{referral.status}</td>
      <td className="whitespace-nowrap py-3 text-sm text-slate-600">{affiliateFormatters.number(referral.conversionsCount)}</td>
      <td className="whitespace-nowrap py-3 text-sm text-slate-600">
        {affiliateFormatters.currency(referral.totalRevenue)}
      </td>
      <td className="whitespace-nowrap py-3 text-sm font-medium text-emerald-600">
        {affiliateFormatters.currency(referral.totalCommissionEarned)}
      </td>
    </tr>
  );
}

ReferralRow.propTypes = {
  referral: PropTypes.shape({
    referralCodeUsed: PropTypes.string,
    status: PropTypes.string,
    conversionsCount: PropTypes.number,
    totalRevenue: PropTypes.number,
    totalCommissionEarned: PropTypes.number
  }).isRequired
};

function RulePill({ rule }) {
  const recurrenceLabel =
    rule.recurrenceType === 'infinite'
      ? 'Infinite'
      : rule.recurrenceType === 'finite'
      ? `${rule.recurrenceLimit}x`
      : 'One time';

  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-primary/20 bg-white/70 px-4 py-3 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{rule.tierLabel}</p>
      <p className="text-sm font-semibold text-primary">{rule.name}</p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
          {affiliateFormatters.percentage(rule.commissionRate)}
        </span>
        <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-600">{recurrenceLabel}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
          {affiliateFormatters.currency(rule.minTransactionValue)} –{' '}
          {rule.maxTransactionValue ? affiliateFormatters.currency(rule.maxTransactionValue) : '∞'}
        </span>
      </div>
    </div>
  );
}

RulePill.propTypes = {
  rule: PropTypes.shape({
    name: PropTypes.string,
    tierLabel: PropTypes.string,
    commissionRate: PropTypes.number,
    minTransactionValue: PropTypes.number,
    maxTransactionValue: PropTypes.number,
    recurrenceType: PropTypes.string,
    recurrenceLimit: PropTypes.number
  }).isRequired
};

export default function AffiliateDashboardSection() {
  const [state, setState] = useState({ loading: true, error: null, payload: null });

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    (async () => {
      try {
        const payload = await getAffiliateDashboard({ signal: controller.signal });
        if (!active) return;
        setState({ loading: false, error: null, payload });
      } catch (error) {
        if (!active) return;
        setState({
          loading: false,
          error: error instanceof Error ? error : new Error('Unable to load affiliate data'),
          payload: null
        });
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const { loading, error, payload } = state;

  const headline = useMemo(() => {
    if (!payload) return 'Affiliate revenue intelligence';
    return payload.profile?.tierLabel ? `${payload.profile.tierLabel} affiliate` : 'Affiliate revenue intelligence';
  }, [payload]);

  return (
    <section className={gradientBackground}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,66,148,0.12),_transparent_55%)]" aria-hidden="true" />
      <div className="relative grid gap-10 p-8 md:p-12">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-primary/60">Affiliate programme</p>
            <h2 className="mt-3 text-3xl font-semibold text-primary">{headline}</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Track referrals, monitor tier eligibility, and understand payout readiness in real time. Logic mirrors the admin
              configuration, so every data point is compliance-ready.
            </p>
          </div>
          {payload?.profile?.referralCode ? (
            <div className="flex flex-col items-start gap-2 rounded-3xl border border-primary/20 bg-white/80 px-5 py-4 text-sm font-medium text-primary shadow-sm">
              <span className="text-xs uppercase tracking-[0.35em] text-primary/60">Your referral code</span>
              <span className="text-xl font-semibold tracking-[0.2em]">{payload.profile.referralCode.toUpperCase()}</span>
              <span className="text-xs text-slate-500">Share this across web and mobile — attribution is unified.</span>
            </div>
          ) : null}
        </header>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((index) => (
              <div key={index} className="h-36 animate-pulse rounded-3xl bg-white/60" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/80 px-6 py-5 text-sm text-rose-700">
            <p className="font-semibold">Unable to load affiliate analytics</p>
            <p className="mt-2 text-rose-600/80">{error.message}</p>
          </div>
        ) : payload ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                label="Total commission approved"
                value={affiliateFormatters.currency(payload.earnings.totalCommission)}
                caption="Across approved and pending payouts"
                tone="accent"
              />
              <MetricCard
                label="Pipeline revenue influenced"
                value={affiliateFormatters.currency(payload.earnings.totalRevenue)}
                caption="Attributed order volume within your window"
              />
              <MetricCard
                label="Conversions"
                value={affiliateFormatters.number(payload.earnings.transactionCount)}
                caption={`${affiliateFormatters.number(payload.referrals.length)} active referral streams`}
                tone="success"
              />
            </div>

            <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
              <div className="rounded-3xl border border-white/60 bg-white/85 p-6 shadow-inner">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-primary">Referral performance</h3>
                  <span className="text-xs uppercase tracking-[0.3em] text-primary/60">Last 20 referrals</span>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left">
                    <thead>
                      <tr className="text-xs uppercase tracking-[0.28em] text-primary/60">
                        <th className="py-2 font-medium">Code</th>
                        <th className="py-2 font-medium">Status</th>
                        <th className="py-2 font-medium">Conversions</th>
                        <th className="py-2 font-medium">Revenue</th>
                        <th className="py-2 font-medium">Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payload.referrals.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                            Once a referral converts you will see it tracked here, including recurring payouts.
                          </td>
                        </tr>
                      ) : (
                        payload.referrals.map((referral) => <ReferralRow key={referral.id} referral={referral} />)
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <aside className="space-y-5">
                <div className="rounded-3xl border border-primary/20 bg-primary/10 p-6 shadow-inner">
                  <h3 className="text-lg font-semibold text-primary">Commission tiers</h3>
                  <p className="mt-2 text-sm text-primary/80">
                    Admin-defined rules calculate enterprise-grade commissions across devices. Review the currently active tiers
                    so you can forecast earnings with confidence.
                  </p>
                  <div className="mt-4 space-y-3">
                    {payload.commissionRules.length === 0 ? (
                      <p className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-600">
                        Commission tiers are being finalised. Check back soon.
                      </p>
                    ) : (
                      payload.commissionRules.map((rule) => <RulePill key={rule.id} rule={rule} />)
                    )}
                  </div>
                </div>
                <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-inner text-sm text-slate-600">
                  <h3 className="text-base font-semibold text-primary">Payout guardrails</h3>
                  <ul className="mt-3 space-y-2">
                    <li>
                      Minimum payout: {affiliateFormatters.currency(payload.settings.minimumPayoutAmount)} paid every{' '}
                      {payload.settings.payoutCadenceDays} days.
                    </li>
                    <li>Referrals attribute for {payload.settings.referralAttributionWindowDays} days post click.</li>
                    <li>
                      Auto approval: {payload.settings.autoApproveReferrals ? 'Enabled for fast recognition' : 'Manual review required'}.
                    </li>
                    {payload.settings.disclosureUrl ? (
                      <li>
                        Disclosure policy{' '}
                        <a className="font-medium text-primary underline" href={payload.settings.disclosureUrl}>
                          View terms
                        </a>
                      </li>
                    ) : null}
                  </ul>
                </div>
              </aside>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
