import Hero from '../components/Hero.jsx';
import LiveFeed from '../components/LiveFeed.jsx';

const marketplacePillars = [
  {
    title: 'Coordinated workforce',
    description: 'Staff entire crews with vetted supervisors, specialists, and compliance officers in one request.',
    accent: 'from-primary/10 via-white to-sky-50'
  },
  {
    title: 'Logistics on demand',
    description: 'Schedule cranes, tooling, fleet vehicles, and permits with live confirmations from trusted partners.',
    accent: 'from-accent/10 via-white to-primary/5'
  },
  {
    title: 'Governance built in',
    description: 'Track safety docs, SLAs, and multi-level approvals across every project in real time.',
    accent: 'from-primary/5 via-white to-slate-50'
  }
];

const serviceGallery = [
  {
    title: 'Heavy lift teams',
    blurb: 'Certified riggers, operators, and signalers ready for high-rise and industrial work.',
    image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Facility response units',
    blurb: 'Electrical, HVAC, and maintenance crews that stabilise mission-critical infrastructure.',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Digital deployment squads',
    blurb: 'Product, UX, and engineering pods that accelerate enterprise rollouts.',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Event build crews',
    blurb: 'Staging, fabrication, and broadcast teams coordinated with venue operations.',
    image: 'https://images.unsplash.com/photo-1529429617124-aee0a93d4431?auto=format&fit=crop&w=1200&q=80'
  }
];

const workflow = [
  { step: '01', title: 'Outline the job', detail: 'Specify locations, windows, and required certifications.' },
  { step: '02', title: 'Select your crew', detail: 'Choose specialists and gear with verified availability.' },
  { step: '03', title: 'Track & resolve', detail: 'Monitor progress, capture proof of work, and release payment.' }
];

const operationsHighlights = [
  {
    title: 'Live command centre',
    copy: 'View dispatch updates, safety checklists, and on-site photos from a shared dashboard.',
    image: 'https://images.unsplash.com/photo-1581094375940-1d73a13ed9b9?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Enterprise billing & controls',
    copy: 'Segment spend by region, enforce rate cards, and plug into your procurement flow.',
    image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80'
  }
];

const partnerLogos = ['Northwind Energy', 'Globex Developments', 'Acme Infrastructure', 'Nimbus Logistics'];

export default function Home() {
  return (
    <div className="bg-slate-50 text-slate-900">
      <Hero />
      <main className="relative -mt-10 pb-24">
        <div className="mx-auto max-w-6xl space-y-20 px-6 pt-16">
          <section className="grid gap-6 md:grid-cols-3">
            {marketplacePillars.map((pillar) => (
              <article
                key={pillar.title}
                className={`rounded-3xl border border-slate-200 bg-gradient-to-br ${pillar.accent} p-6 shadow-sm backdrop-blur`}
              >
                <h2 className="text-lg font-semibold text-primary">{pillar.title}</h2>
                <p className="mt-3 text-sm text-slate-600">{pillar.description}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-6">
              <header className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">Marketplace coverage</p>
                <h2 className="text-3xl font-semibold text-primary">The crews and equipment you need, ready to roll</h2>
                <p className="text-sm text-slate-600">Surface verified talent, logistics, and compliance support across construction, facilities, and digital programs.</p>
              </header>

              <div className="grid gap-6 sm:grid-cols-2">
                {serviceGallery.map((service) => (
                  <article
                    key={service.title}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <h3 className="text-base font-semibold text-primary">{service.title}</h3>
                      <p className="text-sm text-slate-600">{service.blurb}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm">
                <div className="px-6 pt-6">
                  <h3 className="text-base font-semibold text-primary">Live dispatch feed</h3>
                  <p className="mt-2 text-sm text-slate-600">Approvals, mobilisations, and completions stream in as they happen.</p>
                </div>
                <div className="mt-4 border-t border-slate-100 bg-slate-50/60 px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                  Active jobs
                </div>
                <div className="px-6 pb-6">
                  <div className="overflow-hidden rounded-2xl border border-slate-100">
                    <LiveFeed condensed />
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-white via-sky-50 to-slate-100 p-6 shadow-sm">
                <div className="absolute inset-0 opacity-20">
                  <img
                    src="https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=1200&q=80"
                    alt="Operations manager reviewing plans with a crane operator"
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                  />
                </div>
                <div className="relative space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Ops snapshot</p>
                  <h3 className="text-lg font-semibold text-primary">Safety, permits, and materials aligned</h3>
                  <p className="text-sm text-slate-600">Every stakeholder works from the same source of truth, with audit trails baked in.</p>
                </div>
              </div>
            </aside>
          </section>

          <section className="grid gap-10 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">How Fixnado works</p>
              <h2 className="text-3xl font-semibold text-primary">Spin up an on-demand team in three moves</h2>
              <p className="text-sm text-slate-600">A guided flow keeps procurement, field ops, and finance on the same page.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {workflow.map((item) => (
                <article key={item.step} className="rounded-3xl border border-slate-200 bg-white/98 p-5 text-sm shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">{item.step}</p>
                  <h3 className="mt-2 text-base font-semibold text-primary">{item.title}</h3>
                  <p className="mt-2 text-slate-600">{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            {operationsHighlights.map((item) => (
              <article key={item.title} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-2 p-6">
                  <h3 className="text-lg font-semibold text-primary">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.copy}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="rounded-3xl border border-primary/15 bg-gradient-to-br from-white via-sky-50 to-slate-100 p-8 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/70">Trusted by operations leaders at</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-slate-500">
              {partnerLogos.map((logo) => (
                <span key={logo} className="rounded-full border border-slate-200 bg-white/80 px-5 py-2">
                  {logo}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-3 text-base font-semibold text-white shadow-lg shadow-accent/30 transition-colors hover:bg-accent/90"
              >
                Create your marketplace profile
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-primary/25 bg-white px-8 py-3 text-base font-semibold text-primary transition-colors hover:border-primary/40"
              >
                Talk with our team
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
