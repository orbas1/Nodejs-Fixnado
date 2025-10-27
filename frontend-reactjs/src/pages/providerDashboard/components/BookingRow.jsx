import PropTypes from 'prop-types';
import { ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useLocale } from '../../../hooks/useLocale.js';

export default function BookingRow({ booking }) {
  const { t, format } = useLocale();
  const etaLabel = booking.eta ? format.dateTime(booking.eta) : t('providerDashboard.bookingsEtaUnknown');

  return (
    <li
      className="provider-dashboard__card provider-dashboard__card-muted"
      data-qa={`provider-dashboard-booking-${booking.id}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--provider-text-primary)]">{booking.client}</p>
          <p className="provider-dashboard__card-meta">{booking.service}</p>
        </div>
        {booking.value != null ? (
          <p className="text-sm font-semibold text-[var(--provider-text-primary)]">{format.currency(booking.value)}</p>
        ) : null}
      </div>
      {booking.thumbnail ? (
        <img src={booking.thumbnail} alt={booking.service ?? booking.client} className="provider-dashboard__thumbnail" loading="lazy" />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--provider-text-secondary)]">
        <span className="inline-flex items-center gap-1">
          <ClockIcon className="h-4 w-4 text-[var(--provider-accent)]" aria-hidden="true" />
          {etaLabel}
        </span>
        <span className="inline-flex items-center gap-1">
          <ChartBarIcon className="h-4 w-4 text-[var(--provider-accent)]" aria-hidden="true" />
          {booking.zone}
        </span>
      </div>
    </li>
  );
}

BookingRow.propTypes = {
  booking: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    client: PropTypes.string.isRequired,
    service: PropTypes.string,
    value: PropTypes.number,
    eta: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    zone: PropTypes.string
  }).isRequired
};
