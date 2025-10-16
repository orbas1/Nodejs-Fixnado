import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SocialAuthButtons from '../components/auth/SocialAuthButtons.jsx';
import { loginUser } from '../api/sessionClient.js';
import { initialiseSessionFromLogin } from '../utils/sessionStorage.js';

export default function Login() {
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const controlWidthClass = 'w-full max-w-sm';

  const handleCredentialSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const payload = await loginUser({
        email: form.email.trim(),
        password: form.password,
        rememberMe: form.rememberMe
      });

      initialiseSessionFromLogin(payload);
      setStatusMessage('Signed in securely. Redirecting to your dashboard...');
      window.setTimeout(() => {
        navigate('/feed', { replace: true });
      }, 600);
    } catch (error) {
      console.error('[login] unable to authenticate', error);
      setErrorMessage(error?.message ?? 'Unable to sign in. Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSelect = (providerId) => {
    const providerNameMap = {
      google: 'Google',
      facebook: 'Facebook',
      linkedin: 'LinkedIn',
      x: 'X'
    };
    const providerName = providerNameMap[providerId] ?? 'social';
    setStatusMessage(`Launching ${providerName} sign-in...`);
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

        <form onSubmit={handleCredentialSubmit} className="mt-10 grid gap-5 justify-items-center">
          <div className={controlWidthClass}>
            <label className="text-sm font-medium text-slate-600" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              placeholder="you@company.com"
              autoComplete="email"
            />
          </div>
          <div className={controlWidthClass}>
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
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <label className={`${controlWidthClass} flex items-center gap-2 text-sm text-slate-600`}>
            <input
              type="checkbox"
              checked={form.rememberMe}
              onChange={(event) => setForm((current) => ({ ...current, rememberMe: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            Remember this device
          </label>

          <button
            type="submit"
            disabled={loading}
            className={`${controlWidthClass} rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-400`}
          >
            {loading ? 'Signing in…' : 'Continue'}
          </button>
        </form>

        <SocialAuthButtons className="mt-8" onSelect={handleSocialSelect} />

        <div className="mt-6 text-sm text-slate-500">
          <p>
            Need an account?{' '}
            <Link to="/register" className="font-semibold text-accent">
              Create one
            </Link>
          </p>
          {errorMessage ? <p className="mt-4 text-xs font-semibold text-rose-600">{errorMessage}</p> : null}
          {statusMessage && <p className="mt-2 text-xs text-slate-500">{statusMessage}</p>}
        </div>
      </div>
    </div>
  );
}
