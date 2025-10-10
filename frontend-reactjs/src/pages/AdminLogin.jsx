import { LOGO_URL } from '../constants/branding';

export default function AdminLogin() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-6 py-12">
      <div className="rounded-3xl border border-primary/30 bg-white/90 p-10 shadow-2xl shadow-primary/20">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Fixnado" className="h-12 w-12 object-contain" loading="lazy" />
          <div>
            <h1 className="text-2xl font-semibold text-primary">Admin control login</h1>
            <p className="text-sm text-slate-500">Separate access for internal operations team.</p>
          </div>
        </div>
        <form className="mt-10 grid gap-5">
          <label className="text-sm font-medium text-slate-600">
            Admin email
            <input type="email" className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none" />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Password
            <input type="password" className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none" />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Security token
            <input type="text" className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none" />
          </label>
          <button type="submit" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90">
            Access admin dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
