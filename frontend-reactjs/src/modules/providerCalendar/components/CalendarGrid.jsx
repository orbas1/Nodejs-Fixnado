import { useMemo } from 'react';
import clsx from 'clsx';
import { useProviderCalendar } from '../ProviderCalendarProvider.jsx';

const badgeClasses = {
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-600',
  risk: 'border-rose-200 bg-rose-50 text-rose-700',
  standby: 'border-primary/30 bg-primary/5 text-primary/80',
  travel: 'border-sky-200 bg-sky-50 text-sky-700'
};

const CalendarGrid = () => {
  const { calendar, bookings, events, actions, permissions } = useProviderCalendar();
  const canManageEvents = permissions?.canManageEvents !== false;

  const eventLookup = useMemo(() => {
    const map = new Map();
    bookings.forEach((booking) => map.set(`booking-${booking.id}`, { ...booking, kind: 'booking' }));
    events.forEach((event) => map.set(`event-${event.id}`, { ...event, kind: 'event' }));
    return map;
  }, [bookings, events]);

  const handleEventClick = (entry) => {
    const target = eventLookup.get(entry.id);
    if (target) {
      actions.selectItem(target);
    }
  };

  const handleDayDoubleClick = (day) => {
    if (!canManageEvents) {
      return;
    }
    const iso = day?.iso || calendar.rangeStart || new Date().toISOString();
    actions.openCreateEvent({ start: iso, end: '', date: iso });
  };

  return (
    <div className="rounded-3xl border border-accent/10 bg-white/90 p-4 shadow-sm">
      <div className="grid grid-cols-7 gap-2 text-xs font-semibold uppercase tracking-wide text-primary/60">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="px-2 py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-2 text-sm">
        {calendar.weeks?.flatMap((week, weekIndex) =>
          week.map((day, dayIndex) => (
            <div
              key={`${weekIndex}-${day.date}-${dayIndex}`}
              className={clsx(
                'min-h-[140px] rounded-2xl border border-dashed p-3 transition',
                day.isCurrentMonth ? 'border-accent/20 bg-secondary/60' : 'border-transparent bg-secondary/30 text-slate-400',
                day.isToday ? 'border-accent bg-accent/10' : ''
              )}
              onDoubleClick={() => handleDayDoubleClick(day)}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>{day.date}</span>
              </div>
              <div className="mt-3 space-y-2">
                {day.events?.map((entry) => (
                  <button
                    type="button"
                    key={entry.id}
                    onClick={() => handleEventClick(entry)}
                    className={clsx(
                      'w-full rounded-xl border px-3 py-2 text-left text-xs font-medium transition hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40',
                      badgeClasses[entry.status] || 'border-slate-200 bg-white text-primary'
                    )}
                  >
                    <p className="text-primary">{entry.title}</p>
                    <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-primary/70">{entry.time}</p>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CalendarGrid;
