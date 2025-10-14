import PageHeader from '../components/blueprints/PageHeader.jsx';
import BlueprintSection from '../components/blueprints/BlueprintSection.jsx';
import AffiliateDashboardSection from '../components/affiliate/AffiliateDashboardSection.jsx';

const badges = ['Top rated', 'Escrow trusted', 'Rapid responder'];

const services = [
  { id: 1, name: 'Smart building commissioning', price: '$135/hr', completed: 112, sla: 'SLA 4h response' },
  { id: 2, name: 'High-voltage diagnostics', price: '$165/hr', completed: 156, sla: 'SLA 2h response' },
  { id: 3, name: 'Critical incident standby', price: '$420 retainer', completed: 28, sla: '24/7 on-call' }
];

const languages = [
  { locale: 'English (US)', proficiency: 'Native', coverage: 'All copy and job notes' },
  { locale: 'Spanish (MX)', proficiency: 'Professional working', coverage: 'Safety briefings and SMS updates' }
];

const complianceDocs = [
  { name: 'DBS Enhanced', status: 'Cleared', expiry: 'Aug 2025' },
  { name: 'NIC EIC Certification', status: 'Valid', expiry: 'Feb 2026' },
  { name: 'Public liability insurance (£5m)', status: 'Active', expiry: 'Oct 2025' }
];

const availability = [
  { window: 'Mon – Fri', time: '07:00 – 19:00', notes: 'Emergency response across all zones.' },
  { window: 'Sat', time: '08:00 – 14:00', notes: 'Premium callout applies; remote diagnostics offered.' }
];

const engagementWorkflow = [
  {
    stage: 'Discovery',
    detail: 'Survey the site within 24 hours and log permits or access notes.'
  },
  {
    stage: 'Execution',
    detail: 'Track milestones with geo-tagged proof before escrow releases.'
  },
  {
    stage: 'Post-job',
    detail: 'Send documentation and schedule follow-up checks automatically.'
  }
];

const toolingAndShop = [
  {
    name: 'Marketplace storefront',
    description: 'Thermal cameras, torque tools, and surge analyzers with insured delivery.'
  },
  {
    name: 'Service zone coverage',
    description: 'Downtown San Diego, La Jolla, Pacific Beach, and Chula Vista with live ETAs.'
  },
  {
    name: 'Knowledge base references',
    description: 'Permit checklist, lockout/tagout, and escalation scripts on hand.'
  }
];

export default function Profile() {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <PageHeader
        eyebrow="Provider profile"
        title="Jordan Miles — Master electrician"
        description="Enterprise-certified electrician covering San Diego service zones."
        breadcrumbs={[
          { label: 'Providers', to: '/services' },
          { label: 'Jordan Miles' }
        ]}
        actions={[
          { label: 'Request quote', to: '/feed', variant: 'primary' },
          { label: 'Share profile', to: '/profile/share' }
        ]}
        meta={[
          { label: 'Overall rating', value: '4.95', caption: '321 verified reviews', emphasis: true },
          { label: 'Avg. response', value: '11 minutes', caption: 'Based on last 90 days' },
          { label: 'Escrow releases', value: '184', caption: '0 disputes escalated' }
        ]}
      />

      <div className="mx-auto max-w-7xl px-6 pt-16 space-y-14">
        <AffiliateDashboardSection />

        <BlueprintSection
          eyebrow="Service catalogue"
          title="High-availability electrical services"
          description="Escrow-backed packages tailored for regulated sites."
          aside={
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-primary">Language & localisation</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {languages.map((language) => (
                    <li key={language.locale} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-4">
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{language.locale}</span>
                      <span className="mt-2 font-semibold text-primary">{language.proficiency}</span>
                      <span className="text-xs text-slate-500">{language.coverage}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-primary/10 bg-primary/5 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-primary">Compliance documents</h3>
                <ul className="mt-4 space-y-3 text-xs text-slate-600">
                  {complianceDocs.map((doc) => (
                    <li key={doc.name} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                      <span className="font-semibold text-primary">{doc.name}</span>
                      <span className="text-right text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">
                        {doc.status}
                        <br />
                        Exp: {doc.expiry}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          }
        >
          <div className="flex flex-wrap gap-2 text-xs">
            {badges.map((badge) => (
              <span key={badge} className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                {badge}
              </span>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article key={service.id} className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                <header>
                  <h3 className="text-lg font-semibold text-primary">{service.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">Completed {service.completed} jobs</p>
                </header>
                <div className="mt-6 space-y-3 text-sm text-slate-600">
                  <p className="flex items-center justify-between">
                    <span>Pricing</span>
                    <span className="font-semibold text-primary">{service.price}</span>
                  </p>
                  <p className="text-xs uppercase tracking-[0.3em] text-primary/70">{service.sla}</p>
                </div>
                <button className="mt-6 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/90">
                  Request availability
                </button>
              </article>
            ))}
          </div>
        </BlueprintSection>

        <BlueprintSection
          eyebrow="Operations"
          title="Coverage, scheduling, and tooling visibility"
          description="Coverage, scheduling, and tooling at a glance before booking."
          aside={
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-primary">Availability windows</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {availability.map((slot) => (
                    <li key={slot.window} className="rounded-2xl border border-slate-100 bg-white p-4">
                      <p className="font-semibold text-primary">{slot.window}</p>
                    <p className="text-xs text-slate-500">{slot.time}</p>
                    <p className="mt-2 text-xs text-slate-500">{slot.notes}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          }
        >
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {toolingAndShop.map((item) => (
              <article key={item.name} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-primary">{item.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </BlueprintSection>

        <BlueprintSection
          eyebrow="Engagement blueprint"
          title="How Jordan delivers regulated projects"
          description="A three-step playbook from kickoff to closeout."
        >
          <ol className="space-y-4 text-sm text-slate-600">
            {engagementWorkflow.map((step) => (
              <li key={step.stage} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{step.stage}</p>
                    <p className="mt-3 text-sm text-slate-600">{step.detail}</p>
                  </div>
                  <span className="rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                    Escrow aligned
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </BlueprintSection>
      </div>
    </div>
  );
}
