import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  acknowledgeRecommendation,
  fetchLearnerRecommendations,
  submitRecommendationFeedback,
  recordLearnerTelemetry
} from '../../api/learnerClient.js';
import LearnerRecommendationList from '../../components/learner/LearnerRecommendationList.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useSession } from '../../hooks/useSession.js';

export default function LearnerRecommendations() {
  const { format, t } = useLocale();
  const { activePersona } = useSession();
  const [state, setState] = useState({ loading: true, error: null, recommendations: [], generatedAt: null });
  const controllerRef = useMemo(() => ({ current: null }), []);

  const abortActive = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, [controllerRef]);

  const loadRecommendations = useCallback(async () => {
    abortActive();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const { recommendations, generatedAt } = await fetchLearnerRecommendations({}, { signal: controller.signal });
      setState({ loading: false, error: null, recommendations, generatedAt });
      recordLearnerTelemetry('learner.recommendations.viewed', {
        persona: activePersona,
        count: recommendations.length
      }).catch((error) => console.warn('Failed to record recommendations telemetry', error));
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      console.error('Failed to load recommendations', error);
      setState((current) => ({ ...current, loading: false, error: error.message }));
    }
  }, [abortActive, activePersona, controllerRef]);

  useEffect(() => {
    loadRecommendations();
    return () => abortActive();
  }, [loadRecommendations, abortActive]);

  const handleAcknowledge = useCallback(
    async (recommendation, action) => {
      try {
        await acknowledgeRecommendation(recommendation.id, action);
        recordLearnerTelemetry('learner.recommendations.acknowledged', {
          persona: activePersona,
          recommendationId: recommendation.id,
          action
        }).catch((error) => console.warn('Failed to record recommendation acknowledge telemetry', error));
        setState((current) => ({
          ...current,
          recommendations: current.recommendations.filter((entry) => entry.id !== recommendation.id)
        }));
      } catch (error) {
        console.error('Failed to acknowledge recommendation', error);
        setState((current) => ({ ...current, error: error.message }));
      }
    },
    [activePersona]
  );

  const handleFeedback = useCallback(
    async (recommendation) => {
      const ratingInput = window.prompt(t('learner.recommendations.feedbackPromptRating'));
      if (!ratingInput) {
        return;
      }
      const rating = Number(ratingInput);
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        window.alert(t('learner.recommendations.feedbackRatingInvalid'));
        return;
      }
      const comment = window.prompt(t('learner.recommendations.feedbackPromptComment')) || '';
      try {
        await submitRecommendationFeedback(recommendation.id, { rating, comment });
        recordLearnerTelemetry('learner.recommendations.feedback-submitted', {
          persona: activePersona,
          recommendationId: recommendation.id,
          rating
        }).catch((error) => console.warn('Failed to record recommendation feedback telemetry', error));
      } catch (error) {
        console.error('Failed to submit recommendation feedback', error);
        setState((current) => ({ ...current, error: error.message }));
      }
    },
    [activePersona, t]
  );

  const { recommendations, loading, error, generatedAt } = state;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-secondary/30 to-white">
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">{t('learner.recommendations.eyebrow')}</p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-3xl font-semibold text-primary">{t('learner.recommendations.title')}</h1>
            {generatedAt ? (
              <p className="text-xs text-slate-500">
                {t('common.updatedOn', { value: format.dateTime(generatedAt) })}
              </p>
            ) : null}
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-700">{error}</div>
        ) : null}

        {loading ? <Skeleton lines={6} /> : null}

        {!loading ? (
          <LearnerRecommendationList
            recommendations={recommendations}
            onAcknowledge={handleAcknowledge}
            onFeedback={handleFeedback}
            t={t}
            format={format}
          />
        ) : null}
      </div>
    </div>
  );
}
