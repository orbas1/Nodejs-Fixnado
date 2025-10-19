import PropTypes from 'prop-types';
import clsx from 'clsx';
import { useMemo } from 'react';

const IMPACT_TONE = {
  high: 'border-emerald-300 bg-emerald-50/90 text-emerald-700',
  medium: 'border-primary/30 bg-primary/10 text-primary',
  low: 'border-slate-200 bg-white text-slate-600'
};

export default function LearnerRecommendationList({ recommendations, onAcknowledge, onFeedback, t, format }) {
  const sorted = useMemo(() => {
    return [...recommendations].sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      return (impactOrder[a.impact] ?? 1) - (impactOrder[b.impact] ?? 1);
    });
  }, [recommendations]);

  if (!sorted.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-12 text-center">
        <p className="text-sm font-semibold text-primary">{t('learner.recommendations.emptyTitle')}</p>
        <p className="mt-2 text-xs text-slate-500">{t('learner.recommendations.emptyDescription')}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {sorted.map((recommendation) => (
        <li
          key={recommendation.id}
          className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm"
          data-qa={`learner-recommendation-${recommendation.id}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">{recommendation.title}</p>
              <p className="mt-1 text-xs text-slate-500">{recommendation.description}</p>
            </div>
            <span className={clsx('rounded-full px-3 py-1 text-xs font-semibold', IMPACT_TONE[recommendation.impact])}>
              {t(`learner.recommendations.impact.${recommendation.impact}`)}
            </span>
          </div>
          <dl className="mt-4 grid gap-4 text-xs text-slate-500 sm:grid-cols-3">
            <div>
              <dt>{t('learner.recommendations.effortLabel')}</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-700">
                {recommendation.effortHours
                  ? t('learner.recommendations.effortHours', { value: format.number(recommendation.effortHours) })
                  : t('learner.recommendations.effortUnknown')}
              </dd>
            </div>
            <div>
              <dt>{t('learner.recommendations.confidenceLabel')}</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-700">
                {recommendation.confidence != null
                  ? format.percentage(recommendation.confidence, { maximumFractionDigits: 0 })
                  : t('common.notAvailable')}
              </dd>
            </div>
            <div>
              <dt>{t('learner.recommendations.sourceLabel')}</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-700">
                {recommendation.source || t('learner.recommendations.sourceUnknown')}
              </dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onAcknowledge(recommendation, 'accepted')}
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-primary/90"
            >
              {t('learner.recommendations.acceptCta')}
            </button>
            <button
              type="button"
              onClick={() => onAcknowledge(recommendation, 'snoozed')}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary/40"
            >
              {t('learner.recommendations.snoozeCta')}
            </button>
            <button
              type="button"
              onClick={() => onFeedback(recommendation)}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary/40"
            >
              {t('learner.recommendations.feedbackCta')}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

LearnerRecommendationList.propTypes = {
  recommendations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      impact: PropTypes.string,
      effortHours: PropTypes.number,
      confidence: PropTypes.number,
      source: PropTypes.string
    })
  ).isRequired,
  onAcknowledge: PropTypes.func.isRequired,
  onFeedback: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  format: PropTypes.shape({
    number: PropTypes.func.isRequired,
    percentage: PropTypes.func.isRequired
  }).isRequired
};
