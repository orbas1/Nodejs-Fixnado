import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useSecurityPreferences } from '../hooks/useSecurityPreferences.js';
import Spinner from '../components/ui/Spinner.jsx';

const methodOptions = [
  {
    id: 'authenticator',
    label: 'Authenticator app',
    helper: 'Scan the QR code from Settings → Security on your authenticator app to generate rotating codes.'
  },
  {
    id: 'email-backup',
    label: 'Email backup codes',
    helper: 'Receive single-use backup codes in your inbox to recover access if you lose your device.'
  }
];

const formatTimestamp = (value) => {
  if (!value) {
    return null;
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  } catch (error) {
    console.warn('[SecuritySettings] Unable to format timestamp', error);
    return null;
  }
};

export default function SecuritySettings() {
  const [status, setStatus] = useState(null);
  const { twoFactorEnabled, setTwoFactorEnabled, updateMethods, methods, lastUpdated, loading, saving, error } =
    useSecurityPreferences();

  const selectedMethods = useMemo(() => new Set(methods ?? []), [methods]);
  const statusLabel = twoFactorEnabled ? 'Enabled' : 'Disabled';
  const statusTone = twoFactorEnabled ? 'text-emerald-600' : 'text-slate-500';
  const statusBadge = twoFactorEnabled
    ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
    : 'border-slate-200 bg-slate-50 text-slate-500';

  const handleToggleTwoFactor = async () => {
    setStatus(null);
    try {
      await setTwoFactorEnabled(!twoFactorEnabled);
      setStatus({ type: 'success', message: !twoFactorEnabled ? 'Two-factor enabled.' : 'Two-factor disabled.' });
    } catch (caught) {
      setStatus({ type: 'error', message: caught?.message || 'Unable to update two-factor settings.' });
    }
  };

  const handleMethodToggle = async (methodId) => {
    setStatus(null);
    try {
      await updateMethods((current = []) => {
        const next = new Set(current ?? []);
        if (next.has(methodId)) {
          next.delete(methodId);
        } else {
          next.add(methodId);
        }
        return Array.from(next);
      });
      setStatus({ type: 'success', message: 'Verification methods updated.' });
    } catch (caught) {
      setStatus({ type: 'error', message: caught?.message || 'Unable to update verification methods.' });
    }
  };

  const formattedUpdatedAt = formatTimestamp(lastUpdated);

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-accent">Security</p>
          <h1 className="text-4xl font-semibold text-primary">Protect your Fixnado account</h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Manage sign-in safeguards like authenticator apps and backup codes. Two-factor checks only appear when you enable
            them here, keeping the login flow fast until you are ready for an extra layer.
          </p>
          <Link to="/login" className="text-xs font-semibold text-accent hover:text-primary">
            ← Back to login
          </Link>
        </div>

        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-accent/10">
          {(loading || saving) && (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white/70 p-3 text-xs text-slate-500">
              <Spinner className="mr-2 h-4 w-4 text-primary" />
              {loading ? 'Loading security settings…' : 'Saving security settings…'}
            </div>
          )}
          {(error || status) && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                (status?.type === 'error' || error)
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
              role="status"
            >
              {error || status?.message}
            </div>
          )}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge}`}>
                <ShieldCheckIcon className={`h-4 w-4 ${statusTone}`} aria-hidden="true" />
                {statusLabel}
              </span>
              <h2 className="text-2xl font-semibold text-primary">Two-factor authentication</h2>
              <p className="text-sm text-slate-600">
                Require a six-digit code after your password. Only accounts that enable this setting will be asked for a code at
                login, so teammates without MFA can continue signing in normally.
              </p>
              {formattedUpdatedAt && (
                <p className="text-xs text-slate-400">Last updated {formattedUpdatedAt}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleToggleTwoFactor}
              className={`h-fit rounded-full px-5 py-2 text-sm font-semibold shadow-glow transition-colors ${
                twoFactorEnabled
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-primary text-white hover:bg-primary/90'
              } disabled:cursor-not-allowed disabled:opacity-60`}
              disabled={saving || loading}
            >
              {saving ? 'Saving…' : twoFactorEnabled ? 'Disable two-factor' : 'Enable two-factor'}
            </button>
          </header>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary">Verification methods</h3>
            <p className="text-sm text-slate-600">
              Choose the methods you will use when two-factor is enabled. We recommend adding both an authenticator app and backup
              codes for emergencies.
            </p>
            <ul className="space-y-4">
              {methodOptions.map((option) => {
                const checked = selectedMethods.has(option.id);
                return (
                  <li
                    key={option.id}
                    className={`flex flex-col gap-3 rounded-2xl border px-4 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                      checked ? 'border-emerald-200 bg-emerald-50/80' : 'border-slate-200 bg-slate-50/70'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-primary">{option.label}</p>
                      <p className="text-sm text-slate-600">{option.helper}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMethodToggle(option.id)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                        checked
                          ? 'border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary'
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                      disabled={saving || loading}
                    >
                      {checked ? (
                        <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-slate-400" aria-hidden="true" />
                      )}
                      {saving ? 'Saving…' : checked ? 'Added' : 'Add method'}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-500">
            <p className="font-semibold text-primary">Need to reset?</p>
            <p className="mt-2">
              Lost access to your authenticator? Disable two-factor temporarily, sign back in, then re-enable it with your new
              device. Backup codes can be regenerated from this page at any time.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
