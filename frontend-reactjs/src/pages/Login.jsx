import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SocialAuthButtons from '../components/auth/SocialAuthButtons.jsx';

export default function Login() {
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState('');
  const controlWidthClass = 'w-full max-w-sm';

  const handleCredentialSubmit = (event) => {
    event.preventDefault();
    setStatusMessage('');

    setStatusMessage('Signed in securely. Redirecting to your dashboard...');
    window.setTimeout(() => {
      navigate('/feed', { replace: true });
    }, 600);
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
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              placeholder="you@company.com"
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
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className={`${controlWidthClass} rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90`}
          >
            Continue
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
          {statusMessage && <p className="mt-4 text-xs text-slate-500">{statusMessage}</p>}
        </div>
      </div>
    </div>
  );
}
