import { useMemo } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { useLocale } from '../../hooks/useLocale.js';
import StatusPill from '../ui/StatusPill.jsx';

function StageColumn({ stage, onAcknowledge, acknowledgingId }) {
  const { t, format } = useLocale();
  const orders = stage.orders ?? [];
  const isEmpty = orders.length === 0;

  return (
    <section
      className="flex min-h-[18rem] flex-1 flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm"
      aria-label={stage.label}
    >
      <header className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-primary">{stage.label}</h3>
          {stage.targetSlaHours ? (
            <p className="text-xs text-slate-500">{t('instructor.orders.stageSla', { hours: stage.targetSlaHours })}</p>
          ) : null}
        </div>
        <StatusPill tone={isEmpty ? 'neutral' : 'info'}>{t('instructor.orders.stageCount', { count: orders.length })}</StatusPill>
      </header>

      <ul className={clsx('flex-1 space-y-3 overflow-y-auto', isEmpty && 'flex items-center justify-center pb-4 text-sm text-slate-500')}>
        {isEmpty ? (
          <li>{t('instructor.orders.stageEmpty')}</li>
        ) : (
          orders.map((order) => (
            <li
              key={order.id}
              className="space-y-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm"
              data-qa={`instructor-order-${order.id}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">{order.reference}</p>
                  <p className="text-xs text-slate-500">{order.product}</p>
                </div>
                <span className="text-sm font-semibold text-primary">{format.currency(order.total)}</span>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div>
                  <dt className="font-semibold uppercase tracking-[0.25em] text-slate-400">{t('instructor.orders.learner')}</dt>
                  <dd>{order.learner}</dd>
                </div>
                {order.placedAt ? (
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.25em] text-slate-400">{t('instructor.orders.placedAt')}</dt>
                    <dd>{format.dateTime(order.placedAt)}</dd>
                  </div>
                ) : null}
                {order.dueAt ? (
                  <div>
                    <dt className="font-semibold uppercase tracking-[0.25em] text-slate-400">{t('instructor.orders.fulfilBy')}</dt>
                    <dd className={clsx(order.slaBreachRisk && 'text-rose-500 font-semibold')}>{format.dateTime(order.dueAt)}</dd>
                  </div>
                ) : null}
                {order.notes ? (
                  <div className="col-span-2">
                    <dt className="font-semibold uppercase tracking-[0.25em] text-slate-400">{t('instructor.orders.notes')}</dt>
                    <dd>{order.notes}</dd>
                  </div>
                ) : null}
              </dl>
              {onAcknowledge ? (
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary/90"
                  onClick={() => onAcknowledge(order)}
                  disabled={acknowledgingId === order.id}
                >
                  {acknowledgingId === order.id
                    ? t('instructor.orders.acknowledging')
                    : t('instructor.orders.acknowledgeCta')}
                </button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

StageColumn.propTypes = {
  stage: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    targetSlaHours: PropTypes.number,
    orders: PropTypes.array
  }).isRequired,
  onAcknowledge: PropTypes.func,
  acknowledgingId: PropTypes.string
};

StageColumn.defaultProps = {
  onAcknowledge: undefined,
  acknowledgingId: undefined
};

export default function InstructorPipelineBoard({ pipeline, onAcknowledge, acknowledgingId }) {
  const stages = useMemo(() => pipeline ?? [], [pipeline]);
  if (stages.length === 0) {
    return null;
  }
  return (
    <div className="grid gap-4 lg:grid-cols-3" data-qa="instructor-pipeline-board">
      {stages.map((stage) => (
        <StageColumn key={stage.id} stage={stage} onAcknowledge={onAcknowledge} acknowledgingId={acknowledgingId} />
      ))}
    </div>
  );
}

InstructorPipelineBoard.propTypes = {
  pipeline: PropTypes.arrayOf(PropTypes.object).isRequired,
  onAcknowledge: PropTypes.func,
  acknowledgingId: PropTypes.string
};

InstructorPipelineBoard.defaultProps = {
  onAcknowledge: undefined,
  acknowledgingId: undefined
};
