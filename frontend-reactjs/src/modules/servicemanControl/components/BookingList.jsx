import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'pending', label: 'Pending' },
  { value: 'awaiting_assignment', label: 'Awaiting assignment' },
  { value: 'completed', label: 'Completed' },
  { value: 'disputed', label: 'Disputed' }
];

function matchesFilter(booking, filterStatus) {
  if (!filterStatus || filterStatus === 'all') {
    return true;
  }
  if (filterStatus === 'pending') {
    return booking.status === 'pending' || booking.assignmentStatus === 'pending';
  }
  return booking.status === filterStatus;
}

function matchesSearch(booking, searchTerm) {
  if (!searchTerm) return true;
  const haystack = `${booking.title} ${booking.customer?.name ?? ''} ${booking.tags?.join(' ') ?? ''}`.toLowerCase();
  return haystack.includes(searchTerm.toLowerCase());
}

export default function BookingList({
  bookings,
  selectedBookingId,
  onSelect,
  filterStatus,
  onFilterChange,
  searchTerm,
  onSearchChange,
  onRefresh
}) {
  const filteredBookings = Array.isArray(bookings)
    ? bookings.filter((booking) => matchesFilter(booking, filterStatus) && matchesSearch(booking, searchTerm))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <label className="text-sm font-medium text-primary">
              Status filter
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none md:w-auto"
                value={filterStatus}
                onChange={(event) => onFilterChange(event.target.value)}
              >
                {STATUS_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-primary">
              Search
              <input
                type="search"
                placeholder="Search bookings"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none md:w-64"
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
              />
            </label>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={onRefresh}>
            Refresh data
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          {filteredBookings.length} of {bookings?.length ?? 0} bookings shown.
        </p>
      </div>

      <div className="space-y-3">
        {filteredBookings.map((booking) => {
          const isSelected = booking.bookingId === selectedBookingId;
          return (
            <button
              key={booking.bookingId}
              type="button"
              onClick={() => onSelect(booking.bookingId)}
              className={`w-full rounded-2xl border px-4 py-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-slate-200 bg-white hover:border-primary/40'
              }`}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">{booking.title}</p>
                  <p className="text-xs text-slate-500">
                    {booking.customer?.name ? `${booking.customer.name} • ` : ''}
                    {booking.statusLabel}
                    {booking.scheduledStart ? ` • ${new Date(booking.scheduledStart).toLocaleString()}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {booking.tags?.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {booking.summary ? (
                <p className="mt-3 text-sm text-slate-600 line-clamp-2">{booking.summary}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                {booking.slaStatus === 'at_risk' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-700">
                    SLA at risk
                  </span>
                ) : null}
                <span>Commission: {formatCurrencySafe(booking.commissionAmount, booking.currency)}</span>
                {booking.travelMinutes ? <span>Travel buffer: {booking.travelMinutes} mins</span> : null}
              </div>
            </button>
          );
        })}
        {filteredBookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
            No bookings match the current filters.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatCurrencySafe(value, currency = 'GBP') {
  const numeric = Number.parseFloat(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '£0.00';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numeric);
  } catch {
    return `£${numeric.toFixed(2)}`;
  }
}

BookingList.propTypes = {
  bookings: PropTypes.arrayOf(
    PropTypes.shape({
      bookingId: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      statusLabel: PropTypes.string,
      scheduledStart: PropTypes.string,
      summary: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string),
      slaStatus: PropTypes.string,
      commissionAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      currency: PropTypes.string,
      travelMinutes: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      assignmentStatus: PropTypes.string,
      customer: PropTypes.shape({ name: PropTypes.string })
    })
  ),
  selectedBookingId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  filterStatus: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired
};
