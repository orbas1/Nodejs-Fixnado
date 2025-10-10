import { Link } from 'react-router-dom';
import { LOGO_URL } from '../constants/branding';

export default function Register() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center px-6 py-12">
      <div className="grid gap-10 rounded-3xl border border-slate-200 bg-white/90 p-10 shadow-2xl shadow-accent/10 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Fixnado" className="h-12 w-12 object-contain" loading="lazy" />
            <div>
              <h1 className="text-2xl font-semibold text-primary">Create your Fixnado account</h1>
              <p className="text-sm text-slate-500">Work smarter across home, business, and field teams.</p>
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-600">
            Choose whether you are joining as a customer or a service professional. You can upgrade to a company or marketplace shop later.
          </p>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            <p>✔ Escrow-protected payments</p>
            <p>✔ Verified professionals and reviews</p>
            <p>✔ Marketplace for tools and materials</p>
          </div>
        </div>
        <form className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">
              First name
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Last name
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </label>
          </div>
          <label className="text-sm font-medium text-slate-600">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Address
            <input
              type="text"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Age
            <input
              type="number"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <div className="grid gap-3">
            <label className="text-sm font-medium text-slate-600">Joining as</label>
            <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none">
              <option value="user">Customer</option>
              <option value="servicemen">Service professional</option>
              <option value="company">Company</option>
            </select>
          </div>
          <button type="submit" className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90">
            Create account
          </button>
          <p className="text-xs text-slate-500">
            By creating an account, you agree to our terms of service and privacy policy.
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
