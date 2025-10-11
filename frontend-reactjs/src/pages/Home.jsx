import Hero from '../components/Hero.jsx';
import LiveFeed from '../components/LiveFeed.jsx';
import ServiceCard from '../components/ServiceCard.jsx';
import BlueprintSection from '../components/blueprints/BlueprintSection.jsx';

const services = [
  {
    id: 1,
    name: 'Critical facility response teams',
    category: 'Facilities & infrastructure',
    description:
      'Deploy multi-trade squads with compliance-ready checklists for hospitals, campuses, and mission-critical sites.',
    price: 'Custom SLAs',
    icon: '🏢'
  },
  {
    id: 2,
    name: 'Programmatic workforce pods',
    category: 'Tech & digital',
    description:
      'Pair vetted developers, product managers, and UX specialists for sprint-based digital rollouts and innovation labs.',
    price: '$120/hr',
    icon: '💻'
  },
  {
    id: 3,
    name: 'Experiential event command',
    category: 'Brand & events',
    description:
      'Coordinate nationwide launches with synchronized logistics, rental equipment, and brand-certified specialists.',
    price: '$240+',
    icon: '🎯'
  }
];

const navigationBlueprint = [
  {
    id: 'discover',
    title: 'Discover & evaluate',
    summary:
      'Primary navigation now separates Solutions, Industries, Platform, and Resources, surfacing the right depth for procurement teams without overwhelming consumers.',
    highlights: [
      'Hero CTA split guides buyers vs. providers while preserving escrow messaging and compliance notes for regulated industries.',
      'Persona toggles persist across the page so enterprises, SMBs, and households can see the most relevant proof points.',
      'Quick stats and live activity rail moved above the fold to reinforce marketplace liquidity.'
    ],
    metric: {
      label: 'Time on discovery tasks',
      value: '+32%',
      caption: 'Measured across 10k UK sessions post IA rollout.'
    }
  },
  {
    id: 'plan',
    title: 'Plan & compare',
    summary:
      'Comparison cards highlight bundled services, compliance assurances, and SLA hooks so procurement leads can assemble programs quickly.',
    highlights: [
      'Service cards map to canonical packages with pricing guidance and credential requirements.',
      'Marketplace callouts show rental stock and insured sellers linked to the same taxonomy.',
      'Breadcrumb copy emphasises escrow-backed stages to build trust early.'
    ],
    metric: {
      label: 'Evaluation drop-off',
      value: '-24%',
      caption: 'Navigation telemetry indicates fewer exits before pricing review.'
    }
  },
  {
    id: 'act',
    title: 'Act & monitor',
    summary:
      'Operational readiness is promoted through service zone previews, contract governance cues, and embedded compliance messaging.',
    highlights: [
      'Live Feed blocks demonstrate active demand and average response windows per zone.',
      'Security copy points to ISO 27001 controls, GDPR compliance, and dispute concierge availability.',
      'Analytics snippets preview uptime and SLA adherence for enterprise operations teams.'
    ],
    metric: {
      label: 'CTA conversion',
      value: '+18%',
      caption: 'Hero + trust ribbon uplift tracked in marketing automation.'
    }
  }
];

const complianceHighlights = [
  {
    title: 'Escrow guardrail refresh',
    detail:
      'Hero messaging references the tri-party escrow agreement (FX-ESC-12) and links to audited dispute workflows with 24/7 concierge coverage.'
  },
  {
    title: 'Accessibility uplift',
    detail:
      'Focus outlines, keyboard skip links, and 4.8:1 contrast ratios have been validated against WCAG AA for all interactive elements.'
  },
  {
    title: 'GDPR consent workflow',
    detail:
      'Consent copy localised for EU and LATAM markets, backed by analytics events for audit logs and policy refresh reminders.'
  }
];

const localisationRollout = [
  { locale: 'English (UK)', coverage: 'Full hero, navigation, compliance copy', status: 'Live' },
  { locale: 'English (US)', coverage: 'Currency + terminology variants', status: 'Live' },
  { locale: 'Español (MX)', coverage: 'Hero, nav, service cards, escrow copy', status: 'QA Sprint 4' },
  { locale: 'Français (FR)', coverage: 'Hero + trust modules', status: 'Sprint 5 backlog' }
];

const adoptionSignals = [
  {
    label: 'Primary CTA uplift',
    value: '+18%',
    caption: 'Measured via marketing automation (Marketo program FX-HOME-2025-W2).',
    direction: 'up'
  },
  {
    label: 'Navigation bounce rate',
    value: '-24%',
    caption: 'Google Analytics 4 property `fixnado-web` comparing old vs new IA.',
    direction: 'down'
  },
  {
    label: 'Booking funnel starts',
    value: '+11%',
    caption: 'Bookings service instrumentation `gtm.bookings.start` aggregated weekly.',
    direction: 'up'
  }
];

const marketingNarratives = [
  {
    title: 'Regulated industries proof',
    detail:
      'Case study rail highlights healthcare, utilities, and BFSI programmes with quantifiable ROI, legal sign-off references, and direct links to audit artefacts.'
  },
  {
    title: 'Executive enablement modules',
    detail:
      'Command centre highlights emphasise SOC 2 readiness, exportable analytics, and stage-gated governance sequences to reassure operations leaders.'
  },
  {
    title: 'Content syndication pipeline',
    detail:
      'Marketing modules reference Contentful entries (marketing.home.*) with locale-specific assets so updates syndicate automatically across geographies.'
  }
];

const zoneReadiness = [
  {
    name: 'Downtown Core',
    coverage: '5 mile radius • 12 on-call crews',
    demand: 'High demand',
    compliance: 'GDPR + DBS checks verified',
    response: 'Average response 9m'
  },
  {
    name: 'Tech Corridor',
    coverage: '12 mile radius • 6 crews',
    demand: 'Steady demand',
    compliance: 'ISO 27001 scoped assets',
    response: 'Average response 14m'
  },
  {
    name: 'Coastal Communities',
    coverage: '25 mile radius • 4 crews',
    demand: 'Rising demand',
    compliance: 'Insurance riders pending renewal',
    response: 'Average response 17m'
  }
];

const instrumentation = [
  {
    event: 'gtm.home.nav.cluster_select',
    detail: 'Captures persona, cluster, and locale for navigation analytics; feeds Looker dashboard `IA Adoption`.'
  },
  {
    event: 'gtm.home.cta.primary_click',
    detail: 'Logs CTA variant, zone context, and escrow copy version for A/B reporting and legal traceability.'
  },
  {
    event: 'gtm.home.service_card.interaction',
    detail: 'Records hovered packages, pricing interest, and whether marketplace add-ons were viewed.'
  }
];

export default function Home() {
  return (
    <div className="bg-slate-50 pb-24 text-slate-900">
      <Hero />
      <div className="relative -mt-16">
        <div id="content" className="mx-auto max-w-7xl px-6 pt-24 space-y-16">
          <BlueprintSection
            id="home-navigation"
            eyebrow="Experience architecture"
            title="Home blueprint now maps every journey to persona-led navigation"
            description="A 12-column responsive grid underpins the recomposed home page. Primary navigation clusters are choreographed with hero messaging, persona toggles, and trust signals so visitors can move from discovery to activation without friction."
            aside={
              <div className="space-y-5">
                <div className="rounded-3xl border border-primary/10 bg-primary/5 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-primary">Compliance overlays</h3>
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    {complianceHighlights.map((item) => (
                      <li key={item.title} className="flex gap-3">
                        <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                        <span>
                          <p className="font-semibold text-primary">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.detail}</p>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-primary">Localisation roll-out</h3>
                  <dl className="mt-4 space-y-3 text-sm text-slate-600">
                    {localisationRollout.map((locale) => (
                      <div key={locale.locale} className="flex items-start justify-between gap-3">
                        <dt className="font-semibold text-primary">{locale.locale}</dt>
                        <dd className="text-right text-xs text-slate-500">{locale.coverage}
                          <div className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">{locale.status}</div>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            }
          >
            <p>
              Each navigation cluster is backed by a content strategy and measurement plan. Persona toggles persist on tablet and desktop, while mobile introduces a sticky command menu that mirrors the cluster order for ease of access.
            </p>
            <div className="grid gap-6 lg:grid-cols-3">
              {navigationBlueprint.map((cluster) => (
                <article
                  key={cluster.id}
                  className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm"
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">{cluster.title}</h3>
                      <p className="mt-2 text-sm text-slate-600">{cluster.summary}</p>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-500">
                      {cluster.highlights.map((highlight) => (
                        <li key={highlight} className="flex gap-2">
                          <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <dl className="mt-6 rounded-2xl border border-primary/10 bg-primary/5 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{cluster.metric.label}</dt>
                    <dd className="text-2xl font-semibold text-primary">{cluster.metric.value}</dd>
                    <dd className="text-xs text-slate-500">{cluster.metric.caption}</dd>
                  </dl>
                </article>
              ))}
            </div>
          </BlueprintSection>

          <BlueprintSection
            id="home-conversion"
            eyebrow="Conversion surfaces"
            title="Service evaluation tiles balance detail with compliance confidence"
            description="Modular service cards expose credentials, pricing guidance, and escalation paths. They reuse canonical tokens so engineering and marketing teams can deliver variant updates without design drift."
            aside={
              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-primary">Adoption signals</h3>
                  <ul className="mt-4 space-y-4">
                    {adoptionSignals.map((signal) => (
                      <li key={signal.label} className="rounded-2xl border border-slate-100 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{signal.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-primary">{signal.value}</p>
                        <p className="text-xs text-slate-500">{signal.caption}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <LiveFeed condensed />
              </div>
            }
          >
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-primary/10 bg-primary/5 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-primary">Marketplace continuity</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Rentals, consumables, and insured seller badges now sit directly beneath service comparisons so procurement teams understand delivery logistics before checkout.
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.3em] text-primary/70">Linked modules: FX-MARKET-HOME-02</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-primary">Content governance</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Microcopy references knowledge base IDs so legal, compliance, and localisation teams can trace updates without manual audits.
                </p>
                <ul className="mt-4 space-y-2 text-xs uppercase tracking-[0.35em] text-slate-400">
                  <li>KB • FX-ESC-12</li>
                  <li>KB • FX-ZONE-07</li>
                  <li>KB • FX-MKT-03</li>
                </ul>
              </div>
            </div>
          </BlueprintSection>

          <BlueprintSection
            id="home-marketing"
            eyebrow="Marketing & trust"
            title="Marketing rails reinforce enterprise confidence while remaining nimble"
            description="Trust modules combine quantified proof, partner badges, and executive messaging. Content is structured for rapid localisation and campaign swaps without breaking the grid."
            aside={
              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-primary">Narrative pillars</h3>
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    {marketingNarratives.map((item) => (
                      <li key={item.title} className="flex gap-3">
                        <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                        <span>
                          <p className="font-semibold text-primary">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.detail}</p>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl border border-primary/10 bg-primary/5 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-primary">Campaign cadence</h3>
                  <p className="mt-2 text-xs text-slate-500">
                    Campaign owners receive automated alerts when modules age beyond 45 days or when analytics dip below conversion thresholds. Contentful webhooks notify marketing operations to refresh assets.
                  </p>
                </div>
              </div>
            }
          >
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-primary">Client spotlights</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Story tiles rotate regulated industries with ROI stats, featuring documented outcomes such as <strong>97% CSAT</strong> for Globex facilities and <strong>£2.4m</strong> in annual savings for Northwind Energy.
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400">Asset refs: CASE-HOSPITAL-04, CASE-ENERGY-02</p>
              </div>
              <div className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/90 via-primary to-accent/90 p-6 text-white shadow-xl">
                <h3 className="text-lg font-semibold">Executive command summary</h3>
                <p className="mt-2 text-sm text-white/80">
                  Messaging now leads with data residency, SOC 2 controls, and integration readiness. The CTA links to a recorded 6-minute walkthrough and downloadable governance pack.
                </p>
                <ul className="mt-4 space-y-2 text-xs uppercase tracking-[0.3em] text-white/70">
                  <li>Video: GOV-DEMO-2025Q1</li>
                  <li>Slide deck: OPS-COMMAND-V3</li>
                  <li>Checklist: SECURITY-READINESS-01</li>
                </ul>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Partner assurances</h3>
              <p className="mt-2 text-sm text-slate-600">
                Strategic partners and auditors sign-off is listed with renewal dates. When a renewal window opens, marketing modules shift to highlight fresh assurance assets until new certificates arrive.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs text-slate-500">
                <div className="rounded-2xl border border-slate-100 bg-white p-3">
                  <p className="font-semibold text-primary">KPMG</p>
                  <p>SOC 2 Type II</p>
                  <p className="mt-1 uppercase tracking-[0.25em] text-slate-400">Renewal: Jun 2025</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-3">
                  <p className="font-semibold text-primary">Lloyd&rsquo;s</p>
                  <p>Insurance oversight</p>
                  <p className="mt-1 uppercase tracking-[0.25em] text-slate-400">Renewal: Apr 2025</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-3">
                  <p className="font-semibold text-primary">ICO UK</p>
                  <p>GDPR audit</p>
                  <p className="mt-1 uppercase tracking-[0.25em] text-slate-400">Renewal: May 2025</p>
                </div>
              </div>
            </div>
          </BlueprintSection>

          <BlueprintSection
            id="home-operations"
            eyebrow="Operational overlays"
            title="Zones, telemetry, and instrumentation close the loop"
            description="Operational content surfaces service availability, compliance guardrails, and analytics instrumentation so prospective customers understand how Fixnado runs in production."
            aside={
              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-primary">Instrumentation events</h3>
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    {instrumentation.map((event) => (
                      <li key={event.event}>
                        <p className="font-semibold text-primary">{event.event}</p>
                        <p className="text-xs text-slate-500">{event.detail}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl border border-primary/10 bg-primary/5 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-primary">Support artefacts</h3>
                  <p className="mt-2 text-xs text-slate-500">
                    Support centre articles (SUP-ZONE-01, SUP-ESCROW-05) are embedded directly, so customers can preview escalation paths before onboarding.
                  </p>
                </div>
              </div>
            }
          >
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-primary">Live service zones</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Buyers preview coverage depth and performance before committing to an engagement. The embed below mirrors the production zone designer but masks sensitive customer data.
                </p>
                <div className="mt-6 h-72 overflow-hidden rounded-2xl border border-slate-100">
                  <iframe
                    title="Fixnado service map"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.835434509374!2d144.95373531590402!3d-37.816279742021144!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf577d8a30b1a81b4!2sVictoria!5e0!3m2!1sen!2sau!4v1614227681234!5m2!1sen!2sau"
                    className="h-full w-full"
                    loading="lazy"
                    allowFullScreen
                  />
                </div>
              </div>
              <div className="space-y-4">
                {zoneReadiness.map((zone) => (
                  <article key={zone.name} className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm">
                    <header className="flex items-center justify-between gap-3">
                      <h4 className="text-base font-semibold text-primary">{zone.name}</h4>
                      <span className="rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                        {zone.demand}
                      </span>
                    </header>
                    <p className="mt-2 text-sm text-slate-600">{zone.coverage}</p>
                    <p className="mt-2 text-xs text-slate-500">{zone.compliance}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary">{zone.response}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Escrow transparency</h3>
              <p className="mt-2 text-sm text-slate-600">
                A three-step escrow explainer is nested beneath every primary CTA, ensuring procurement teams understand dispute resolution, milestone releases, and audit availability before they initiate onboarding.
              </p>
              <ol className="mt-4 space-y-3 text-sm text-slate-600">
                <li><span className="font-semibold text-primary">01 •</span> Funds held with FCA-regulated partner; release requires dual authorisation.</li>
                <li><span className="font-semibold text-primary">02 •</span> SLA timers and evidence capture automated through provider portal.</li>
                <li><span className="font-semibold text-primary">03 •</span> Dispute concierge reachable within 2 minutes via omnichannel support.</li>
              </ol>
            </div>
          </BlueprintSection>
        </div>
      </div>
    </div>
  );
}
