import PropTypes from 'prop-types';
import clsx from 'clsx';
import { formatCurrency } from '../../../utils/numberFormatters.js';

const SUMMARY_CONFIG = [
  {
    key: 'activeAssignments',
    label: 'Active assignments',
    description: 'Jobs in progress with the crew.',
    accent: 'from-emerald-50 via-white to-sky-50'
  },
  {
    key: 'scheduledAssignments',
    label: 'Scheduled jobs',
    description: 'Visits scheduled for upcoming shifts.',
    accent: 'from-sky-50 via-white to-indigo-50'
  },
  {
    key: 'awaitingResponse',
    label: 'Awaiting response',
    description: 'Assignments requiring acknowledgement.',
    accent: 'from-amber-50 via-white to-rose-50'
  },
  {
    key: 'completedThisMonth',
    label: 'Completed this window',
    description: 'Jobs completed in the current reporting window.',
    accent: 'from-indigo-50 via-white to-violet-50'
  },
  {
    key: 'slaAtRisk',
    label: 'SLA at risk',
    description: 'Bookings nearing their SLA deadline.',
    accent: 'from-rose-50 via-white to-amber-50'
  },
  {
    key: 'revenueEarned',
    label: 'Commission earned',
    description: 'Commission accrued on assignments.',
    formatter: (value, summary) => formatCurrency(value ?? 0, summary.currency ?? 'GBP'),
    accent: 'from-emerald-50 via-white to-teal-50'
  },
  {
    key: 'averageTravelMinutes',
    label: 'Average travel buffer',
    description: 'Average travel time budget per job.',
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
    activeAssignments: PropTypes.number,
    scheduledAssignments: PropTypes.number,
    awaitingResponse: PropTypes.number,
    completedThisMonth: PropTypes.number,
    slaAtRisk: PropTypes.number,
    revenueEarned: PropTypes.number,
    averageTravelMinutes: PropTypes.number,
    currency: PropTypes.string
  })
};
