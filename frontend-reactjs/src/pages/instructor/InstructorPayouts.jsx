import { useCallback, useEffect, useState } from 'react';
import InstructorPayoutSummary from '../../components/instructor/InstructorPayoutSummary.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { fetchPayoutSummary, requestPayoutStatement } from '../../api/instructorClient.js';
import { useLocale } from '../../hooks/useLocale.js';

const RANGE_OPTIONS = ['7d', '30d', '90d'];

export default function InstructorPayouts() {
  const { t } = useLocale();
  const [range, setRange] = useState('30d');
  const [summary, setSummary] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportLink, setExportLink] = useState(null);

  const loadPayouts = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPayoutSummary({ range }, { signal });
      setSummary(data.summary);
      setPayouts(data.payouts);
      setDisputes(data.disputes);
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('[InstructorPayouts] Failed to fetch payout summary', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    const controller = new AbortController();
    loadPayouts(controller.signal);
    return () => controller.abort();
  }, [loadPayouts]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportLink(null);
    try {
      const response = await requestPayoutStatement({ range, format: 'csv' });
      setExportLink(response.url);
    } catch (err) {
      console.error('[InstructorPayouts] Failed to request export', err);
      setError(err);
    } finally {
      setExporting(false);
    }
  }, [range]);

  return (
    <div className="space-y-6 px-4 py-8 md:px-8" data-qa="instructor-payouts">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">{t('instructor.payouts.eyebrow')}</p>
        <h1 className="text-3xl font-semibold text-primary">{t('instructor.payouts.pageTitle')}</h1>
        <p className="text-sm text-slate-600">{t('instructor.payouts.pageDescription')}</p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                range === option ? 'bg-primary text-white shadow-sm' : 'border border-slate-300 text-slate-600'
              }`}
            >
              {t(`instructor.payouts.range.${option}`)}
            </button>
          ))}
        </div>
        {exportLink ? (
          <a
            href={exportLink}
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
          >
            {t('instructor.payouts.downloadExport')}
          </a>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700" role="alert">
          <p className="font-semibold">{t('instructor.payouts.errorTitle')}</p>
          <p className="mt-2">{error.message || t('instructor.payouts.errorDescription')}</p>
        </div>
      ) : null}

      {loading && !summary ? (
        <div className="space-y-4">
          <Skeleton lines={6} className="h-52" />
          <div className="flex justify-center py-8">
            <Spinner label={t('instructor.payouts.loading')} />
          </div>
        </div>
      ) : null}

      {summary ? (
        <InstructorPayoutSummary
          summary={summary}
          payouts={payouts}
          disputes={disputes}
          onExport={handleExport}
          exporting={exporting}
        />
      ) : null}
    </div>
  );
}
