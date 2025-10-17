import PropTypes from 'prop-types';
import clsx from 'clsx';

const badgeClasses = {
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  risk: 'bg-rose-50 text-rose-700 border-rose-200',
  standby: 'bg-primary/5 text-primary border-primary/20',
  travel: 'bg-sky-50 text-sky-700 border-sky-200'
};

const CalendarLegend = ({ legend, title }) => {
  if (!legend || legend.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-accent/10 bg-white/80 p-6 shadow-sm">
      {title ? <h3 className="text-sm font-semibold text-primary">{title}</h3> : null}
      <ul className="mt-4 space-y-3 text-sm text-slate-600">
        {legend.map((item) => {
          const tone = badgeClasses[item.status] || 'bg-slate-100 text-slate-600 border-slate-200';
          return (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <span>{item.label}</span>
              <span className={clsx('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]', tone)}>
                {item.status?.replace(/_/g, ' ') || 'status'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

CalendarLegend.propTypes = {
  legend: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      status: PropTypes.string
    })
  ),
  title: PropTypes.node
};

CalendarLegend.defaultProps = {
  legend: [],
  title: null
};

export default CalendarLegend;
