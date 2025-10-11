import PropTypes from 'prop-types';

const variantCopy = {
  hero: {
    title: 'Campaign hero band',
    body: 'Showcases geo-personalised offers with gradient overlays that adapt to the active theme.',
    cta: 'Launch campaign'
  },
  announcement: {
    title: 'Regulatory announcement',
    body: 'Highlights compliance updates and consent reminders with persistent CTA and supporting links.',
    cta: 'View policy'
  },
  seasonal: {
    title: 'Seasonal overlay',
    body: 'Applies animated confetti layers and curated imagery aligned to marketplace promotions.',
    cta: 'Explore drops'
  }
};

export default function MarketingModulePreview({ variant }) {
  const copy = variantCopy[variant];

  if (variant === 'hero') {
    return (
      <div
        className="flex flex-col gap-6 rounded-[2.25rem] p-8 text-[var(--fx-hero-foreground)] shadow-xl"
        style={{ background: 'var(--fx-hero-gradient)', boxShadow: 'var(--fx-hero-shadow)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--fx-hero-foreground-subtle)]">Featured theme</p>
            <h3 className="mt-3 text-3xl font-semibold">{copy.title}</h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--fx-hero-foreground-subtle)]">{copy.body}</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-[var(--fx-hero-foreground)] backdrop-blur hover:bg-white/20"
          >
            {copy.cta}
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {['Bookings boost', 'Rental spotlight', 'Compliance ready'].map((label) => (
            <div key={label} className="rounded-3xl border border-white/20 bg-white/10 p-4 text-sm">
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--fx-hero-foreground-subtle)]">{label}</p>
              <p className="mt-2 text-lg font-semibold">{label === 'Bookings boost' ? '+18% conversions' : label === 'Rental spotlight' ? '£12.4k GMV' : 'All checks green'}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'announcement') {
    return (
      <div
        className="rounded-[2rem] border p-6 shadow-sm"
        style={{
          background: 'var(--fx-announcement-bg)',
          borderColor: 'var(--fx-announcement-border)',
          color: 'var(--fx-announcement-foreground)'
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] opacity-80">Compliance spotlight</p>
            <h3 className="mt-2 text-xl font-semibold">{copy.title}</h3>
            <p className="mt-1 text-sm leading-relaxed opacity-90">{copy.body}</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-current px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
          >
            {copy.cta}
          </button>
        </div>
        <ul className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            { label: 'GDPR update', status: 'Live 2 Feb' },
            { label: 'Insurance audit', status: 'Scheduled 7 Feb' },
            { label: 'Consent banner', status: 'Variant B testing' }
          ].map((item) => (
            <li key={item.label} className="rounded-2xl border border-white/30 bg-white/10 p-4 text-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.35em] opacity-80">{item.label}</p>
              <p className="mt-2 font-semibold">{item.status}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-[2rem] border border-[var(--fx-seasonal-highlight)] bg-[var(--fx-seasonal-overlay)] p-8 text-[var(--fx-seasonal-text)] shadow-xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_55%)]" aria-hidden="true" />
      <div className="relative flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--fx-seasonal-highlight)]">Limited drop</p>
        <h3 className="text-3xl font-semibold">{copy.title}</h3>
        <p className="text-sm leading-relaxed opacity-90">{copy.body}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.35em]">
          {['Vinyl nights', 'Neon perks', 'Zone exclusives'].map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-[var(--fx-seasonal-highlight)]/50 bg-white/10 px-4 py-2 backdrop-blur"
            >
              {pill}
            </span>
          ))}
        </div>
        <button
          type="button"
          className="mt-6 self-start rounded-full bg-[var(--fx-seasonal-highlight)] px-6 py-3 text-sm font-semibold text-[var(--fx-color-text-inverse)] shadow-lg shadow-[var(--fx-seasonal-highlight)]/40 hover:shadow-xl"
        >
          {copy.cta}
        </button>
      </div>
    </div>
  );
}

MarketingModulePreview.propTypes = {
  variant: PropTypes.oneOf(['hero', 'announcement', 'seasonal']).isRequired
};
