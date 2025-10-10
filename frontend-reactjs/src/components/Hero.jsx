import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="bg-secondary/60">
      <div className="mx-auto max-w-6xl px-6 py-16 grid gap-12 md:grid-cols-2 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
            On-demand services reinvented
          </span>
          <h1 className="mt-6 text-4xl md:text-5xl font-bold text-primary leading-tight">
            Bring trusted professionals to your next custom job in minutes.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Fixnado combines the power of Airtasker-style job requests with an Indeed-inspired talent network and a robust marketplace for tools and materials.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              to="/register"
              className="px-6 py-3 rounded-full bg-accent text-white font-semibold shadow-lg shadow-accent/40 hover:bg-accent/90"
            >
              Find professionals
            </Link>
            <Link
              to="/register/company"
              className="px-6 py-3 rounded-full border border-primary text-primary font-semibold hover:bg-primary/5"
            >
              Become a provider
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 rounded-3xl bg-accent/20 blur-3xl" aria-hidden="true" />
          <div className="relative rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl backdrop-blur">
            <div className="grid gap-4">
              <div className="rounded-2xl bg-secondary p-4">
                <p className="text-sm text-slate-500">Trending service</p>
                <p className="mt-1 text-lg font-semibold text-primary">Smart Home Installation</p>
                <p className="mt-2 text-sm text-slate-600">Average completion time: 2h 45m</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-inner border border-slate-100">
                <p className="text-sm text-slate-500">Active jobs</p>
                <p className="text-3xl font-bold text-primary">1,284</p>
                <p className="text-xs text-slate-400">Updated moments ago</p>
              </div>
              <div className="rounded-2xl bg-primary text-white p-4">
                <p className="text-sm uppercase tracking-wide text-white/80">Escrow protected</p>
                <p className="mt-2 text-lg font-semibold">Every transaction is secured until the job is done.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
