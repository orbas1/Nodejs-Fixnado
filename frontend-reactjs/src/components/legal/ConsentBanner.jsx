import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useConsent } from '../../hooks/useConsent.js';

function PolicyItem({ policy, index }) {
  return (
    <li className="flex flex-col gap-1 rounded-xl bg-white/60 p-3 shadow-inner shadow-primary/5">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {index + 1}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{policy.title}</p>
          <p className="text-xs text-slate-600">Version {policy.version}</p>
        </div>
      </div>
      <p className="text-xs leading-5 text-slate-600">{policy.description}</p>
      <Link
        className="text-xs font-medium text-primary underline-offset-2 hover:underline"
        to={policy.url.startsWith('http') ? policy.url : policy.url.replace(/^\//, '/')}
        target={policy.url.startsWith('http') ? '_blank' : undefined}
        rel="noreferrer"
      >
        Review full policy
      </Link>
    </li>
  );
}

PolicyItem.propTypes = {
  policy: PropTypes.shape({
    title: PropTypes.string,
    version: PropTypes.string,
    description: PropTypes.string,
    url: PropTypes.string
  }).isRequired,
  index: PropTypes.number.isRequired
};

export default function ConsentBanner() {
  const { pendingPolicies, requiresConsent, acknowledgeConsent, loading, error } = useConsent();
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const policiesWithMetadata = useMemo(
    () =>
      pendingPolicies.map((policy) => ({
        key: policy.policy,
        title: policy.policy.replace(/_/g, ' '),
        version: policy.version,
        description: policy.description,
        url: policy.url,
        stale: policy.stale
      })),
    [pendingPolicies]
  );

  if (!requiresConsent || policiesWithMetadata.length === 0) {
    return null;
  }

  const handleAcceptAll = async () => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setLocalError(null);
    const policiesToConfirm = policiesWithMetadata.map((policy) => policy.key);
    try {
      for (const policyKey of policiesToConfirm) {
        await acknowledgeConsent(policyKey, { source: 'web_banner' });
      }
    } catch (err) {
      setLocalError(err?.message || 'Unable to register consent, please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-4xl rounded-3xl border border-primary/20 bg-white/95 p-6 shadow-2xl shadow-primary/20 backdrop-blur"
    >
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Consent required</p>
          <h2 className="text-lg font-semibold text-slate-900">
            Please review and confirm the updated legal terms
          </h2>
          <p className="text-sm text-slate-600">
            We refreshed our legal documentation to reflect the new consent ledger and scam detection controls. Confirming keeps your access uninterrupted and ensures our records stay compliant.
          </p>
        </header>

        <ul className="grid gap-3 sm:grid-cols-2">
          {policiesWithMetadata.map((policy, index) => (
            <PolicyItem key={policy.key} policy={policy} index={index} />
          ))}
        </ul>

        {(error || localError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {localError || error?.message || 'A network error occurred. Please retry.'}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {submitting || loading ? 'Saving your acknowledgement…' : 'You can manage consent anytime in Privacy settings.'}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAcceptAll}
              disabled={submitting || loading}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-primary/60"
            >
              {submitting ? 'Recording consent…' : 'Accept and continue'}
            </button>
            <Link
              to="/privacy"
              className="text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              Privacy Center
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
