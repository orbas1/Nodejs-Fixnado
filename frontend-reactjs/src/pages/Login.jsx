import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SocialAuthButtons from '../components/auth/SocialAuthButtons.jsx';

export default function Login() {
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [hasTwoFactorEnabled, setHasTwoFactorEnabled] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedPreference = window.localStorage.getItem('fx-two-factor-enabled');
    setHasTwoFactorEnabled(storedPreference === 'true');
  }, []);

  const handleCredentialSubmit = (event) => {
    event.preventDefault();
    setStatusMessage('');

    if (hasTwoFactorEnabled) {
      setTwoFactorRequired(true);
      setStatusMessage('Enter the 6-digit code from your authenticator to finish signing in.');
      return;
    }

    setStatusMessage('Signed in securely. Redirecting to your feed...');
  };

  const handleTwoFactorSubmit = (event) => {
    event.preventDefault();
    if (!twoFactorCode.trim()) {
      setStatusMessage('Please enter the verification code from your authenticator app.');
      return;
    }

    setStatusMessage('Two-factor check complete. Redirecting to your feed...');
  };

  const handleSocialSelect = (providerId) => {
    setStatusMessage(`Launching ${providerId} sign-in...`);
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-4xl flex-col justify-center px-6 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-10 shadow-2xl shadow-accent/10">
        <div className="max-w-xl">
          <h1 className="text-3xl font-semibold text-primary">Log in to Fixnado</h1>
          <p className="mt-2 text-sm text-slate-500">
            Access your on-demand marketplace feed, track jobs, and manage bookings in one place.
          </p>
        </div>

        <form onSubmit={handleCredentialSubmit} className="mt-10 grid gap-5" aria-disabled={twoFactorRequired}>
          <div>
            <label className="text-sm font-medium text-slate-600" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-sm">
              <label className="font-medium text-slate-600" htmlFor="login-password">
                Password
              </label>
              <button type="button" className="text-accent hover:underline">
                Forgot?
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              required
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90">
            Continue
          </button>
        </form>

        {twoFactorRequired && (
          <form onSubmit={handleTwoFactorSubmit} className="mt-6 grid gap-4 rounded-2xl border border-accent/30 bg-accent/5 p-5">
            <div>
              <label className="text-sm font-medium text-primary" htmlFor="two-factor-code">
                Two-factor code
              </label>
              <input
                id="two-factor-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={twoFactorCode}
                onChange={(event) => setTwoFactorCode(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-accent/30 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                placeholder="123 456"
              />
              <p className="mt-2 text-xs text-slate-500">
                This step only appears when two-factor authentication is enabled in your security settings.
              </p>
            </div>
            <button
              type="submit"
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90"
            >
              Verify and continue
            </button>
          </form>
        )}

        <SocialAuthButtons className="mt-8" onSelect={handleSocialSelect} />

        <div className="mt-6 text-sm text-slate-500">
          <p>
            Need an account?{' '}
            <Link to="/register" className="font-semibold text-accent">
              Create one
            </Link>
          </p>
          {!hasTwoFactorEnabled && (
            <p className="mt-3 text-xs text-slate-500">
              Want an extra security step? Enable two-factor authentication from Settings → Security to add the code check.
            </p>
          )}
          {statusMessage && <p className="mt-4 text-xs text-slate-500">{statusMessage}</p>}
        </div>
      </div>
    </div>
  );
}
