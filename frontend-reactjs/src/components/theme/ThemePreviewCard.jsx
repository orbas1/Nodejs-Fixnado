import PropTypes from 'prop-types';
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { Button, Card, StatusPill } from '../ui/index.js';

export default function ThemePreviewCard({ preset, active, onSelect, qa }) {
  return (
    <Card
      padding="lg"
      className="flex flex-col gap-6 border-slate-100 bg-white/90 shadow-lg shadow-primary/5"
      data-qa={qa}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-primary">{preset.name}</h3>
          <p className="mt-2 max-w-xs text-sm text-slate-600">{preset.description}</p>
        </div>
        <StatusPill tone={active ? 'success' : 'neutral'} icon={active ? CheckCircleIcon : undefined}>
          {active ? 'Active' : 'Preview'}
        </StatusPill>
      </div>

      <div
        className="rounded-3xl p-6 text-sm shadow-xl"
        style={{ background: preset.preview.gradient, boxShadow: preset.preview.shadow, color: preset.preview.textColor }}
      >
        <p
          className="text-xs uppercase tracking-[0.35em]"
          style={{ color: preset.preview.textMuted }}
        >
          {preset.hero.title}
        </p>
        <p className="mt-4 text-2xl font-semibold" style={{ color: preset.preview.textColor }}>
          {preset.hero.kpi}
        </p>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: preset.preview.textMuted }}>
          {preset.hero.narrative}
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        {preset.swatches.map((swatch) => (
          <div key={swatch.label} className="flex items-center gap-3">
            <span
              className="h-12 w-12 rounded-full border border-white/30 shadow-inner"
              style={{ background: swatch.color }}
              aria-hidden="true"
            />
            <div className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
              <p>{swatch.label}</p>
              <p className="mt-1 text-[0.7rem] lowercase text-slate-400">{swatch.color}</p>
            </div>
          </div>
        ))}
      </div>

      <ul className="space-y-2 text-sm text-slate-600">
        {preset.guardrails.map((rule) => (
          <li key={rule} className="flex items-start gap-3">
            <SparklesIcon aria-hidden="true" className="mt-1 h-4 w-4 text-accent" />
            <span>{rule}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <dl className="grid gap-x-6 gap-y-2 text-xs uppercase tracking-[0.28em] text-slate-500 sm:grid-cols-2">
          {preset.metrics.map((metric) => (
            <div key={metric.label} className="flex flex-col gap-1">
              <dt>{metric.label}</dt>
              <dd className="text-base font-semibold tracking-normal text-primary">{metric.value}</dd>
            </div>
          ))}
        </dl>
        <Button
          variant={active ? 'secondary' : 'primary'}
          onClick={() => onSelect(preset.id)}
          analyticsId={`apply_theme_${preset.id}`}
        >
          {active ? 'Re-apply theme' : `Activate ${preset.name}`}
        </Button>
      </div>
    </Card>
  );
}

ThemePreviewCard.propTypes = {
  preset: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    hero: PropTypes.shape({
      title: PropTypes.string.isRequired,
      kpi: PropTypes.string.isRequired,
      narrative: PropTypes.string.isRequired
    }).isRequired,
    preview: PropTypes.shape({
      gradient: PropTypes.string.isRequired,
      textColor: PropTypes.string.isRequired,
      textMuted: PropTypes.string.isRequired,
      shadow: PropTypes.string.isRequired
    }).isRequired,
    swatches: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired
      })
    ).isRequired,
    guardrails: PropTypes.arrayOf(PropTypes.string).isRequired,
    metrics: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired
      })
    ).isRequired
  }).isRequired,
  active: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  qa: PropTypes.string
};

ThemePreviewCard.defaultProps = {
  active: false,
  qa: undefined
};
