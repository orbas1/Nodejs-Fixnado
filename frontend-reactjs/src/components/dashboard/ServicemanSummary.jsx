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
  const rawTravel = Number.parseFloat(velocity.travelMinutes ?? totals.travelMinutes ?? 0);
  const travelMinutes = Number.isFinite(rawTravel) ? rawTravel : 0;
  const rawPrevious = Number.parseFloat(velocity.previousTravelMinutes ?? totals.previousTravelMinutes ?? travelMinutes);
  const previousTravelMinutes = Number.isFinite(rawPrevious) ? rawPrevious : travelMinutes;
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

  const highlightedCrew = crew
    .filter((member) => member && (member.name || member.role))
    .slice(0, 4);

  return (
    <section
      className="rounded-3xl border border-primary/40 bg-gradient-to-br from-primary via-[#122a53] to-[#050f24] p-6 text-white shadow-glow ring-1 ring-primary/10 lg:p-8"
      data-qa="serviceman-dashboard-summary"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-accent/90">
              Crew performance
            </span>
            {windowLabel ? (
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                {windowLabel}
              </span>
            ) : null}
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
              {crewLead?.name || 'Crew readiness'}
            </h2>
            <p className="max-w-2xl text-sm text-white/70">
              {crewLead?.role ? `${crewLead.role} • ${region}` : region}. Maintain on-time arrivals, compliance checks, and automation wins across every dispatch.
            </p>
          </div>
        </div>
        <div className="grid w-full max-w-xl gap-4 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/60">{metric.label}</p>
                <p className="mt-3 text-2xl font-semibold text-emerald-300">{metric.value}</p>
              </div>
              {metric.helper ? <p className="mt-3 text-xs text-white/70">{metric.helper}</p> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Crew roster</h3>
              <p className="text-xs text-white/70">Top performers in the current analytics window.</p>
            </div>
            {travelSummary ? <StatusPill tone={travelSummary.tone}>{travelSummary.copy}</StatusPill> : null}
          </header>
          <ul className="mt-5 divide-y divide-white/10">
            {highlightedCrew.length === 0 ? (
              <li className="py-4 text-sm text-white/70">No crew assignments recorded in the current window.</li>
            ) : (
              highlightedCrew.map((member) => {
                const completed = formatNumber(member.completed);
                const active = formatNumber(member.active);
                const total = formatNumber(member.assignments);

                return (
                  <li
                    key={member.id ?? member.name}
                    className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    data-qa={`serviceman-crew-${member.id ?? member.name}`}
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-semibold text-white">{member.name || 'Crew member'}</p>
                      <p className="text-xs uppercase tracking-[0.25em] text-white/50">{member.role || 'Crew specialist'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-white/80">
                      <span className="rounded-full border border-emerald-300/50 bg-emerald-400/10 px-3 py-1 font-semibold text-emerald-200">
                        {completed} completed
                      </span>
                      <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-semibold text-accent/90">
                        {active} active
                      </span>
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-semibold text-white/80">
                        {total} total
                      </span>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold text-white">Velocity signals</h3>
          <p className="mt-2 text-xs text-white/70">Weekly acceptances and automation wins.</p>
          <div className="mt-6 flex items-end gap-3" role="list" aria-label="Weekly velocity">
            {weeklyVelocity.length === 0 ? (
              <p className="text-sm text-white/70">No velocity telemetry for this window.</p>
            ) : (
              weeklyVelocity.map((entry) => {
                const accepted = Number.parseFloat(entry.accepted ?? 0);
                const autoMatches = Number.parseFloat(entry.autoMatches ?? 0);
                const total = Math.max(0, (Number.isFinite(accepted) ? accepted : 0) + (Number.isFinite(autoMatches) ? autoMatches : 0));
                const height = Math.max(18, Math.round((total / maxVelocity) * 96));
                const label = entry.label || 'Week';
                return (
                  <div
                    key={`${label}-${total}`}
                    className="flex flex-1 flex-col items-center gap-2"
                    role="listitem"
                    aria-label={`${label} velocity`}
                  >
                    <div className="flex w-full flex-col justify-end rounded-t-2xl bg-white/10" style={{ height }}>
                      <div className="h-2 w-full rounded-t-2xl bg-gradient-to-r from-accent to-emerald-300" />
                    </div>
                    <div className="text-center text-[0.65rem] uppercase tracking-[0.25em] text-white/50">{label}</div>
                    <div className="text-[0.7rem] text-white/80">{formatNumber(total)} jobs</div>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-primary/50 px-4 py-3 text-xs text-white/80">
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
