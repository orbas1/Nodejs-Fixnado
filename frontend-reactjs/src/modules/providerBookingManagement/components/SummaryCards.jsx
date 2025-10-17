import PropTypes from 'prop-types';
import clsx from 'clsx';
import { formatCurrency } from '../../../utils/numberFormatters.js';

const SUMMARY_CONFIG = [
  {
    key: 'activeBookings',
    label: 'Active bookings',
    description: 'Jobs in progress across crews.',
    accent: 'from-emerald-50 via-white to-sky-50'
  },
  {
    key: 'scheduledBookings',
    label: 'Scheduled visits',
    description: 'Confirmed appointments on the calendar.',
    accent: 'from-sky-50 via-white to-indigo-50'
  },
  {
    key: 'awaitingDispatch',
    label: 'Awaiting dispatch',
    description: 'Bookings needing crew assignment or confirmation.',
    accent: 'from-amber-50 via-white to-rose-50'
  },
  {
    key: 'completedThisMonth',
    label: 'Completed (30 days)',
    description: 'Bookings completed within the current rolling window.',
    accent: 'from-indigo-50 via-white to-violet-50'
  },
  {
    key: 'slaAtRisk',
    label: 'SLA at risk',
    description: 'Engagements with an SLA expiring in the next six hours.',
    accent: 'from-rose-50 via-white to-amber-50'
  },
  {
    key: 'revenueScheduled',
    label: 'Commission pipeline',
    description: 'Projected commission value on active work.',
    formatter: (value, summary) => formatCurrency(value ?? 0, summary.currency ?? 'GBP'),
    accent: 'from-emerald-50 via-white to-teal-50'
  },
  {
    key: 'averageTravelMinutes',
    label: 'Average travel buffer',
    description: 'Average travel time budget across upcoming work.',
    formatter: (value) => `${value ?? 0} mins`,
    accent: 'from-slate-50 via-white to-slate-100'
  }
];

export default function SummaryCards({ summary }) {
  const summaryWithCurrency = summary ?? {};
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {SUMMARY_CONFIG.map((item) => {
        const rawValue = summaryWithCurrency[item.key];
        const value = item.formatter
          ? item.formatter(rawValue, summaryWithCurrency)
          : new Intl.NumberFormat().format(rawValue ?? 0);
        return (
          <div
            key={item.key}
            className={clsx(
              'rounded-2xl border border-slate-200 bg-gradient-to-br p-5 shadow-sm transition hover:shadow-md',
              item.accent ?? 'from-white via-white to-white'
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-primary">{value}</p>
            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
}

SummaryCards.propTypes = {
  summary: PropTypes.shape({
    activeBookings: PropTypes.number,
    scheduledBookings: PropTypes.number,
    awaitingDispatch: PropTypes.number,
    completedThisMonth: PropTypes.number,
    slaAtRisk: PropTypes.number,
    revenueScheduled: PropTypes.number,
    averageTravelMinutes: PropTypes.number,
    currency: PropTypes.string
  })
};

SummaryCards.defaultProps = {
  summary: null
};
