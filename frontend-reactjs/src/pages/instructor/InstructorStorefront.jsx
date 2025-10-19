import { useCallback, useEffect, useState } from 'react';
import InstructorStorefrontPreview from '../../components/instructor/InstructorStorefrontPreview.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { fetchStorefrontSettings, updateStorefrontSettings } from '../../api/instructorClient.js';
import { useLocale } from '../../hooks/useLocale.js';

export default function InstructorStorefront() {
  const { t } = useLocale();
  const [storefront, setStorefront] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const loadStorefront = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStorefrontSettings({ signal });
      setStorefront(data);
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('[InstructorStorefront] Failed to fetch storefront settings', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadStorefront(controller.signal);
    return () => controller.abort();
  }, [loadStorefront]);

  const handleSave = useCallback(
    async (payload) => {
      setSaving(true);
      setMessage(null);
      try {
        const updated = await updateStorefrontSettings(payload);
        setStorefront((current) => ({ ...current, ...updated }));
        setMessage(t('instructor.storefront.successMessage'));
      } catch (err) {
        console.error('[InstructorStorefront] Failed to update storefront', err);
        setError(err);
      } finally {
        setSaving(false);
      }
    },
    [t]
  );

  return (
    <div className="space-y-6 px-4 py-8 md:px-8" data-qa="instructor-storefront">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">{t('instructor.storefront.eyebrow')}</p>
        <h1 className="text-3xl font-semibold text-primary">{t('instructor.storefront.pageTitle')}</h1>
        <p className="text-sm text-slate-600">{t('instructor.storefront.pageDescription')}</p>
      </header>

      {message ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 text-sm text-emerald-700" role="status">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700" role="alert">
          <p className="font-semibold">{t('instructor.storefront.errorTitle')}</p>
          <p className="mt-2">{error?.message || t('instructor.storefront.errorDescription')}</p>
        </div>
      ) : null}

      {loading && !storefront ? (
        <div className="space-y-4">
          <Skeleton lines={6} className="h-60" />
          <div className="flex justify-center py-8">
            <Spinner label={t('instructor.storefront.loading')} />
          </div>
        </div>
      ) : null}

      {storefront ? (
        <InstructorStorefrontPreview storefront={storefront} onSave={handleSave} saving={saving} />
      ) : null}
    </div>
  );
}
