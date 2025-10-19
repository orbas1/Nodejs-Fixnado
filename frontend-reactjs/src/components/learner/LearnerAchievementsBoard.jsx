import PropTypes from 'prop-types';
import { StarIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';

export default function LearnerAchievementsBoard({ achievements, summary, onPinToggle, t, format }) {
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {t('learner.achievements.summaryEyebrow')}
          </p>
          <h1 className="text-2xl font-semibold text-primary">
            {t('learner.achievements.summaryTitle', { points: format.number(summary.totalPoints ?? 0) })}
          </h1>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-600">
          {t('learner.achievements.badgeCount', { count: summary.badgeCount ?? achievements.length })}
        </div>
      </header>

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {achievements.map((achievement) => {
          const pinned = Boolean(achievement.pinned);
          return (
            <li
              key={achievement.id}
              className={clsx(
                'relative overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                pinned && 'border-primary/40 shadow-glow'
              )}
            >
              <button
                type="button"
                onClick={() => onPinToggle(achievement, !pinned)}
                className={clsx(
                  'absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition',
                  pinned
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40'
                )}
              >
                <StarIcon className={clsx('h-4 w-4', pinned ? 'text-primary' : 'text-slate-400')} aria-hidden="true" />
                {pinned ? t('learner.achievements.pinned') : t('learner.achievements.pinCta')}
              </button>
              <h2 className="text-lg font-semibold text-primary">{achievement.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{achievement.description}</p>
              <dl className="mt-4 text-xs text-slate-500">
                <div>
                  <dt>{t('learner.achievements.awardedAtLabel')}</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-700">
                    {achievement.awardedAt ? format.date(achievement.awardedAt) : t('common.notAvailable')}
                  </dd>
                </div>
                <div className="mt-3">
                  <dt>{t('learner.achievements.pointsLabel')}</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-700">
                    {format.number(achievement.points ?? 0)}
                  </dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

LearnerAchievementsBoard.propTypes = {
  achievements: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      awardedAt: PropTypes.string,
      points: PropTypes.number,
      pinned: PropTypes.bool
    })
  ).isRequired,
  summary: PropTypes.shape({
    totalPoints: PropTypes.number,
    badgeCount: PropTypes.number
  }).isRequired,
  onPinToggle: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  format: PropTypes.shape({
    number: PropTypes.func.isRequired,
    date: PropTypes.func.isRequired
  }).isRequired
};
