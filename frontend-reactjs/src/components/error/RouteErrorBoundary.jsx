import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.js';
import AppErrorBoundary from './AppErrorBoundary.jsx';

function InlineErrorFallback({ error, reference, resetErrorBoundary }) {
  const { t } = useLocale();

  return (
    <section className="mx-auto my-16 w-full max-w-3xl rounded-3xl border border-slate-200 bg-white/80 p-10 text-slate-900 shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">
        {t('errors.unexpected.title')}
      </p>
      <h2 className="mt-4 text-2xl font-semibold text-slate-900">{t('errors.unexpected.inlineHeadline')}</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{t('errors.unexpected.inlineDescription')}</p>
      <div className="mt-6 rounded-2xl bg-slate-100 px-4 py-3 text-xs text-slate-500">
        <p className="font-semibold text-slate-600">{t('errors.unexpected.reference')}</p>
        <p className="mt-1 font-mono text-slate-700">{reference}</p>
      </div>
      <button
        type="button"
        onClick={() => resetErrorBoundary()}
        className="mt-6 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold tracking-wide text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-400"
      >
        {t('errors.unexpected.actions.retry')}
      </button>
      <details className="mt-6 text-xs text-slate-600">
        <summary className="cursor-pointer font-semibold text-slate-700">
          {t('errors.unexpected.detailsToggle')}
        </summary>
        <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-slate-900/90 px-4 py-3 font-mono text-[11px] leading-relaxed text-slate-100">
          {error?.stack || error?.message || String(error)}
        </pre>
      </details>
    </section>
  );
}

InlineErrorFallback.propTypes = {
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  reference: PropTypes.string,
  resetErrorBoundary: PropTypes.func.isRequired
};

InlineErrorFallback.defaultProps = {
  error: undefined,
  reference: 'unknown'
};

export default function RouteErrorBoundary({ children, boundaryId, metadata }) {
  const location = useLocation();

  return (
    <AppErrorBoundary
      boundaryId={boundaryId}
      metadata={metadata}
      resetKeys={[location.key, location.pathname]}
      renderFallback={({ error, reference, resetErrorBoundary }) => (
        <InlineErrorFallback
          error={error}
          reference={reference}
          resetErrorBoundary={resetErrorBoundary}
        />
      )}
    >
      {children}
    </AppErrorBoundary>
  );
}

RouteErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  boundaryId: PropTypes.string,
  metadata: PropTypes.object
};

RouteErrorBoundary.defaultProps = {
  boundaryId: 'route-boundary',
  metadata: undefined
};
