import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchLearnerAchievements,
  toggleAchievementPin,
  recordLearnerTelemetry
} from '../../api/learnerClient.js';
import LearnerAchievementsBoard from '../../components/learner/LearnerAchievementsBoard.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useSession } from '../../hooks/useSession.js';

export default function LearnerAchievements() {
  const { format, t } = useLocale();
  const { activePersona } = useSession();
  const [state, setState] = useState({ loading: true, error: null, achievements: [], summary: { totalPoints: 0, badgeCount: 0 } });

  const controllerRef = useMemo(() => ({ current: null }), []);

  const abortActive = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, [controllerRef]);

  const loadAchievements = useCallback(async () => {
    abortActive();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const { achievements, summary } = await fetchLearnerAchievements({ signal: controller.signal });
      setState({ loading: false, error: null, achievements, summary });
      recordLearnerTelemetry('learner.achievements.viewed', {
        persona: activePersona,
        achievements: achievements.length
      }).catch((error) => console.warn('Failed to record achievements telemetry', error));
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      console.error('Failed to load achievements', error);
      setState((current) => ({ ...current, loading: false, error: error.message }));
    }
  }, [abortActive, activePersona, controllerRef]);

  useEffect(() => {
    loadAchievements();
    return () => abortActive();
  }, [loadAchievements, abortActive]);

  const handlePinToggle = useCallback(
    async (achievement, nextPinned) => {
      try {
        await toggleAchievementPin(achievement.id, nextPinned);
        recordLearnerTelemetry('learner.achievements.pin-toggled', {
          persona: activePersona,
          achievementId: achievement.id,
          pinned: nextPinned
        }).catch((error) => console.warn('Failed to record achievement pin telemetry', error));
        setState((current) => ({
          ...current,
          achievements: current.achievements.map((entry) =>
            entry.id === achievement.id ? { ...entry, pinned: nextPinned } : entry
          )
        }));
      } catch (error) {
        console.error('Failed to toggle achievement pin', error);
        setState((current) => ({ ...current, error: error.message }));
      }
    },
    [activePersona]
  );

  const { achievements, summary, loading, error } = state;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-secondary/25 to-white">
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">{t('learner.achievements.eyebrow')}</p>
          <h1 className="text-3xl font-semibold text-primary">{t('learner.achievements.title')}</h1>
        </header>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-700">{error}</div>
        ) : null}

        {loading ? <Skeleton lines={6} /> : null}

        {!loading ? (
          <LearnerAchievementsBoard
            achievements={achievements}
            summary={summary}
            onPinToggle={handlePinToggle}
            t={t}
            format={format}
          />
        ) : null}
      </div>
    </div>
  );
}
