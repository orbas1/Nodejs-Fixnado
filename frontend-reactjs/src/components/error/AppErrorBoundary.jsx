import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { useLocale } from '../../hooks/useLocale.js';
import { reportClientError } from '../../utils/errorReporting.js';

function resolveReference() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const random = Math.random().toString(36).slice(2, 10);
  return `fx-${Date.now().toString(36)}-${random}`;
}

function normaliseStack(error, info) {
  if (error?.stack) {
    return error.stack;
  }
  if (info?.componentStack) {
    return info.componentStack;
  }
  return 'Stack trace unavailable.';
}

export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      info: null,
      reference: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    const reference = resolveReference();
    const payload = {
      error,
      info,
      reference,
      boundaryId: this.props.boundaryId,
      metadata: this.props.metadata
    };

    Promise.resolve()
      .then(() => reportClientError(payload))
      .catch((caught) => {
        console.error('Failed to report client error', caught);
      });

    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError({ error, info, reference });
      } catch (callbackError) {
        console.error('Error boundary onError callback failed', callbackError);
      }
    }

    this.setState({ info, reference });
  }

  componentDidUpdate(prevProps) {
    if (!this.state.hasError) {
      return;
    }

    const previousKeys = prevProps.resetKeys || [];
    const nextKeys = this.props.resetKeys || [];

    if (previousKeys.length !== nextKeys.length) {
      this.resetErrorBoundary();
      return;
    }

    const changed = nextKeys.some((key, index) => key !== previousKeys[index]);

    if (changed) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    if (typeof this.props.onReset === 'function') {
      try {
        this.props.onReset();
      } catch (callbackError) {
        console.error('Error boundary onReset callback failed', callbackError);
      }
    }

    this.setState({ hasError: false, error: null, info: null, reference: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const fallbackProps = {
      error: this.state.error,
      info: this.state.info,
      reference: this.state.reference,
      resetErrorBoundary: this.resetErrorBoundary
    };

    if (typeof this.props.renderFallback === 'function') {
      return this.props.renderFallback(fallbackProps);
    }

    return <CriticalErrorView key={this.state.reference} {...fallbackProps} />;
  }
}

AppErrorBoundary.propTypes = {
  boundaryId: PropTypes.string,
  children: PropTypes.node.isRequired,
  metadata: PropTypes.object,
  onError: PropTypes.func,
  onReset: PropTypes.func,
  renderFallback: PropTypes.func,
  resetKeys: PropTypes.array
};

AppErrorBoundary.defaultProps = {
  boundaryId: 'app-shell',
  metadata: undefined,
  onError: undefined,
  onReset: undefined,
  renderFallback: undefined,
  resetKeys: undefined
};

function useCopyDiagnostics(diagnostics) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setCopied(false);
      return false;
    }

    try {
      await navigator.clipboard.writeText(diagnostics);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
      return true;
    } catch (error) {
      console.warn('Unable to copy diagnostics to clipboard', error);
      setCopied(false);
      return false;
    }
  };

  return { copied, copy };
}

function formatDiagnostics({ reference, error, info }) {
  const payload = {
    reference,
    message: error?.message ?? String(error),
    name: error?.name ?? error?.constructor?.name ?? 'Error',
    stack: normaliseStack(error, info),
    location: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    timestamp: new Date().toISOString()
  };
  return JSON.stringify(payload, null, 2);
}

function CriticalErrorView({ error = undefined, info = undefined, reference = 'unknown', resetErrorBoundary }) {
  const { t } = useLocale();
  const diagnostics = useMemo(() => formatDiagnostics({ error, info, reference }), [error, info, reference]);
  const { copied, copy } = useCopyDiagnostics(diagnostics);

  const description = t('errors.unexpected.description');
  const supportEmail = 'support@fixnado.com';
  const statusUrl = 'https://status.fixnado.com';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900/95 px-6 py-16 text-white">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/80 p-10 shadow-[0_40px_90px_-40px_rgba(14,116,144,0.6)] backdrop-blur">
        <div className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.4em] text-sky-400" data-qa="error-boundary-label">
            {t('errors.unexpected.title')}
          </p>
          <h1 className="text-2xl font-semibold text-white">{t('errors.unexpected.headline')}</h1>
          <p className="text-sm leading-relaxed text-slate-200">{description}</p>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
            <p className="font-semibold text-slate-200">{t('errors.unexpected.reference')}</p>
            <p className="mt-2 font-mono text-slate-100" data-qa="error-reference">{reference}</p>
          </div>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => resetErrorBoundary()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold tracking-wide text-white transition hover:bg-sky-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300"
            data-qa="error-boundary-action-retry"
          >
            {t('errors.unexpected.actions.retry')}
          </button>
          <a
            href={`mailto:${supportEmail}?subject=${encodeURIComponent(`Support request ${reference}`)}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold tracking-wide text-white transition hover:border-white/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
            data-qa="error-boundary-action-support"
          >
            {t('errors.unexpected.actions.contactSupport')}
          </a>
          <a
            href={statusUrl}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold tracking-wide text-white transition hover:border-white/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
            target="_blank"
            rel="noreferrer noopener"
          >
            {t('errors.unexpected.actions.statusPage')}
          </a>
          <button
            type="button"
            onClick={copy}
            className={clsx(
              'inline-flex items-center justify-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold tracking-wide transition focus:outline-none focus-visible:ring-4',
              copied
                ? 'border-emerald-400/80 bg-emerald-500/10 text-emerald-200 focus-visible:ring-emerald-300/50'
                : 'border-white/20 bg-white/5 text-white hover:border-white/40 focus-visible:ring-white/30'
            )}
            data-qa="error-boundary-action-copy"
          >
            {copied ? t('errors.unexpected.actions.copied') : t('errors.unexpected.actions.copyDetails')}
          </button>
        </div>
        <details className="mt-8 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5" data-qa="error-boundary-details">
          <summary className="cursor-pointer px-6 py-3 text-sm font-semibold tracking-wide text-slate-100">
            {t('errors.unexpected.detailsToggle')}
          </summary>
          <pre className="max-h-72 overflow-auto bg-slate-950/70 px-6 py-4 text-xs leading-relaxed text-slate-200">
            {diagnostics}
          </pre>
        </details>
      </div>
    </div>
  );
}

CriticalErrorView.propTypes = {
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  info: PropTypes.shape({ componentStack: PropTypes.string }),
  reference: PropTypes.string,
  resetErrorBoundary: PropTypes.func.isRequired
};

export default AppErrorBoundary;
