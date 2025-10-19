import PropTypes from 'prop-types';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusSmallIcon } from '@heroicons/react/24/outline';
import StatusPill from '../ui/StatusPill.jsx';

function TrendIcon({ trend }) {
  if (trend === 'up') {
    return <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" />;
  }
  if (trend === 'down') {
    return <ArrowTrendingDownIcon className="h-4 w-4 text-amber-500" aria-hidden="true" />;
  }
  return <MinusSmallIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />;
}

TrendIcon.propTypes = {
  trend: PropTypes.string
};

TrendIcon.defaultProps = {
  trend: 'steady'
};

export default function LearnerSkillHealth({ skills, format, t }) {
  if (!skills.length) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {t('learner.overview.skillHealthEyebrow')}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-primary">
            {t('learner.overview.skillHealthTitle')}
          </h2>
        </div>
        <StatusPill tone="info">{t('learner.overview.skillHealthBadge')}</StatusPill>
      </header>
      <ul className="mt-6 space-y-4">
        {skills.map((skill) => (
          <li
            key={skill.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">{skill.skill}</p>
              <p className="mt-1 text-xs text-slate-500">
                {skill.benchmark != null
                  ? t('learner.overview.skillBenchmark', { value: format.percentage(skill.benchmark) })
                  : t('learner.overview.skillBenchmarkFallback')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <TrendIcon trend={skill.trend} />
              <span className="text-sm font-semibold text-primary">
                {format.percentage(skill.score, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

LearnerSkillHealth.propTypes = {
  skills: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      skill: PropTypes.string.isRequired,
      trend: PropTypes.string,
      score: PropTypes.number,
      benchmark: PropTypes.number
    })
  ).isRequired,
  format: PropTypes.shape({
    percentage: PropTypes.func.isRequired
  }).isRequired,
  t: PropTypes.func.isRequired
};
