import { useCallback, useState } from 'react';
import InstructorCheckoutSimulator from '../../components/instructor/InstructorCheckoutSimulator.jsx';
import { simulateCheckout } from '../../api/instructorClient.js';
import { useLocale } from '../../hooks/useLocale.js';

export default function InstructorCheckout() {
  const { t } = useLocale();
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSimulate = useCallback(
    async (payload) => {
      setSubmitting(true);
      setError(null);
      try {
        const response = await simulateCheckout(payload);
        setResult(response);
      } catch (err) {
        console.error('[InstructorCheckout] Failed to simulate checkout', err);
        setError(err);
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  return (
    <div className="space-y-6 px-4 py-8 md:px-8" data-qa="instructor-checkout">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">{t('instructor.checkout.eyebrow')}</p>
        <h1 className="text-3xl font-semibold text-primary">{t('instructor.checkout.pageTitle')}</h1>
        <p className="text-sm text-slate-600">{t('instructor.checkout.pageDescription')}</p>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700" role="alert">
          <p className="font-semibold">{t('instructor.checkout.errorTitle')}</p>
          <p className="mt-2">{error.message || t('instructor.checkout.errorDescription')}</p>
        </div>
      ) : null}

      <InstructorCheckoutSimulator onSimulate={handleSimulate} result={result} isSubmitting={submitting} />
    </div>
  );
}
