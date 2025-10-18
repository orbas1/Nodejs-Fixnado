import PropTypes from 'prop-types';
import clsx from 'clsx';

const CONDITION_BADGES = {
  calibrated: { label: 'Calibrated', tone: 'success' },
  maintenance_due: { label: 'Service', tone: 'warning' },
  retired: { label: 'Retired', tone: 'danger' },
  service: { label: 'Active', tone: 'neutral' }
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
        'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em]',
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

function AvailabilityTag({ value }) {
  const clamped = Math.max(0, Math.min(1, value ?? 0));
  const tone = clamped > 0.66 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : clamped < 0.34 ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-amber-600 bg-amber-50 border-amber-200';
  return (
    <span className={clsx('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]', tone)}>
      Ready {Math.round(clamped * 100)}%
    </span>
  );
}

AvailabilityTag.propTypes = {
  value: PropTypes.number
};

export default function ToolsShowcase({ items, loading, onHire, onInspect, onShowGallery, onFocus }) {
  const safeItems = Array.isArray(items) ? items : [];
  const isEmpty = !loading && safeItems.length === 0;

  return (
    <section className="space-y-6" aria-labelledby="tools-showcase-heading">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="tools-showcase-heading" className="text-2xl font-semibold text-primary">
          Inventory
        </h2>
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          {safeItems.length} tools
        </span>
      </header>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex h-64 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-100/80"
              aria-hidden="true"
            >
              <div className="h-40 animate-pulse bg-slate-200" />
              <div className="flex-1 animate-pulse bg-slate-100" />
            </div>
          ))}
        </div>
      ) : null}

      {isEmpty ? (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-primary">Add equipment to begin.</p>
        </div>
      ) : null}

      {!loading && !isEmpty ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {safeItems.map((tool) => (
            <article
              key={tool.id}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-primary/60 hover:shadow-lg"
              data-qa={`tool-card-${tool.id}`}
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    onFocus?.(tool);
                    onShowGallery?.(tool);
                  }}
                  className="block h-48 w-full overflow-hidden"
                >
                  <img
                    src={tool.heroImage}
                    alt={tool.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                </button>
                <div className="absolute left-4 top-4 flex flex-col gap-2">
                  <ConditionBadge condition={tool.condition} />
                  <AvailabilityTag value={tool.availabilityScore} />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onFocus?.(tool);
                    onShowGallery?.(tool);
                  }}
                  className="absolute right-4 top-4 rounded-full bg-black/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white backdrop-blur transition hover:bg-black/80"
                >
                  Media
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-5 p-6">
                <header className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{tool.category}</p>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-primary">{tool.name}</h3>
                    <button
                      type="button"
                      onClick={() => onFocus?.(tool)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500 transition hover:border-primary hover:text-primary"
                    >
                      Open
                    </button>
                  </div>
                </header>

                {tool.pricing?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {tool.pricing.map((tier) => (
                      <span
                        key={tier.id}
                        className="rounded-full border border-primary/30 bg-primary/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary"
                      >
                        {tier.label} {tier.value}
                      </span>
                    ))}
                  </div>
                ) : null}

                <dl className="grid grid-cols-2 gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  {tool.location ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]">
                      <dt>Location</dt>
                      <dd className="mt-1 text-sm normal-case text-primary">{tool.location}</dd>
                    </div>
                  ) : null}
                  {tool.rentalRateLabel ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]">
                      <dt>Rate</dt>
                      <dd className="mt-1 text-sm normal-case text-primary">{tool.rentalRateLabel}</dd>
                    </div>
                  ) : null}
                  {tool.nextService ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]">
                      <dt>Service</dt>
                      <dd className="mt-1 text-sm normal-case text-primary">{tool.nextService}</dd>
                    </div>
                  ) : null}
                </dl>

                {tool.gallery?.length > 1 ? (
                  <div className="flex gap-2 overflow-x-auto">
                    {tool.gallery.slice(0, 4).map((src) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => {
                          onFocus?.(tool);
                          onShowGallery?.(tool);
                        }}
                        className="h-14 w-16 overflow-hidden rounded-xl border border-slate-200"
                      >
                        <img src={src} alt="Gallery view" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="mt-auto flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onHire?.(tool)}
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
                  >
                    Rent
                  </button>
                  <button
                    type="button"
                    onClick={() => onInspect?.(tool)}
                    className="inline-flex items-center justify-center rounded-full border border-primary/30 px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary hover:text-primary"
                  >
                    Track
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onFocus?.(tool);
                      onShowGallery?.(tool);
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
                  >
                    Media
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
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      category: PropTypes.string,
      description: PropTypes.string,
      rentalRateLabel: PropTypes.string,
      utilisation: PropTypes.number,
      nextService: PropTypes.string,
      availabilityScore: PropTypes.number,
      condition: PropTypes.string,
      compliance: PropTypes.arrayOf(PropTypes.string),
      location: PropTypes.string,
      pricing: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
          label: PropTypes.string.isRequired,
          value: PropTypes.string.isRequired
        })
      ),
      heroImage: PropTypes.string,
      gallery: PropTypes.arrayOf(PropTypes.string)
    })
  ),
  loading: PropTypes.bool,
  onHire: PropTypes.func,
  onInspect: PropTypes.func,
  onShowGallery: PropTypes.func,
  onFocus: PropTypes.func
};

ToolsShowcase.defaultProps = {
  items: [],
  loading: false,
  onHire: undefined,
  onInspect: undefined,
  onShowGallery: undefined,
  onFocus: undefined
};
