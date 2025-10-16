import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short'
});

function formatDateTime(value) {
  if (!value) {
    return 'To be scheduled';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'To be scheduled';
  }
  return dateTimeFormatter.format(parsed);
}

const UpcomingSchedule = ({
  bookings,
  title,
  emptyLabel,
  onSelect,
  onCreate,
  canCreate
}) => {
  const items = bookings.slice(0, 6);

  return (
    <div className="rounded-3xl border border-accent/10 bg-white/80 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
        {canCreate ? (
          <Button size="sm" variant="secondary" onClick={onCreate}>
            {emptyLabel?.ctaLabel ?? 'Create booking'}
          </Button>
        ) : null}
      </div>
      <ul className="mt-4 space-y-3 text-sm text-slate-600">
        {items.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-accent/20 bg-white/60 p-4 text-center text-xs text-slate-500">
            {emptyLabel?.message ?? 'No upcoming bookings captured for this period.'}
          </li>
        ) : (
          items.map((booking) => (
            <li key={booking.id}>
              <button
                type="button"
                onClick={() => onSelect(booking)}
                className="flex w-full flex-col items-start gap-1 rounded-2xl border border-accent/20 bg-secondary/50 px-4 py-3 text-left transition hover:border-primary/40 hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <span className="text-sm font-semibold text-primary">{booking.title}</span>
                <span className="text-xs uppercase tracking-[0.3em] text-primary/60">
                  {booking.status?.replace(/_/g, ' ') || 'scheduled'}
                </span>
                <span className="text-xs text-slate-500">{formatDateTime(booking.start)}</span>
                <span className="text-xs text-slate-500">{booking.zoneName || 'Unassigned zone'}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

UpcomingSchedule.propTypes = {
  bookings: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      start: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      zoneName: PropTypes.string,
      status: PropTypes.string
    })
  ),
  title: PropTypes.node,
  emptyLabel: PropTypes.shape({
    message: PropTypes.node,
    ctaLabel: PropTypes.node
  }),
  onSelect: PropTypes.func,
  onCreate: PropTypes.func,
  canCreate: PropTypes.bool
};

UpcomingSchedule.defaultProps = {
  bookings: [],
  title: 'Upcoming schedule',
  emptyLabel: null,
  onSelect: () => {},
  onCreate: () => {},
  canCreate: false
};

export default UpcomingSchedule;
