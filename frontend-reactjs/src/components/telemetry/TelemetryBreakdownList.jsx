import PropTypes from 'prop-types';
import Card from '../ui/Card.jsx';

const COLOR_MAP = {
  standard: 'from-sky-500 to-indigo-600',
  dark: 'from-slate-600 to-slate-900',
  emo: 'from-fuchsia-500 to-orange-500',
  compact: 'from-emerald-500 to-emerald-600',
  comfortable: 'from-amber-400 to-orange-500',
  high: 'from-amber-500 to-rose-500',
  standard_contrast: 'from-blue-500 to-indigo-500',
  default: 'from-accent to-primary'
};

function resolveGradient(key) {
  if (!key) {
    return COLOR_MAP.default;
  }

  if (COLOR_MAP[key]) {
    return COLOR_MAP[key];
  }

  if (key.includes('enterprise')) {
    return 'from-purple-500 to-indigo-600';
  }

  if (key.includes('season')) {
    return 'from-rose-500 to-orange-500';
  }

  return COLOR_MAP.default;
}

function formatPercent(value) {
  if (Number.isNaN(value) || value === undefined || value === null) {
    return '0%';
  }

  return `${Math.round(value)}%`;
}

export default function TelemetryBreakdownList({ title, description, items, qa }) {
  return (
    <Card
      padding="lg"
      className="border border-slate-100 bg-white/90 shadow-sm shadow-primary/5"
      data-qa={qa}
    >
      <header className="space-y-2">
        <h3 className="text-lg font-semibold text-primary md:text-xl">{title}</h3>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </header>

      <ul className="mt-6 space-y-5">
        {items.map((item) => (
          <li key={item.key} className="space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <p className="font-medium text-primary">{item.label}</p>
                {item.caption ? <p className="text-xs text-slate-500">{item.caption}</p> : null}
              </div>
              <div className="text-right text-sm text-slate-600">
                <p className="font-semibold text-primary">{item.count.toLocaleString()}</p>
                <p>{formatPercent(item.percent)}</p>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${resolveGradient(item.key)}`}
                style={{ width: `${Math.max(item.percent, item.count > 0 ? 6 : 0)}%` }}
                aria-hidden="true"
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

TelemetryBreakdownList.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.node,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      caption: PropTypes.string,
      count: PropTypes.number.isRequired,
      percent: PropTypes.number.isRequired
    })
  ).isRequired,
  qa: PropTypes.string
};

TelemetryBreakdownList.defaultProps = {
  description: undefined,
  qa: undefined
};
