import PropTypes from 'prop-types';
import clsx from 'clsx';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const STATUS_TONE = {
  scheduled: 'bg-slate-100 text-slate-600',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-primary/10 text-primary',
  missed: 'bg-rose-100 text-rose-600'
};

function groupByDate(sessions) {
  const map = new Map();
  sessions.forEach((session) => {
    const key = session.startsAt ? session.startsAt.slice(0, 10) : 'unscheduled';
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(session);
  });
  return Array.from(map.entries())
    .map(([date, daySessions]) => ({ date, sessions: daySessions.sort((a, b) => a.startsAt.localeCompare(b.startsAt)) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export default function LearnerCalendarBoard({ sessions, format, onStatusChange, onReflect, t }) {
  const [params] = useSearchParams();
  const focusSessionId = params.get('session');

  const grouped = useMemo(() => groupByDate(sessions), [sessions]);

  if (grouped.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-12 text-center">
        <p className="text-sm font-semibold text-primary">{t('learner.calendar.emptyTitle')}</p>
        <p className="mt-2 text-xs text-slate-500">{t('learner.calendar.emptyDescription')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map((day) => (
        <section key={day.date} className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {format.date(day.date)}
              </p>
              <h3 className="text-lg font-semibold text-primary">
                {t('learner.calendar.sessionCount', { count: day.sessions.length })}
              </h3>
            </div>
          </header>
          <ul className="mt-6 space-y-4">
            {day.sessions.map((session) => {
              const tone = STATUS_TONE[session.status] ?? STATUS_TONE.scheduled;
              const isFocused = focusSessionId && focusSessionId === session.moduleId;
              const isCompleted = session.status === 'completed';
              const nextStatus = session.status === 'confirmed' ? 'completed' : 'confirmed';
              return (
                <li
                  key={session.id}
                  className={clsx(
                    'flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between',
                    isFocused && 'ring-2 ring-primary'
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold text-primary">{session.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {session.startsAt ? format.dateTime(session.startsAt) : t('learner.calendar.sessionTimeTbd')}
                    </p>
                    {session.facilitator ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {t('learner.calendar.facilitator', { name: session.facilitator })}
                      </p>
                    ) : null}
                    {session.location ? (
                      <p className="mt-1 text-xs text-slate-500">{session.location}</p>
                    ) : null}
                    {session.preparation?.length ? (
                      <ul className="mt-2 space-y-1 text-xs text-slate-500">
                        {session.preparation.map((item) => (
                          <li key={item.id}>
                            <span className={item.completed ? 'text-emerald-600' : 'text-slate-500'}>•</span>{' '}
                            {item.label}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-stretch gap-2 md:w-48">
                    <span className={`inline-flex justify-center rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
                      {t(`learner.calendar.status.${session.status}`)}
                    </span>
                    <button
                      type="button"
                      disabled={isCompleted}
                      onClick={() => {
                        if (!isCompleted) {
                          onStatusChange(session, nextStatus);
                        }
                      }}
                      className="rounded-full border border-primary/40 bg-white px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
                    >
                      {isCompleted
                        ? t('learner.calendar.markReviewed')
                        : t('learner.calendar.markComplete')}
                    </button>
                    {session.status === 'completed' ? (
                      <button
                        type="button"
                        onClick={() => onReflect(session)}
                        className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white transition hover:bg-primary/90"
                      >
                        {session.reflectionSubmittedAt
                          ? t('learner.calendar.reviewReflection')
                          : t('learner.calendar.captureReflection')}
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

LearnerCalendarBoard.propTypes = {
  sessions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      moduleId: PropTypes.string,
      title: PropTypes.string.isRequired,
      startsAt: PropTypes.string,
      facilitator: PropTypes.string,
      location: PropTypes.string,
      status: PropTypes.string,
      preparation: PropTypes.array
    })
  ).isRequired,
  format: PropTypes.shape({
    date: PropTypes.func.isRequired,
    dateTime: PropTypes.func.isRequired
  }).isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onReflect: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
};
