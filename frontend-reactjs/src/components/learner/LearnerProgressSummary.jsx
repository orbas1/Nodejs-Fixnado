import PropTypes from 'prop-types';
import clsx from 'clsx';
import { ClockIcon, FireIcon, TrophyIcon } from '@heroicons/react/24/outline';
import StatusPill from '../ui/StatusPill.jsx';

function StatCard({ icon: Icon, eyebrow, label, value, caption, tone }) {
  return (
    <article
      className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm"
    >
      <header className="flex items-center gap-3">
        <span
          className={clsx(
            'flex h-11 w-11 items-center justify-center rounded-2xl',
            tone === 'warning'
              ? 'bg-amber-100 text-amber-600'
              : tone === 'success'
              ? 'bg-emerald-100 text-emerald-600'
              : 'bg-primary/10 text-primary'
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{eyebrow}</p>
          <p className="mt-1 text-xl font-semibold text-primary">{label}</p>
        </div>
      </header>
      <p className="mt-6 text-3xl font-semibold text-slate-900">{value}</p>
      {caption ? <p className="mt-4 text-xs text-slate-500">{caption}</p> : null}
    </article>
  );
}

StatCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  eyebrow: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  caption: PropTypes.node,
  tone: PropTypes.oneOf(['default', 'success', 'warning'])
};

StatCard.defaultProps = {
  caption: null,
  tone: 'default'
};

export default function LearnerProgressSummary({ progress, activityTrend, format, t }) {
  const completionTone = progress.completionRate >= 0.8 ? 'success' : progress.completionRate < 0.5 ? 'warning' : 'default';
  const streakTone = progress.streakDays >= 7 ? 'success' : progress.streakDays < 3 ? 'warning' : 'default';

  const totalHours = format.number(Math.round(progress.totalHours ?? 0));
  const targetHours = progress.targetHours ? format.number(Math.round(progress.targetHours)) : null;
  const avgPace = progress.avgPaceMinutes
    ? t('learner.overview.avgPaceMinutes', { value: format.number(Math.round(progress.avgPaceMinutes)) })
    : t('learner.overview.avgPaceUnknown');

  const completionRate = format.percentage(progress.completionRate, { maximumFractionDigits: 0 });

  const goalCaption = progress.targetHours
    ? t('learner.overview.hoursGoalCaption', { achieved: progress.weeklyGoalMet ? t('common.onTrack') : t('common.atRisk') })
    : t('learner.overview.hoursNoGoal');

  const trendMinutes = activityTrend
    .slice(-7)
    .map((point) => point.minutes)
    .reduce((acc, value) => acc + value, 0);

  const trendAvg = trendMinutes / Math.max(activityTrend.length, 1);
  const sparkValues = activityTrend.slice(-10);

  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={TrophyIcon}
        eyebrow={t('learner.overview.statCompletionEyebrow')}
        label={completionRate}
        value={completionRate}
        caption={t('learner.overview.statCompletionCaption', { totalHours })}
        tone={completionTone}
      />
      <StatCard
        icon={ClockIcon}
        eyebrow={t('learner.overview.statHoursEyebrow')}
        label={targetHours ? `${totalHours} / ${targetHours}h` : `${totalHours}h`}
        value={targetHours ? `${totalHours} / ${targetHours}h` : `${totalHours}h`}
        caption={goalCaption}
        tone={progress.weeklyGoalMet ? 'success' : 'warning'}
      />
      <StatCard
        icon={FireIcon}
        eyebrow={t('learner.overview.statStreakEyebrow')}
        label={t('learner.overview.statStreakLabel', { value: format.number(progress.streakDays) })}
        value={t('learner.overview.statStreakLabel', { value: format.number(progress.streakDays) })}
        caption={t('learner.overview.statStreakCaption')}
        tone={streakTone}
      />
      <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              {t('learner.overview.statPaceEyebrow')}
            </p>
            <p className="mt-1 text-xl font-semibold text-primary">
              {avgPace}
            </p>
          </div>
          <StatusPill tone={trendAvg >= 90 ? 'success' : trendAvg < 45 ? 'warning' : 'info'}>
            {t('learner.overview.statPaceTrend', { value: format.number(Math.round(trendAvg)) })}
          </StatusPill>
        </header>
        <div className="mt-6">
          <svg viewBox="0 0 120 44" className="h-20 w-full">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary"
              points={sparkValues
                .map((point, index) => {
                  const x = (index / Math.max(sparkValues.length - 1, 1)) * 120;
                  const y = 44 - Math.min(40, Math.max(4, (point.minutes / Math.max(trendAvg || 1, 1)) * 20));
                  return `${x},${y}`;
                })
                .join(' ')}
            />
          </svg>
          <p className="mt-2 text-xs text-slate-500">
            {t('learner.overview.statPaceCaption', { count: sparkValues.length })}
          </p>
        </div>
      </article>
    </section>
  );
}

LearnerProgressSummary.propTypes = {
  progress: PropTypes.shape({
    completionRate: PropTypes.number,
    avgPaceMinutes: PropTypes.number,
    totalHours: PropTypes.number,
    targetHours: PropTypes.number,
    streakDays: PropTypes.number,
    weeklyGoalMet: PropTypes.bool
  }).isRequired,
  activityTrend: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string,
      minutes: PropTypes.number
    })
  ),
  format: PropTypes.shape({
    number: PropTypes.func.isRequired,
    percentage: PropTypes.func.isRequired
  }).isRequired,
  t: PropTypes.func.isRequired
};

LearnerProgressSummary.defaultProps = {
  activityTrend: []
};
