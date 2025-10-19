import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { CalendarIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

function buildCalendarUrl(event) {
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', event.title);
  if (event.startAt) {
    const start = new Date(event.startAt).toISOString().replace(/[-:]|\.\d{3}/g, '');
    const end = event.endAt
      ? new Date(event.endAt).toISOString().replace(/[-:]|\.\d{3}/g, '')
      : start;
    url.searchParams.set('dates', `${start}/${end}`);
  }
  if (event.description) {
    url.searchParams.set('details', event.description);
  }
  if (event.location) {
    url.searchParams.set('location', event.location);
  }
  return url.toString();
}

function buildIcs(event) {
  const start = event.startAt ? new Date(event.startAt).toISOString().replace(/[-:]|\.\d{3}/g, '') : '';
  const end = event.endAt ? new Date(event.endAt).toISOString().replace(/[-:]|\.\d{3}/g, '') : start;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fixnado//Community Events//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id || `${Date.now()}@fixnado.com`}`,
    start ? `DTSTART:${start}` : null,
    end ? `DTEND:${end}` : null,
    `SUMMARY:${event.title}`,
    event.location ? `LOCATION:${event.location}` : null,
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : null,
    'END:VEVENT',
    'END:VCALENDAR'
  ]
    .filter(Boolean)
    .join('\n');
}

function downloadIcs(event) {
  const ics = buildIcs(event);
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]+/gi, '-') || 'fixnado-event'}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function EventCard({ event, isHighlighted }) {
  const joinUrl = useMemo(() => buildCalendarUrl(event), [event]);

  return (
    <article
      className={clsx(
        'rounded-3xl border border-slate-200 p-5 shadow-sm transition hover:shadow-lg',
        isHighlighted ? 'bg-white/95 ring-2 ring-primary/60' : 'bg-white/80'
      )}
    >
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{event.type}</p>
          <h3 className="text-lg font-semibold text-primary">{event.title}</h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {event.startAt ? (
            <span className="inline-flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" aria-hidden="true" />
              {new Date(event.startAt).toLocaleString()}
            </span>
          ) : null}
          {event.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPinIcon className="h-4 w-4" aria-hidden="true" />
              {event.location}
            </span>
          ) : null}
        </div>
      </header>
      {event.description ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{event.description}</p>
      ) : null}
      <footer className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {event.host ? (
          <span className="inline-flex items-center gap-1">
            <UsersIcon className="h-4 w-4" aria-hidden="true" />
            Hosted by {event.host}
          </span>
        ) : null}
        {event.attendeeCount ? (
          <span>{event.attendeeCount} registered</span>
        ) : null}
        <div className="ml-auto flex gap-2">
          <a
            href={joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary transition hover:bg-primary hover:text-white"
          >
            Add to Google Calendar
          </a>
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-primary hover:text-primary"
            onClick={() => downloadIcs(event)}
          >
            Download ICS
          </button>
        </div>
      </footer>
    </article>
  );
}

EventCard.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    type: PropTypes.string,
    startAt: PropTypes.string,
    endAt: PropTypes.string,
    location: PropTypes.string,
    host: PropTypes.string,
    attendeeCount: PropTypes.number
  }).isRequired,
  isHighlighted: PropTypes.bool
};

EventCard.defaultProps = {
  isHighlighted: false
};

export default function CommunityEventBoard({ events, highlightLimit }) {
  const highlighted = events.slice(0, highlightLimit);
  const remaining = events.slice(highlightLimit);

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">Upcoming events</h2>
        <span className="text-xs text-slate-500">Synced hourly from Fixnado Live Ops</span>
      </header>
      <div className="space-y-4">
        {highlighted.map((event) => (
          <EventCard key={event.id ?? event.title} event={event} isHighlighted />
        ))}
        {remaining.map((event) => (
          <EventCard key={event.id ?? event.title} event={event} />
        ))}
      </div>
    </section>
  );
}

CommunityEventBoard.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object),
  highlightLimit: PropTypes.number
};

CommunityEventBoard.defaultProps = {
  events: [],
  highlightLimit: 2
};
