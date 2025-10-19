import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import {
  fetchLearnerOverview,
  fetchLearnerPreferences,
  updateLearnerPreferences,
  recordLearnerTelemetry
} from '../../api/learnerClient.js';
import Spinner from '../../components/ui/Spinner.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import LearnerProgressSummary from '../../components/learner/LearnerProgressSummary.jsx';
import LearnerModuleList from '../../components/learner/LearnerModuleList.jsx';
import LearnerSkillHealth from '../../components/learner/LearnerSkillHealth.jsx';
import LearnerAlertPanel from '../../components/learner/LearnerAlertPanel.jsx';
import LearnerGoalForm from '../../components/learner/LearnerGoalForm.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useSession } from '../../hooks/useSession.js';

const REFRESH_INTERVAL = 3 * 60 * 1000;

export default function LearnerDashboard() {
  const { format, t } = useLocale();
  const { activePersona } = useSession();

  const [state, setState] = useState({
    loading: true,
    error: null,
    overview: null,
    preferences: null,
    saving: false,
    lastSyncedAt: null
  });

  const controllerRef = useMemo(() => ({ current: null }), []);

  const abortActive = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, [controllerRef]);

  const hydrate = useCallback(
    async ({ silent = false } = {}) => {
      abortActive();
      const controller = new AbortController();
      controllerRef.current = controller;
      if (!silent) {
        setState((current) => ({ ...current, loading: true, error: null }));
      }
      try {
        let timezone = 'UTC';
        try {
          timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        } catch (tzError) {
          console.warn('Failed to resolve learner timezone', tzError);
        }

        const [overview, preferences] = await Promise.all([
          fetchLearnerOverview({ timezone }, { signal: controller.signal }),
          fetchLearnerPreferences({ signal: controller.signal })
        ]);
        setState((current) => ({
          ...current,
          overview,
          preferences,
          loading: false,
          error: null,
          lastSyncedAt: new Date().toISOString()
        }));
        recordLearnerTelemetry('learner.dashboard.viewed', {
          persona: activePersona,
          modules: overview.modules.length,
          timezone: overview.learner.timezone
        }).catch((error) => console.warn('Failed to record learner dashboard telemetry', error));
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.error('Failed to load learner dashboard', error);
        setState((current) => ({ ...current, loading: false, error: error.message }));
      }
    },
    [abortActive, activePersona, controllerRef]
  );

  useEffect(() => {
    hydrate({ silent: false });
    const interval = window.setInterval(() => {
      hydrate({ silent: true });
    }, REFRESH_INTERVAL);
    return () => {
      window.clearInterval(interval);
      abortActive();
    };
  }, [hydrate, abortActive]);

  const handlePreferencesSubmit = useCallback(
    async (preferences) => {
      setState((current) => ({ ...current, saving: true }));
      try {
        await updateLearnerPreferences(preferences);
        recordLearnerTelemetry('learner.preferences.updated', {
          persona: activePersona,
          weeklyTargetHours: preferences.weeklyTargetHours,
          reminderDays: preferences.reminderDays,
          channels: preferences.notificationChannels
        }).catch((error) => console.warn('Failed to record learner preference telemetry', error));
        setState((current) => ({
          ...current,
          preferences: { ...current.preferences, ...preferences },
          saving: false
        }));
      } catch (error) {
        console.error('Failed to update learner preferences', error);
        setState((current) => ({ ...current, saving: false, error: error.message }));
      }
    },
    [activePersona]
  );

  const { overview, preferences, loading, error, saving, lastSyncedAt } = state;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-secondary/30 to-white">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-10">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-accent">
                {t('learner.overview.eyebrow')}
              </p>
              <h1 className="text-4xl font-semibold text-primary">
                {overview ? overview.learner.name : t('learner.overview.titleFallback')}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-primary/70">
                {overview ? overview.learner.programme || t('learner.overview.programmeFallback') : null}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white px-4 py-2 text-xs font-semibold text-primary transition hover:border-primary"
              onClick={() => hydrate({ silent: false })}
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
              {t('common.refresh')}
            </button>
          </div>
          {lastSyncedAt ? (
            <p className="text-xs text-slate-500">
              {t('common.updatedOn', { value: format.dateTime(lastSyncedAt) })}
            </p>
          ) : null}
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </header>

        {loading && !overview ? (
          <div className="space-y-6">
            <Skeleton lines={6} />
            <Skeleton lines={4} />
            <Skeleton lines={4} />
          </div>
        ) : null}

        {overview ? (
          <div className="space-y-10">
            <LearnerProgressSummary
              progress={overview.progress}
              activityTrend={overview.activityTrend}
              format={format}
              t={t}
            />

            <section className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-primary">
                    {t('learner.overview.modulesTitle')}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {t('learner.overview.modulesDescription')}
                  </p>
                  <div className="mt-4">
                    <LearnerModuleList modules={overview.modules} format={format} t={t} />
                  </div>
                </div>

                <LearnerSkillHealth skills={overview.skillHealth} format={format} t={t} />
              </div>

              <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-primary">
                    {t('learner.overview.goalsTitle')}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">{t('learner.overview.goalsDescription')}</p>
                  {preferences ? (
                    <LearnerGoalForm
                      preferences={preferences}
                      onSubmit={handlePreferencesSubmit}
                      loading={saving}
                      t={t}
                    />
                  ) : (
                    <div className="mt-6 flex justify-center">
                      <Spinner />
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-primary">
                    {t('learner.overview.alertsTitle')}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">{t('learner.overview.alertsDescription')}</p>
                  <div className="mt-4">
                    <LearnerAlertPanel alerts={overview.alerts} t={t} />
                  </div>
                </section>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
