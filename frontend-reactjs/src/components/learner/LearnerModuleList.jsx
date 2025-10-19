import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import StatusPill from '../ui/StatusPill.jsx';

function ProgressBar({ value }) {
  const normalised = Math.min(Math.max(value ?? 0, 0), 1);
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
        style={{ width: `${normalised * 100}%` }}
      />
    </div>
  );
}

ProgressBar.propTypes = {
  value: PropTypes.number
};

ProgressBar.defaultProps = {
  value: 0
};

function ModuleRow({ module, format, t }) {
  const riskTone =
    module.riskLevel === 'critical' ? 'danger' : module.riskLevel === 'warning' ? 'warning' : 'info';

  return (
    <li
      className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      data-qa={`learner-module-${module.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">{module.title}</p>
          <p className="mt-1 text-xs text-slate-500">
            {module.zone ? t('learner.overview.moduleZone', { zone: module.zone }) : t('learner.overview.moduleZoneFallback')}
          </p>
          {module.facilitator ? (
            <p className="mt-1 text-xs text-slate-500">
              {t('learner.overview.moduleFacilitator', { name: module.facilitator })}
            </p>
          ) : null}
        </div>
        <StatusPill tone={riskTone}>{t(`learner.overview.moduleRisk.${module.riskLevel}`)}</StatusPill>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <ProgressBar value={module.progress} />
        <span className="text-sm font-semibold text-slate-600">
          {format.percentage(module.progress, { maximumFractionDigits: 0 })}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        {module.dueAt ? (
          <span>{t('learner.overview.moduleDue', { value: format.date(module.dueAt) })}</span>
        ) : (
          <span>{t('learner.overview.moduleDueTbd')}</span>
        )}
        {module.nextSessionAt ? (
          <span className="inline-flex items-center gap-2">
            <span>{t('learner.overview.moduleNextSession', { value: format.dateTime(module.nextSessionAt) })}</span>
            <Link
              to={`/dashboards/learner/calendar?session=${encodeURIComponent(module.id)}`}
              className="inline-flex items-center gap-1 text-primary hover:text-primary/80"
            >
              {t('learner.overview.moduleViewSession')}
              <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </span>
        ) : null}
      </div>
    </li>
  );
}

ModuleRow.propTypes = {
  module: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    progress: PropTypes.number,
    dueAt: PropTypes.string,
    nextSessionAt: PropTypes.string,
    facilitator: PropTypes.string,
    zone: PropTypes.string,
    riskLevel: PropTypes.string
  }).isRequired,
  format: PropTypes.shape({
    percentage: PropTypes.func.isRequired,
    date: PropTypes.func.isRequired,
    dateTime: PropTypes.func.isRequired
  }).isRequired,
  t: PropTypes.func.isRequired
};

export default function LearnerModuleList({ modules, format, t }) {
  if (!modules.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-10 text-center">
        <p className="text-sm font-semibold text-primary">{t('learner.overview.modulesEmptyTitle')}</p>
        <p className="mt-2 text-xs text-slate-500">{t('learner.overview.modulesEmptyDescription')}</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {modules.map((module) => (
        <ModuleRow key={module.id} module={module} format={format} t={t} />
      ))}
    </ul>
  );
}

LearnerModuleList.propTypes = {
  modules: PropTypes.arrayOf(ModuleRow.propTypes.module).isRequired,
  format: ModuleRow.propTypes.format.isRequired,
  t: PropTypes.func.isRequired
};
