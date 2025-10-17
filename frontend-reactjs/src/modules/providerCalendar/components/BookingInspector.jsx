import Button from '../../../components/ui/Button.jsx';
import { useProviderCalendar } from '../ProviderCalendarProvider.jsx';

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short'
});

function formatDateTime(value) {
  if (!value) {
    return 'Not scheduled';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not scheduled';
  }
  return dateTimeFormatter.format(date);
}

const BookingInspector = () => {
  const { selectedItem, actions, permissions } = useProviderCalendar();
  const canManageBookings = permissions?.canManageBookings !== false;
  const canManageEvents = permissions?.canManageEvents !== false;

  if (!selectedItem) {
    return (
      <div className="rounded-3xl border border-accent/10 bg-white/70 p-6 text-sm text-slate-500">
        Select a booking or event to view details.
      </div>
    );
  }

  if (selectedItem.kind === 'booking') {
    return (
      <div className="rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Booking</p>
            <h3 className="mt-1 text-xl font-semibold text-primary">{selectedItem.title}</h3>
          </div>
          <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary/70">
            {selectedItem.status?.replace(/_/g, ' ') || 'scheduled'}
          </span>
        </div>
        <dl className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-500">Start</dt>
            <dd className="mt-1">{formatDateTime(selectedItem.start)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">End</dt>
            <dd className="mt-1">{formatDateTime(selectedItem.end)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Zone</dt>
            <dd className="mt-1">{selectedItem.zoneName || 'Unassigned'}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Customer</dt>
            <dd className="mt-1">{selectedItem.customerName || '—'}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          {canManageBookings ? (
            <Button size="sm" onClick={() => actions.openBookingEditor(selectedItem)}>
              Edit schedule
            </Button>
          ) : null}
          {canManageEvents ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => actions.openCreateEvent({ title: selectedItem.title, bookingId: selectedItem.id })}
            >
              Add calendar hold
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => actions.clearSelection()}>
            Close
          </Button>
        </div>
        {!canManageBookings ? (
          <p className="mt-3 text-xs text-slate-500">You have view-only access to bookings.</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Event</p>
          <h3 className="mt-1 text-xl font-semibold text-primary">{selectedItem.title}</h3>
        </div>
        <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary/70">
          {selectedItem.status?.replace(/_/g, ' ') || 'planned'}
        </span>
      </div>
      <dl className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-500">Start</dt>
          <dd className="mt-1">{formatDateTime(selectedItem.start)}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">End</dt>
          <dd className="mt-1">{formatDateTime(selectedItem.end)}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Type</dt>
          <dd className="mt-1 capitalize">{selectedItem.type || 'internal'}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Visibility</dt>
          <dd className="mt-1 capitalize">{selectedItem.visibility || 'internal'}</dd>
        </div>
      </dl>
      {selectedItem.description ? (
        <p className="mt-3 text-sm text-slate-600">{selectedItem.description}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {canManageEvents ? (
          <Button size="sm" onClick={() => actions.editEvent(selectedItem)}>
            Edit event
          </Button>
        ) : null}
        {canManageEvents ? (
          <Button size="sm" variant="secondary" onClick={() => actions.deleteEvent(selectedItem)}>
            Delete
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" onClick={() => actions.clearSelection()}>
          Close
        </Button>
      </div>
      {!canManageEvents ? (
        <p className="mt-3 text-xs text-slate-500">You have view-only access to calendar events.</p>
      ) : null}
    </div>
  );
};

export default BookingInspector;
