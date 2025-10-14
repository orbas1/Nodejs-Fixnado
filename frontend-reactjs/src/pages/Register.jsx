import { Link } from 'react-router-dom';
import SocialAuthButtons from '../components/auth/SocialAuthButtons.jsx';

export default function Register() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center px-6 py-12">
      <div className="grid gap-10 rounded-3xl border border-slate-200 bg-white/95 p-10 shadow-2xl shadow-accent/10 md:grid-cols-2">
        <div className="max-w-sm">
          <h1 className="text-3xl font-semibold text-primary">Join the Fixnado marketplace</h1>
          <p className="mt-3 text-sm text-slate-500">
            Create an account to book trusted crews, sell your expertise, or stock up on the tools and materials you need on demand.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              Escrow-backed payments that release when the work is done.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              Verified pros with live availability across every service zone.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              Marketplace access for rental gear, consumables, and delivery scheduling.
            </li>
          </ul>
        </div>
        <form className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-600" htmlFor="register-first-name">
              First name
              <input
                id="register-first-name"
                type="text"
                required
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-600" htmlFor="register-last-name">
              Last name
              <input
                id="register-last-name"
                type="text"
                required
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </label>
          </div>
          <label className="text-sm font-medium text-slate-600" htmlFor="register-email">
            Email
            <input
              id="register-email"
              type="email"
              required
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="text-sm font-medium text-slate-600" htmlFor="register-password">
            Password
            <input
              id="register-password"
              type="password"
              required
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="text-sm font-medium text-slate-600" htmlFor="register-address">
            Address
            <input
              id="register-address"
              type="text"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="text-sm font-medium text-slate-600" htmlFor="register-age">
            Age
            <input
              id="register-age"
              type="number"
              min="18"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <div className="grid gap-3">
            <label className="text-sm font-medium text-slate-600" htmlFor="register-role">
              Joining as
            </label>
            <select
              id="register-role"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
            >
              <option value="user">Customer</option>
              <option value="servicemen">Service professional</option>
              <option value="company">Company</option>
            </select>
          </div>
          <button type="submit" className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90">
            Create account
          </button>
          <SocialAuthButtons className="mt-2" />
          <p className="text-xs text-slate-500">
            By continuing you agree to our terms of service and privacy policy.
          </p>
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-accent">
              Log in
            </Link>
          </p>
          <p className="text-sm text-slate-500">
            Registering a company?{' '}
            <Link to="/register/company" className="font-semibold text-accent">
              Complete company onboarding
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
