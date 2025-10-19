import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchLearnerPreferences,
  updateLearnerPreferences,
  recordLearnerTelemetry
} from '../../api/learnerClient.js';
import LearnerGoalForm from '../../components/learner/LearnerGoalForm.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useSession } from '../../hooks/useSession.js';

export default function LearnerSettings() {
  const { format, t } = useLocale();
  const { activePersona } = useSession();
  const [state, setState] = useState({ loading: true, error: null, preferences: null, saving: false, history: [] });
  const controllerRef = useMemo(() => ({ current: null }), []);

  const abortActive = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, [controllerRef]);

  const loadPreferences = useCallback(async () => {
    abortActive();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const preferences = await fetchLearnerPreferences({ signal: controller.signal });
      const historyEntry = {
        timestamp: preferences.updatedAt || new Date().toISOString(),
        weeklyTargetHours: preferences.weeklyTargetHours,
        aiCoachEnabled: preferences.aiCoachEnabled,
        zoneLock: preferences.zoneLock
      };
      setState({ loading: false, error: null, preferences, saving: false, history: [historyEntry] });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      console.error('Failed to load learner preferences', error);
      setState((current) => ({ ...current, loading: false, error: error.message }));
    }
  }, [abortActive, controllerRef]);

  useEffect(() => {
    loadPreferences();
    return () => abortActive();
  }, [loadPreferences, abortActive]);

  const handleSubmit = useCallback(
    async (preferences) => {
      setState((current) => ({ ...current, saving: true, error: null }));
      try {
        await updateLearnerPreferences(preferences);
        recordLearnerTelemetry('learner.settings.updated', {
          persona: activePersona,
          weeklyTargetHours: preferences.weeklyTargetHours,
          aiCoachEnabled: preferences.aiCoachEnabled,
          reminderDays: preferences.reminderDays
        }).catch((error) => console.warn('Failed to record settings telemetry', error));
        setState((current) => ({
          ...current,
          saving: false,
          preferences: { ...current.preferences, ...preferences },
          history: [
            {
              timestamp: new Date().toISOString(),
              weeklyTargetHours: preferences.weeklyTargetHours,
              aiCoachEnabled: preferences.aiCoachEnabled,
              zoneLock: preferences.zoneLock
            },
            ...current.history
          ].slice(0, 5)
        }));
      } catch (error) {
        console.error('Failed to update learner settings', error);
        setState((current) => ({ ...current, saving: false, error: error.message }));
      }
    },
    [activePersona]
  );

  const { preferences, loading, error, saving, history } = state;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-secondary/25 to-white">
      <div className="mx-auto max-w-4xl px-6 py-16 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">{t('learner.settings.eyebrow')}</p>
          <h1 className="text-3xl font-semibold text-primary">{t('learner.settings.title')}</h1>
          <p className="text-sm text-primary/70">{t('learner.settings.description')}</p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-700">{error}</div>
        ) : null}

        {loading ? <Skeleton lines={6} /> : null}

        {preferences ? (
          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <LearnerGoalForm preferences={preferences} onSubmit={handleSubmit} loading={saving} t={t} />
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <header className="space-y-1">
                <h2 className="text-lg font-semibold text-primary">{t('learner.settings.auditTitle')}</h2>
                <p className="text-xs text-slate-500">{t('learner.settings.auditDescription')}</p>
              </header>
              <ul className="mt-4 space-y-3 text-xs text-slate-600">
                {history.map((entry) => (
                  <li
                    key={entry.timestamp}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-700">{format.dateTime(entry.timestamp)}</p>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                        {t('learner.settings.auditRow', {
                          hours: entry.weeklyTargetHours,
                          aiCoach: entry.aiCoachEnabled ? t('common.onTrack') : t('common.actionRequired'),
                          zone: entry.zoneLock ? t('learner.settings.zoneLocked') : t('learner.settings.zoneFlexible')
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
