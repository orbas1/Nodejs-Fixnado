import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import InstructorPerformanceSummary from '../../components/instructor/InstructorPerformanceSummary.jsx';
import InstructorPipelineBoard from '../../components/instructor/InstructorPipelineBoard.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import {
  acknowledgeOrderStage,
  fetchInstructorOverview
} from '../../api/instructorClient.js';
import { useLocale } from '../../hooks/useLocale.js';

export default function InstructorDashboard() {
  const { t } = useLocale();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acknowledgingOrderId, setAcknowledgingOrderId] = useState(null);

  const loadOverview = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInstructorOverview({}, { signal });
      setOverview(data);
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('[InstructorDashboard] Failed to fetch overview', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadOverview(controller.signal);
    return () => controller.abort();
  }, [loadOverview]);

  const handleRefresh = useCallback(() => {
    const controller = new AbortController();
    loadOverview(controller.signal);
    return () => controller.abort();
  }, [loadOverview]);

  const handleAcknowledge = useCallback(
    async (order) => {
      if (!order?.id) {
        return;
      }
      setAcknowledgingOrderId(order.id);
      try {
        await acknowledgeOrderStage(order.id, { action: 'advance' });
        await loadOverview();
      } catch (err) {
        console.error('[InstructorDashboard] Failed to update order stage', err);
        setError(err);
      } finally {
        setAcknowledgingOrderId(null);
      }
    },
    [loadOverview]
  );

  const pipeline = useMemo(() => overview?.pipeline ?? [], [overview]);

  return (
    <div className="space-y-8 px-4 py-8 md:px-8" data-qa="instructor-dashboard">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">
            {t('instructor.dashboard.eyebrow')}
          </p>
          <h1 className="text-3xl font-semibold text-primary">{t('instructor.dashboard.pageTitle')}</h1>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
        >
          <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
          {t('instructor.dashboard.refreshCta')}
        </button>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700" role="alert">
          <p className="font-semibold">{t('instructor.dashboard.errorTitle')}</p>
          <p className="mt-2">{error.message || t('instructor.dashboard.errorDescription')}</p>
        </div>
      ) : null}

      {loading && !overview ? (
        <div className="space-y-6">
          <Skeleton lines={6} className="h-52" />
          <div className="flex justify-center py-12">
            <Spinner label={t('instructor.dashboard.loading')} />
          </div>
        </div>
      ) : null}

      {overview ? (
        <>
          <InstructorPerformanceSummary
            metrics={overview.metrics}
            revenueTrend={overview.revenueTrend}
            products={overview.topProducts}
            alerts={overview.alerts}
            tasks={overview.tasks}
            payouts={overview.payouts}
          />

          {pipeline.length > 0 ? (
            <section className="space-y-4" aria-labelledby="instructor-pipeline">
              <header className="flex items-center justify-between">
                <div>
                  <h2 id="instructor-pipeline" className="text-xl font-semibold text-primary">
                    {t('instructor.orders.pipelineTitle')}
                  </h2>
                  <p className="text-sm text-slate-600">{t('instructor.orders.pipelineDescription')}</p>
                </div>
                {acknowledgingOrderId ? (
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <Spinner size="1rem" />
                    {t('instructor.orders.acknowledging')}
                  </div>
                ) : null}
              </header>
              <InstructorPipelineBoard
                pipeline={pipeline}
                onAcknowledge={handleAcknowledge}
                acknowledgingId={acknowledgingOrderId}
              />
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
