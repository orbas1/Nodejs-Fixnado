import { Link } from 'react-router-dom';
import { LOGO_URL } from '../constants/branding';

export default function Login() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-4xl flex-col justify-center px-6 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-10 shadow-2xl shadow-accent/10">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Fixnado" className="h-12 w-12 object-contain" loading="lazy" />
          <div>
            <h1 className="text-2xl font-semibold text-primary">Welcome back</h1>
            <p className="text-sm text-slate-500">Secure login with 2FA protection.</p>
          </div>
        </div>
        <form className="mt-10 grid gap-5">
          <div>
            <label className="text-sm font-medium text-slate-600">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <div className="grid gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4">
            <p className="text-sm font-medium text-primary">Two-factor options</p>
            <div className="grid gap-2 text-xs text-slate-600">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-slate-300" /> Email code verification
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-slate-300" /> Google Authenticator
              </label>
            </div>
          </div>
          <button type="submit" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90">
            Login securely
          </button>
        </form>
        <div className="mt-6 text-sm text-slate-500">
          <p>
            Need an account?{' '}
            <Link to="/register" className="font-semibold text-accent">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
