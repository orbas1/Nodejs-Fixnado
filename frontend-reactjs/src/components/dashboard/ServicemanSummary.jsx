import PropTypes from 'prop-types';
import StatusPill from '../ui/StatusPill.jsx';

const numberFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
const currencyFormatter = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });

function formatNumber(value) {
  if (value == null) {
    return '0';
  }
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return numberFormatter.format(numeric);
}

function formatCurrency(value) {
  if (value == null) {
    return currencyFormatter.format(0);
  }
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return currencyFormatter.format(0);
  }
  return currencyFormatter.format(numeric);
}

const travelDeltaCopy = (current, previous) => {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    return { copy: 'Live travel telemetry', tone: 'neutral' };
  }
  const delta = Math.round(current - previous);
  if (delta === 0) {
    return { copy: 'Travel buffer holding steady', tone: 'neutral' };
  }
  if (delta < 0) {
    return { copy: `${Math.abs(delta)}m faster vs prior window`, tone: 'success' };
  }
  return { copy: `${delta}m slower vs prior window`, tone: 'warning' };
};

const velocityMax = (weeks = []) => {
  if (!Array.isArray(weeks) || weeks.length === 0) {
    return 1;
  }
  return Math.max(...weeks.map((item) => {
    const accepted = Number.parseFloat(item.accepted ?? 0);
    const autoMatches = Number.parseFloat(item.autoMatches ?? 0);
    const total = Number.isFinite(accepted) ? accepted : 0;
    const matched = Number.isFinite(autoMatches) ? autoMatches : 0;
    return Math.max(total + matched, 1);
  }));
};

export default function ServicemanSummary({ metadata, windowLabel }) {
  const totals = metadata?.totals ?? {};
  const crewLead = metadata?.crewLead || metadata?.crewMember || (metadata?.crew?.[0] ?? null);
  const crew = Array.isArray(metadata?.crew) ? metadata.crew : [];
  const region = metadata?.region || 'Multi-zone coverage';
  const velocity = metadata?.velocity ?? {};
  const weeklyVelocity = Array.isArray(velocity.weekly) ? velocity.weekly : [];
  const maxVelocity = velocityMax(weeklyVelocity);
  const travelMinutes = Number.parseFloat(velocity.travelMinutes ?? 0);
  const previousTravelMinutes = Number.parseFloat(velocity.previousTravelMinutes ?? 0);
  const travelSummary = travelDeltaCopy(travelMinutes, previousTravelMinutes);
  const activeAssignments = (totals.scheduled ?? 0) + (totals.inProgress ?? 0);

  const metrics = [
    {
      id: 'completed',
      label: 'Completed assignments',
      value: formatNumber(totals.completed)
    },
    {
      id: 'active',
      label: 'Active window load',
      value: formatNumber(activeAssignments),
      helper: `${formatNumber(totals.scheduled)} scheduled • ${formatNumber(totals.inProgress)} in progress`
    },
    {
      id: 'revenue',
      label: 'Commission earned',
      value: formatCurrency(totals.revenue),
      helper: `${formatNumber(totals.autoMatched)} auto-matched • ${formatNumber(totals.adsSourced)} via Fixnado Ads`
    }
  ];

  return (
    <section
      className="rounded-3xl border border-slate-800/40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-white shadow-glow lg:p-8"
      data-qa="serviceman-dashboard-summary"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              Crew performance
            </span>
            {windowLabel ? (
              <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-200">
                {windowLabel}
              </span>
            ) : null}
          </div>
          <h2 className="text-3xl font-semibold text-white">
            {crewLead?.name || 'Crew readiness'}
          </h2>
          <p className="max-w-xl text-sm text-slate-300">
            {crewLead?.role ? `${crewLead.role} • ${region}` : region}. Maintain on-time arrivals, quality checks, and automation wins across every dispatch.
          </p>
        </div>
        <div className="grid w-full max-w-xl gap-4 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">{metric.value}</p>
              {metric.helper ? <p className="mt-2 text-xs text-slate-400">{metric.helper}</p> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <header className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Crew roster</h3>
              <p className="text-xs text-slate-400">Top performers in the current analytics window.</p>
            </div>
            {travelSummary ? <StatusPill tone={travelSummary.tone}>{travelSummary.copy}</StatusPill> : null}
          </header>
          <ul className="mt-5 divide-y divide-slate-800/80">
            {crew.length === 0 ? (
              <li className="py-4 text-sm text-slate-400">No crew assignments recorded in the current window.</li>
            ) : (
              crew.slice(0, 4).map((member) => (
                <li key={member.id} className="flex flex-wrap items-center justify-between gap-4 py-4" data-qa={`serviceman-crew-${member.id}`}>
                  <div>
                    <p className="text-sm font-semibold text-white">{member.name}</p>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{member.role}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                    <span className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-3 py-1">
                      {formatNumber(member.completed)} completed
                    </span>
                    <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1">
                      {formatNumber(member.active)} active
                    </span>
                    <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1">
                      {formatNumber(member.assignments)} total
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-lg font-semibold text-white">Velocity signals</h3>
          <p className="mt-2 text-xs text-slate-400">Weekly acceptances and automation wins.</p>
          <div className="mt-6 flex items-end gap-3">
            {weeklyVelocity.length === 0 ? (
              <p className="text-sm text-slate-400">No velocity telemetry for this window.</p>
            ) : (
              weeklyVelocity.map((entry) => {
                const accepted = Number.parseFloat(entry.accepted ?? 0);
                const autoMatches = Number.parseFloat(entry.autoMatches ?? 0);
                const total = Math.max(0, (Number.isFinite(accepted) ? accepted : 0) + (Number.isFinite(autoMatches) ? autoMatches : 0));
                const height = Math.max(16, Math.round((total / maxVelocity) * 96));
                return (
                  <div key={entry.label} className="flex flex-1 flex-col items-center gap-2" aria-label={`${entry.label} velocity`}>
                    <div className="flex w-full flex-col justify-end rounded-t-2xl bg-slate-800" style={{ height }}>
                      <div className="h-2 w-full rounded-t-2xl bg-emerald-400/70" />
                    </div>
                    <div className="text-center text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">{entry.label}</div>
                    <div className="text-[0.7rem] text-slate-300">{formatNumber(total)} jobs</div>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-300">
            <p>
              Average travel buffer <span className="font-semibold text-white">{formatNumber(travelMinutes)} minutes</span>
            </p>
            <p className="mt-1">Automation wins: {formatNumber(totals.autoMatched)} auto-matched • {formatNumber(totals.adsSourced)} via Fixnado Ads</p>
          </div>
        </div>
      </div>
    </section>
  );
}

ServicemanSummary.propTypes = {
  metadata: PropTypes.shape({
    totals: PropTypes.object,
    crewLead: PropTypes.object,
    crewMember: PropTypes.object,
    crew: PropTypes.array,
    region: PropTypes.string,
    velocity: PropTypes.object
  }),
  windowLabel: PropTypes.string
};

ServicemanSummary.defaultProps = {
  metadata: null,
  windowLabel: null
};
