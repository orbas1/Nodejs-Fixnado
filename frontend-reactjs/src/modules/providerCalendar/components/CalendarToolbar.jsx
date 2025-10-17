import Button from '../../../components/ui/Button.jsx';
import { useProviderCalendar } from '../ProviderCalendarProvider.jsx';

function formatMonthLabel(calendar) {
  if (calendar?.monthLabel) {
    return calendar.monthLabel;
  }
  if (calendar?.rangeStart) {
    const date = new Date(calendar.rangeStart);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
  }
  const now = new Date();
  return now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

const CalendarToolbar = () => {
  const { calendar, actions, loading, timezone, permissions } = useProviderCalendar();
  const monthLabel = formatMonthLabel(calendar);
  const canManageEvents = permissions?.canManageEvents !== false;
  const canManageBookings = permissions?.canManageBookings !== false;
  const canEditSettings = permissions?.canEditSettings !== false;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Operations calendar</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold text-primary">{monthLabel}</h2>
          <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary/70">
            {timezone}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => actions.refreshCalendar()} disabled={loading}>
          Refresh
        </Button>
        <div className="flex items-center rounded-full border border-accent/20 bg-white/80 shadow-sm">
          <button
            type="button"
            className="px-3 py-2 text-sm font-medium text-primary transition hover:text-primary/70"
            onClick={() => actions.navigate('prev')}
            disabled={loading}
          >
            Prev
          </button>
          <button
            type="button"
            className="border-x border-accent/20 px-3 py-2 text-sm font-medium text-primary transition hover:text-primary/70"
            onClick={() => actions.navigate('current')}
            disabled={loading}
          >
            Today
          </button>
          <button
            type="button"
            className="px-3 py-2 text-sm font-medium text-primary transition hover:text-primary/70"
            onClick={() => actions.navigate('next')}
            disabled={loading}
          >
            Next
          </button>
        </div>
        {canManageEvents ? (
          <Button size="sm" onClick={() => actions.openCreateEvent({})} variant="primary">
            Add event
          </Button>
        ) : null}
        {canManageBookings ? (
          <Button size="sm" variant="secondary" onClick={() => actions.openBookingEditor(null)}>
            New booking
          </Button>
        ) : null}
        {canEditSettings ? (
          <Button size="sm" variant="ghost" onClick={() => actions.openSettings()}>
            Settings
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default CalendarToolbar;
