import PropTypes from 'prop-types';
import clsx from 'clsx';

const CONDITION_BADGES = {
  calibrated: { label: 'Calibrated', tone: 'success' },
  maintenance_due: { label: 'Maintenance due', tone: 'warning' },
  retired: { label: 'Retired', tone: 'danger' },
  service: { label: 'In service', tone: 'neutral' }
};

const AVAILABILITY_LABELS = {
  high: 'High availability',
  medium: 'Moderate availability',
  low: 'Limited availability'
};

const badgeClassNames = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200'
};

function ConditionBadge({ condition }) {
  if (!condition) return null;
  const badge = CONDITION_BADGES[condition] ?? { label: condition, tone: 'neutral' };
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em]',
        badgeClassNames[badge.tone] ?? badgeClassNames.neutral
      )}
    >
      {badge.label}
    </span>
  );
}

ConditionBadge.propTypes = {
  condition: PropTypes.string
};

function AvailabilityMeter({ value }) {
  const clamped = Math.max(0, Math.min(1, value ?? 0));
  const tone = clamped > 0.66 ? 'bg-emerald-500' : clamped < 0.34 ? 'bg-rose-500' : 'bg-amber-500';
  const label = clamped > 0.66 ? AVAILABILITY_LABELS.high : clamped < 0.34 ? AVAILABILITY_LABELS.low : AVAILABILITY_LABELS.medium;
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span className="font-semibold text-primary">{Math.round(clamped * 100)}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.round(clamped * 100)}%` }} />
      </div>
    </div>
  );
}

AvailabilityMeter.propTypes = {
  value: PropTypes.number
};

export default function ToolsShowcase({
  items,
  loading,
  categories,
  activeCategory,
  onCategoryChange,
  onHire,
  onInspect,
  persona
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const isEmpty = !loading && safeItems.length === 0;

  return (
    <section className="space-y-6" aria-labelledby="tools-showcase-heading">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 id="tools-showcase-heading" className="text-2xl font-semibold text-primary">
            Deployment-ready tool inventory
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Calibrated tooling with telemetry, service history, and escrow-ready documentation for {persona} squads.
          </p>
        </div>
        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const selected = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onCategoryChange?.(selected ? null : category.id)}
                  className={clsx(
                    'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition',
                    selected
                      ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-primary/40 hover:text-primary'
                  )}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </header>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-3xl border border-slate-200 bg-slate-100/80"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : null}

      {isEmpty ? (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-primary">No tooling available</p>
          <p className="mt-2 text-sm text-slate-500">
            Connect your rental depots or sync depot telemetry to surface tooling in this workspace.
          </p>
        </div>
      ) : null}

      {!loading && !isEmpty ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {safeItems.map((tool) => (
            <article
              key={tool.id}
              className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm"
              data-qa={`tool-card-${tool.id}`}
            >
              <header className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{tool.category}</p>
                    <h3 className="mt-1 text-lg font-semibold text-primary">{tool.name}</h3>
                  </div>
                  {tool.condition ? <ConditionBadge condition={tool.condition} /> : null}
                </div>
                <p className="text-sm text-slate-600">{tool.description}</p>
              </header>

              <dl className="mt-4 space-y-3 text-sm text-slate-600">
                {tool.location ? (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-semibold text-primary">Location</dt>
                    <dd>{tool.location}</dd>
                  </div>
                ) : null}
                {tool.rentalRateLabel ? (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-semibold text-primary">Rental</dt>
                    <dd>{tool.rentalRateLabel}</dd>
                  </div>
                ) : null}
                {tool.utilisation != null ? (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-semibold text-primary">Utilisation</dt>
                    <dd>{Math.round(tool.utilisation * 100)}%</dd>
                  </div>
                ) : null}
                {tool.nextService ? (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-semibold text-primary">Next service</dt>
                    <dd>{tool.nextService}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-6 space-y-4">
                <AvailabilityMeter value={tool.availabilityScore} />
                {tool.compliance?.length ? (
                  <ul className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">
                    {tool.compliance.map((item) => (
                      <li
                        key={item}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-primary/80"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onHire?.(tool)}
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
                  >
                    Reserve
                  </button>
                  <button
                    type="button"
                    onClick={() => onInspect?.(tool)}
                    className="inline-flex items-center justify-center rounded-full border border-primary/30 px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary hover:text-primary"
                  >
                    View telemetry
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

ToolsShowcase.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      description: PropTypes.string,
      rentalRateLabel: PropTypes.string,
      utilisation: PropTypes.number,
      nextService: PropTypes.string,
      availabilityScore: PropTypes.number,
      condition: PropTypes.string,
      compliance: PropTypes.arrayOf(PropTypes.string),
      location: PropTypes.string
    })
  ),
  loading: PropTypes.bool,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  activeCategory: PropTypes.string,
  onCategoryChange: PropTypes.func,
  onHire: PropTypes.func,
  onInspect: PropTypes.func,
  persona: PropTypes.string
};

ToolsShowcase.defaultProps = {
  items: [],
  loading: false,
  categories: [],
  activeCategory: null,
  onCategoryChange: undefined,
  onHire: undefined,
  onInspect: undefined,
  persona: 'provider'
};

