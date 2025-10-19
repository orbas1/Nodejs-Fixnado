import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchLearnerProfile,
  updateLearnerProfile,
  recordLearnerTelemetry
} from '../../api/learnerClient.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useSession } from '../../hooks/useSession.js';

function ZoneBadge({ timezone, t }) {
  const [localTime, setLocalTime] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setLocalTime(new Date()), 60 * 1000);
    return () => window.clearInterval(id);
  }, []);
  const formatter = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, { timeZone: timezone, timeStyle: 'short', dateStyle: 'medium' });
    } catch (error) {
      console.warn('Failed to instantiate timezone formatter', error);
      return null;
    }
  }, [timezone]);
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-xs text-primary">
      <p className="font-semibold">{t('learner.profile.zoneBadgeTitle', { zone: timezone })}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.2em]">
        {formatter ? formatter.format(localTime) : t('learner.profile.zoneBadgeFallback')}
      </p>
    </div>
  );
}

export default function LearnerProfile() {
  const { t } = useLocale();
  const { activePersona } = useSession();
  const [state, setState] = useState({
    loading: true,
    error: null,
    profile: null,
    saving: false,
    success: false
  });

  const controllerRef = useMemo(() => ({ current: null }), []);

  const abortActive = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, [controllerRef]);

  const loadProfile = useCallback(async () => {
    abortActive();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState((current) => ({ ...current, loading: true, error: null, success: false }));
    try {
      const profile = await fetchLearnerProfile({ signal: controller.signal });
      setState((current) => ({ ...current, loading: false, profile }));
      recordLearnerTelemetry('learner.profile.viewed', { persona: activePersona }).catch((error) =>
        console.warn('Failed to record profile telemetry', error)
      );
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      console.error('Failed to load learner profile', error);
      setState((current) => ({ ...current, loading: false, error: error.message }));
    }
  }, [abortActive, activePersona, controllerRef]);

  useEffect(() => {
    loadProfile();
    return () => abortActive();
  }, [loadProfile, abortActive]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!state.profile) {
        return;
      }
      const formData = new FormData(event.currentTarget);
      const nextProfile = {
        name: formData.get('name'),
        title: formData.get('title'),
        timezone: formData.get('timezone'),
        location: formData.get('location'),
        bio: formData.get('bio'),
        focusAreas: formData.get('focusAreas')
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean),
        languages: formData.get('languages')
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean)
      };
      setState((current) => ({ ...current, saving: true, success: false }));
      try {
        await updateLearnerProfile(nextProfile);
        recordLearnerTelemetry('learner.profile.updated', {
          persona: activePersona,
          timezone: nextProfile.timezone
        }).catch((error) => console.warn('Failed to record profile update telemetry', error));
        setState((current) => ({
          ...current,
          profile: { ...current.profile, ...nextProfile },
          saving: false,
          success: true
        }));
      } catch (error) {
        console.error('Failed to update learner profile', error);
        setState((current) => ({ ...current, saving: false, error: error.message }));
      }
    },
    [activePersona, state.profile]
  );

  const { profile, loading, error, saving, success } = state;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-secondary/20 to-white">
      <div className="mx-auto max-w-4xl px-6 py-16 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">{t('learner.profile.eyebrow')}</p>
          <h1 className="text-3xl font-semibold text-primary">{t('learner.profile.title')}</h1>
          <p className="text-sm text-primary/70">{t('learner.profile.description')}</p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-700">{error}</div>
        ) : null}

        {loading ? <Skeleton lines={6} /> : null}

        {profile ? (
          <form onSubmit={handleSubmit} className="space-y-6" data-qa="learner-profile-form">
            {success ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3 text-xs text-emerald-700">
                {t('learner.profile.successMessage')}
              </div>
            ) : null}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="name">
                  {t('learner.profile.nameLabel')}
                </label>
                <input
                  id="name"
                  name="name"
                  defaultValue={profile.name}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="title">
                  {t('learner.profile.titleLabel')}
                </label>
                <input
                  id="title"
                  name="title"
                  defaultValue={profile.title}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="timezone">
                  {t('learner.profile.timezoneLabel')}
                </label>
                <input
                  id="timezone"
                  name="timezone"
                  defaultValue={profile.timezone}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="location">
                  {t('learner.profile.locationLabel')}
                </label>
                <input
                  id="location"
                  name="location"
                  defaultValue={profile.location}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="bio">
                {t('learner.profile.bioLabel')}
              </label>
              <textarea
                id="bio"
                name="bio"
                defaultValue={profile.bio}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={4}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="focusAreas">
                  {t('learner.profile.focusAreasLabel')}
                </label>
                <input
                  id="focusAreas"
                  name="focusAreas"
                  defaultValue={profile.focusAreas.join(', ')}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Sustainability audits, Safety walkthroughs"
                />
                <p className="mt-1 text-xs text-slate-500">{t('learner.profile.focusAreasHint')}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="languages">
                  {t('learner.profile.languagesLabel')}
                </label>
                <input
                  id="languages"
                  name="languages"
                  defaultValue={profile.languages.join(', ')}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="English, Spanish"
                />
                <p className="mt-1 text-xs text-slate-500">{t('learner.profile.languagesHint')}</p>
              </div>
            </div>

            <ZoneBadge timezone={profile.timezone} t={t} />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-primary/40"
                onClick={loadProfile}
              >
                {t('learner.profile.resetCta')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
              >
                {saving ? <Spinner size="1rem" aria-label={t('common.loading')} /> : t('learner.profile.saveCta')}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
