import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  fetchLearnerCalendar,
  updateSessionStatus,
  submitSessionReflection,
  recordLearnerTelemetry
} from '../../api/learnerClient.js';
import LearnerCalendarBoard from '../../components/learner/LearnerCalendarBoard.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useSession } from '../../hooks/useSession.js';

const RANGE_PRESETS = {
  week: 7,
  fortnight: 14,
  month: 30
};

import PropTypes from 'prop-types';

function ReflectionDialog({ session, onClose, onSubmit, submitting, t, format }) {
  const [summary, setSummary] = useState('');
  const [sentiment, setSentiment] = useState('positive');
  const [blockerText, setBlockerText] = useState('');

  useEffect(() => {
    if (session) {
      setSummary('');
      setSentiment('positive');
      setBlockerText('');
    }
  }, [session]);

  if (!session) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    const blockers = blockerText
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    onSubmit({ summary, sentiment, blockers });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              {t('learner.calendar.reflectionEyebrow')}
            </p>
            <h1 className="text-2xl font-semibold text-primary">{session.title}</h1>
            <p className="text-xs text-slate-500">
              {session.startsAt
                ? t('learner.calendar.reflectionMeta', { value: format.dateTime(session.startsAt) })
                : null}
            </p>
          </header>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="reflection-summary">
              {t('learner.calendar.reflectionSummaryLabel')}
            </label>
            <textarea
              id="reflection-summary"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              rows={4}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder={t('learner.calendar.reflectionSummaryPlaceholder')}
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="reflection-sentiment">
              {t('learner.calendar.reflectionSentimentLabel')}
            </label>
            <select
              id="reflection-sentiment"
              value={sentiment}
              onChange={(event) => setSentiment(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="positive">{t('learner.calendar.reflectionSentimentPositive')}</option>
              <option value="neutral">{t('learner.calendar.reflectionSentimentNeutral')}</option>
              <option value="negative">{t('learner.calendar.reflectionSentimentNegative')}</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="reflection-blockers">
              {t('learner.calendar.reflectionBlockersLabel')}
            </label>
            <input
              id="reflection-blockers"
              type="text"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={blockerText}
              onChange={(event) => setBlockerText(event.target.value)}
              placeholder={t('learner.calendar.reflectionBlockersPlaceholder')}
            />
            <p className="mt-1 text-xs text-slate-500">
              {t('learner.calendar.reflectionBlockersHint')}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-primary/40"
              onClick={onClose}
            >
              {t('learner.calendar.reflectionCancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
            >
              {submitting ? t('learner.calendar.reflectionSaving') : t('learner.calendar.reflectionSaveCta')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

ReflectionDialog.propTypes = {
  session: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    startsAt: PropTypes.string
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  t: PropTypes.func.isRequired,
  format: PropTypes.shape({
    dateTime: PropTypes.func.isRequired
  }).isRequired
};

ReflectionDialog.defaultProps = {
  session: null,
  submitting: false
};

export default function LearnerCalendar() {
  const { format, t } = useLocale();
  const { activePersona } = useSession();
  const [params, setParams] = useSearchParams();

  const [state, setState] = useState({
    loading: true,
    error: null,
    calendar: null,
    submitting: false,
    reflectionSession: null
  });

  const [range, setRange] = useState(params.get('range') || 'fortnight');

  const controllerRef = useMemo(() => ({ current: null }), []);

  const abortActive = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, [controllerRef]);

  const loadCalendar = useCallback(
    async ({ silent = false, rangeOverride } = {}) => {
      abortActive();
      const controller = new AbortController();
      controllerRef.current = controller;
      if (!silent) {
        setState((current) => ({ ...current, loading: true, error: null }));
      }
      const effectiveRange = rangeOverride ?? range;
      const days = RANGE_PRESETS[effectiveRange] ?? 14;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + days);
      try {
        let timezone = 'UTC';
        try {
          timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        } catch (tzError) {
          console.warn('Failed to resolve learner timezone for calendar', tzError);
        }
        const calendar = await fetchLearnerCalendar({ startDate, endDate, timezone }, { signal: controller.signal });
        setState((current) => ({ ...current, calendar, loading: false, error: null }));
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.error('Failed to load learner calendar', error);
        setState((current) => ({ ...current, loading: false, error: error.message }));
      }
    },
    [abortActive, controllerRef, range]
  );

  useEffect(() => {
    loadCalendar({ silent: false });
    return () => abortActive();
  }, [loadCalendar, abortActive]);

  const handleRangeChange = useCallback(
    (nextRange) => {
      setRange(nextRange);
      setParams((current) => {
        const clone = new URLSearchParams(current.toString());
        clone.set('range', nextRange);
        return clone;
      });
      loadCalendar({ silent: false, rangeOverride: nextRange });
    },
    [loadCalendar, setParams]
  );

  const handleStatusChange = useCallback(
    async (session, status) => {
      try {
        await updateSessionStatus(session.id, status);
        recordLearnerTelemetry('learner.calendar.status-updated', {
          persona: activePersona,
          sessionId: session.id,
          status
        }).catch((error) => console.warn('Failed to record session status telemetry', error));
        setState((current) => ({
          ...current,
          calendar: {
            ...current.calendar,
            sessions: current.calendar.sessions.map((entry) =>
              entry.id === session.id ? { ...entry, status } : entry
            )
          }
        }));
      } catch (error) {
        console.error('Failed to update session status', error);
        setState((current) => ({ ...current, error: error.message }));
      }
    },
    [activePersona]
  );

  const handleReflectionRequest = useCallback((session) => {
    setState((current) => ({ ...current, reflectionSession: session }));
  }, []);

  const handleReflectionSubmit = useCallback(
    async (reflection) => {
      if (!state.reflectionSession) {
        return;
      }
      setState((current) => ({ ...current, submitting: true }));
      try {
        await submitSessionReflection(state.reflectionSession.id, reflection);
        recordLearnerTelemetry('learner.calendar.reflection-submitted', {
          persona: activePersona,
          sessionId: state.reflectionSession.id,
          sentiment: reflection.sentiment
        }).catch((error) => console.warn('Failed to record reflection telemetry', error));
        setState((current) => ({
          ...current,
          submitting: false,
          reflectionSession: null,
          calendar: {
            ...current.calendar,
            sessions: current.calendar.sessions.map((entry) =>
              entry.id === state.reflectionSession.id
                ? { ...entry, reflectionSubmittedAt: new Date().toISOString(), status: 'completed' }
                : entry
            )
          }
        }));
      } catch (error) {
        console.error('Failed to submit reflection', error);
        setState((current) => ({ ...current, submitting: false, error: error.message }));
      }
    },
    [activePersona, state.reflectionSession]
  );

  const { calendar, loading, error, reflectionSession, submitting } = state;

  const rangeOptions = useMemo(
    () => [
      { id: 'week', label: t('learner.calendar.range.week') },
      { id: 'fortnight', label: t('learner.calendar.range.fortnight') },
      { id: 'month', label: t('learner.calendar.range.month') }
    ],
    [t]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-secondary/20 to-white">
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-accent">
              {t('learner.calendar.eyebrow')}
            </p>
            <h1 className="text-3xl font-semibold text-primary">{t('learner.calendar.title')}</h1>
            <p className="mt-1 text-xs text-slate-500">
              {calendar ? t('learner.calendar.timezoneLabel', { zone: calendar.timezone }) : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {rangeOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleRangeChange(option.id)}
                className={`rounded-full px-4 py-1 text-xs font-semibold transition ${
                  range === option.id
                    ? 'bg-primary text-white shadow'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-primary/40'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loading && !calendar ? (
          <Skeleton lines={6} />
        ) : null}

        {calendar ? (
          <LearnerCalendarBoard
            sessions={calendar.sessions}
            format={format}
            onStatusChange={handleStatusChange}
            onReflect={handleReflectionRequest}
            t={t}
          />
        ) : null}
      </div>

      <ReflectionDialog
        session={reflectionSession}
        onClose={() => setState((current) => ({ ...current, reflectionSession: null }))}
        onSubmit={handleReflectionSubmit}
        submitting={submitting}
        t={t}
        format={format}
      />

      {loading && calendar ? (
        <div className="fixed bottom-6 right-6 rounded-full border border-primary/40 bg-white px-4 py-2 text-xs font-semibold text-primary shadow-lg">
          <div className="flex items-center gap-2">
            <Spinner size="1rem" />
            {t('learner.calendar.refreshing')}
          </div>
        </div>
      ) : null}
    </div>
  );
}
