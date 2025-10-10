import { Link } from 'react-router-dom';

const heroMetrics = [
  { label: 'Cities dispatched', value: '320+' },
  { label: 'Avg. response time', value: '11m' },
  { label: 'Enterprise CSAT', value: '97%' }
];

const trustedLogos = ['Globex Industries', 'Northwind Energy', 'Acme Developments'];

const guardrails = [
  'ISO 27001 aligned infrastructure',
  'White-glove onboarding & transformation office',
  'Global 24/7 dispute and escrow concierge'
];

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-white via-blue-50/40 to-slate-50">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(31,78,216,0.12),transparent_55%)]" aria-hidden="true" />
      <div className="absolute -top-20 -right-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-6 py-20 grid gap-16 lg:grid-cols-[1.2fr_1fr] items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
            Enterprise service orchestration
          </span>
          <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-semibold text-primary leading-tight">
            Fixnado powers mission-critical field operations and custom workforces.
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl">
            Deploy vetted specialists, coordinate equipment, and manage service zones with real-time visibility. Built with enterprise-grade governance, escrow, and dispute workflows out of the box.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              to="/register"
              className="px-7 py-3 rounded-full bg-accent text-white font-semibold shadow-lg shadow-accent/40 hover:bg-accent/90"
            >
              Launch a project
            </Link>
            <Link
              to="/register/company"
              className="px-7 py-3 rounded-full border border-primary/20 bg-white text-primary font-semibold hover:border-primary/40"
            >
              Join as a provider
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:flex sm:items-center sm:gap-10">
            {heroMetrics.map((metric) => (
              <div key={metric.label} className="space-y-1">
                <p className="text-3xl font-semibold text-primary">{metric.value}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {guardrails.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-full border border-accent/20 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary/80"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                {item}
              </div>
            ))}
          </div>

          <div className="mt-12">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Trusted by operations teams at</p>
            <div className="mt-4 grid gap-4 sm:flex sm:flex-wrap sm:items-center sm:gap-8 text-sm font-medium text-slate-400">
              {trustedLogos.map((logo) => (
                <span key={logo} className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-slate-500">
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 rounded-3xl bg-accent/15 blur-2xl" aria-hidden="true" />
          <div className="relative rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur">
            <div className="space-y-5">
              <div className="rounded-2xl border border-accent/20 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">Live command center</p>
                <p className="mt-2 text-base text-primary font-semibold">18 technicians en route • 6 zones active</p>
                <p className="mt-3 text-sm text-slate-500">
                  Dispatch automations synchronize crews, rentals, and material deliveries per service zone.
                </p>
              </div>
              <div className="rounded-2xl bg-secondary p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">Escrow snapshot</p>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-semibold text-primary">$482k</p>
                    <p className="text-xs text-slate-500">Secured until acceptance</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-accent">99.3% dispute resolution</span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500">Next milestone</p>
                <p className="mt-2 text-lg font-semibold text-primary">Metro HQ retrofit • Phase 2</p>
                <div className="mt-4 space-y-2 text-sm text-slate-500">
                  <p>• Compliance audit scheduled — 09:00</p>
                  <p>• Tooling drop confirmed — Zone C</p>
                  <p>• Crew check-in window — 45 minutes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
