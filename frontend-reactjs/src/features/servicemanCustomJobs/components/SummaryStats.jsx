import PropTypes from 'prop-types';

function formatCurrency(value, currency = 'GBP') {
  if (!Number.isFinite(value)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return '—';
  }
  return new Intl.NumberFormat().format(value);
}

const CARD_LAYOUT = [
  {
    key: 'totalBids',
    label: 'Total bids',
    tone: 'primary',
    formatter: formatNumber
  },
  {
    key: 'activeBids',
    label: 'Active bids',
    tone: 'amber',
    formatter: formatNumber
  },
  {
    key: 'awardedBids',
    label: 'Awarded',
    tone: 'emerald',
    formatter: formatNumber
  },
  {
    key: 'averageResponseMinutes',
    label: 'Avg. response time',
    tone: 'slate',
    formatter: (value) => (Number.isFinite(value) ? `${value} mins` : '—')
  }
];

const VALUE_CARD_LAYOUT = [
  {
    key: 'pipelineValue',
    label: 'Pipeline value',
    tone: 'amber',
    formatter: formatCurrency
  },
  {
    key: 'awardedValue',
    label: 'Awarded value',
    tone: 'emerald',
    formatter: formatCurrency
  }
];

export default function SummaryStats({ summary }) {
  const currency = summary?.currency || 'GBP';
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {CARD_LAYOUT.map((card) => (
        <div
          key={card.key}
          className="rounded-2xl border border-accent/10 bg-white p-5 shadow-sm"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-primary">
            {card.formatter(summary?.[card.key])}
          </p>
        </div>
      ))}
      {VALUE_CARD_LAYOUT.map((card) => (
        <div
          key={card.key}
          className="rounded-2xl border border-accent/10 bg-gradient-to-br from-white via-secondary/40 to-white p-5 shadow-sm"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-accent">
            {card.formatter(summary?.[card.key], currency)}
          </p>
        </div>
      ))}
    </div>
  );
}

SummaryStats.propTypes = {
  summary: PropTypes.shape({
    currency: PropTypes.string,
    totalBids: PropTypes.number,
    activeBids: PropTypes.number,
    awardedBids: PropTypes.number,
    averageResponseMinutes: PropTypes.number,
    pipelineValue: PropTypes.number,
    awardedValue: PropTypes.number
  })
};

SummaryStats.defaultProps = {
  summary: {}
};
