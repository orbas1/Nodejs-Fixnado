import { useCallback, useEffect, useMemo, useState } from 'react';
import InstructorPipelineBoard from '../../components/instructor/InstructorPipelineBoard.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { acknowledgeOrderStage, fetchOrderPipeline } from '../../api/instructorClient.js';
import { useLocale } from '../../hooks/useLocale.js';

export default function InstructorOrders() {
  const { t } = useLocale();
  const [orders, setOrders] = useState([]);
  const [stages, setStages] = useState([]);
  const [stageFilter, setStageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acknowledgingOrderId, setAcknowledgingOrderId] = useState(null);

  const loadOrders = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const { orders: orderList, stages: stageList } = await fetchOrderPipeline(
        {
          stage: stageFilter === 'all' ? undefined : stageFilter,
          status: statusFilter === 'all' ? undefined : statusFilter
        },
        { signal }
      );
      setOrders(orderList);
      setStages(stageList);
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('[InstructorOrders] Failed to fetch orders', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [stageFilter, statusFilter]);

  useEffect(() => {
    const controller = new AbortController();
    loadOrders(controller.signal);
    return () => controller.abort();
  }, [loadOrders]);

  const pipeline = useMemo(() => {
    const stageMap = new Map();
    stages.forEach((stage) => {
      stageMap.set(stage.id, { ...stage, orders: [] });
    });
    orders.forEach((order) => {
      if (order.stageId && stageMap.has(order.stageId)) {
        stageMap.get(order.stageId).orders.push(order);
      }
    });
    return Array.from(stageMap.values());
  }, [orders, stages]);

  const handleAcknowledge = useCallback(
    async (order) => {
      setAcknowledgingOrderId(order.id);
      try {
        await acknowledgeOrderStage(order.id, { action: 'advance' });
        await loadOrders();
      } catch (err) {
        console.error('[InstructorOrders] Failed to acknowledge order', err);
        setError(err);
      } finally {
        setAcknowledgingOrderId(null);
      }
    },
    [loadOrders]
  );

  const stageOptions = ['all', ...stages.map((stage) => stage.id)];
  const statusOptions = ['all', 'pending', 'in-progress', 'fulfilled', 'cancelled'];

  return (
    <div className="space-y-6 px-4 py-8 md:px-8" data-qa="instructor-orders">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">{t('instructor.orders.eyebrow')}</p>
        <h1 className="text-3xl font-semibold text-primary">{t('instructor.orders.title')}</h1>
        <p className="text-sm text-slate-600">{t('instructor.orders.description')}</p>
      </header>

      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm md:grid-cols-4">
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {t('instructor.orders.stageFilter')}
          <select
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
          >
            {stageOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all'
                  ? t('instructor.orders.stageAll')
                  : stages.find((stage) => stage.id === option)?.label || option}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {t('instructor.orders.statusFilter')}
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? t('instructor.orders.statusAll') : t(`instructor.orders.status.${option}`)}
              </option>
            ))}
          </select>
        </label>
        <div className="md:col-span-2 flex items-end justify-end">
          <button
            type="button"
            onClick={() => loadOrders()}
            className="rounded-full border border-primary/20 bg-primary px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            {t('instructor.orders.refreshCta')}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700" role="alert">
          <p className="font-semibold">{t('instructor.orders.errorTitle')}</p>
          <p className="mt-2">{error.message || t('instructor.orders.errorDescription')}</p>
        </div>
      ) : null}

      {loading && pipeline.length === 0 ? (
        <div className="space-y-4">
          <Skeleton lines={6} className="h-56" />
          <div className="flex justify-center py-8">
            <Spinner label={t('instructor.orders.loading')} />
          </div>
        </div>
      ) : null}

      {pipeline.length > 0 ? (
        <InstructorPipelineBoard
          pipeline={pipeline}
          onAcknowledge={handleAcknowledge}
          acknowledgingId={acknowledgingOrderId}
        />
      ) : (
        !loading && (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-8 text-center text-sm text-slate-500">
            {t('instructor.orders.empty')}
          </p>
        )
      )}
    </div>
  );
}
