import { LOGO_URL } from '../constants/branding';

export default function CompanyRegister() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center px-6 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-10 shadow-2xl shadow-accent/10">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Fixnado" className="h-12 w-12 object-contain" loading="lazy" />
          <div>
            <h1 className="text-2xl font-semibold text-primary">Company & sole trader onboarding</h1>
            <p className="text-sm text-slate-500">Unlock team dashboards, service zones, and marketplace shops.</p>
          </div>
        </div>
        <form className="mt-10 grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">
              Business name
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Legal structure
              <select className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none">
                <option value="sole trader">Sole trader</option>
                <option value="company">Company</option>
                <option value="partnership">Partnership</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">
              Primary contact
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Contact email
              <input
                type="email"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              />
            </label>
          </div>
          <label className="text-sm font-medium text-slate-600">
            Service regions
            <textarea
              className="mt-1 h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              placeholder="List your preferred service zones or upload geojson"
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Marketplace intent
            <textarea
              className="mt-1 h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              placeholder="Describe items you plan to sell or rent"
            />
          </label>
          <div className="grid gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm text-slate-600">
            <p className="font-semibold text-primary">Verification checklist</p>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-slate-300" /> I will upload liability insurance
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-slate-300" /> I consent to identity verification
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-slate-300" /> I agree to marketplace policies
            </label>
          </div>
          <button type="submit" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90">
            Submit application
          </button>
        </form>
      </div>
    </div>
  );
}
