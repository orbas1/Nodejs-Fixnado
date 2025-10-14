import { Link } from 'react-router-dom';
import {
  ArrowLongRightIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const stats = [
  {
    label: 'Active enterprise programmes',
    value: '186',
    caption: 'Cross-sector deployments orchestrated in 2024.'
  },
  {
    label: 'Verified field specialists',
    value: '9.8k',
    caption: 'Tradespeople, engineers, and incident responders vetted annually.'
  },
  {
    label: 'Escrow-secured payouts',
    value: '£142m',
    caption: 'Payments governed by tri-party escrow with live monitoring.'
  },
  {
    label: 'Global response centres',
    value: '5',
    caption: 'Follow-the-sun command centres for mission-critical cover.'
  }
];

const valuePillars = [
  {
    title: 'Operational discipline',
    description:
      'Runbooks, redundancy testing, and ISO-aligned playbooks ensure the marketplace behaves predictably in every territory.',
    icon: CheckCircleIcon
  },
  {
    title: 'People first',
    description:
      'We invest in credentialing, wellbeing, and fair access programmes to sustain a resilient, motivated workforce.',
    icon: UsersIcon
  },
  {
    title: 'Security by design',
    description:
      'Encryption, continuous monitoring, and RBAC guardrails are embedded across our platform and operational tooling.',
    icon: ShieldCheckIcon
  }
];

const leadershipTeam = [
  {
    name: 'Amelia Hart',
    role: 'Chief Executive Officer',
    bio: '15 years building regulated marketplaces for utilities and emergency response networks.',
    focus: 'Strategy & trust'
  },
  {
    name: 'Noah Odum',
    role: 'Chief Operations Officer',
    bio: 'Former RAF logistics lead focused on resilient field operations and supply chain parity.',
    focus: 'Global operations'
  },
  {
    name: 'Priya Banerjee',
    role: 'Chief Technology Officer',
    bio: 'Scaled multi-cloud orchestration at fintech and healthcare firms with ISO 27001 and SOC 2 leadership.',
    focus: 'Platform integrity'
  },
  {
    name: 'James Osei',
    role: 'Chief Customer Officer',
    bio: 'Previously led enterprise success for pan-European facilities programmes.',
    focus: 'Customer resilience'
  }
];

const timeline = [
  {
    year: '2019',
    title: 'Fixnado founded',
    description: 'Focused on closing the gap between on-demand repairs and enterprise-grade governance.'
  },
  {
    year: '2021',
    title: 'Escrow & compliance launch',
    description: 'Introduced tri-party escrow, digital credentials, and dispute concierge coverage.'
  },
  {
    year: '2023',
    title: 'Mobile parity achieved',
    description: 'Released the Fixnado mobile suite with offline resilience and operational parity.'
  },
  {
    year: '2024',
    title: 'Global response network',
    description: 'Opened command centres in Manchester, Austin, Singapore, Toronto, and Cape Town.'
  }
];

const trustControls = [
  {
    label: 'ISO 27001 & SOC 2 Type II',
    detail: 'Audited annually with independent penetration testing and continuous control monitoring.'
  },
  {
    label: 'GDPR & HIPAA ready',
    detail: 'Regional data residency, consent orchestration, and encrypted PHI pathways for healthcare partners.'
  },
  {
    label: 'Escrow & risk concierge',
    detail: 'Dedicated dispute concierge, ring-fenced escrow pools, and automated payout verification.'
  }
];

const globalOffices = [
  {
    region: 'Manchester (HQ)',
    focus: 'Marketplace command, talent operations, and trust office.'
  },
  {
    region: 'Austin',
    focus: 'US enterprise delivery, energy sector programmes, and fleet logistics.'
  },
  {
    region: 'Singapore',
    focus: 'APAC compliance, maritime partnerships, and supplier onboarding.'
  },
  {
    region: 'Toronto',
    focus: 'North American dispatch, bilingual support, and analytics innovation hub.'
  },
  {
    region: 'Cape Town',
    focus: '24/7 command coverage, resiliency drills, and mobile QA lab.'
  }
];

const governanceWorkstreams = [
  'Quarterly resilience drills across every command centre.',
  'Continuous vulnerability scanning and dependency hygiene.',
  'Role-based controls with policy-as-code enforcement.',
  'Dedicated data protection officer and privacy guild.'
];

export default function About() {
  return (
    <div className="bg-slate-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-accent text-white">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_55%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 flex flex-col gap-16 lg:gap-20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.4em] text-white/70">ABOUT FIXNADO</p>
              <h1 className="mt-4 text-4xl sm:text-5xl font-semibold leading-tight">
                Building the trusted infrastructure for complex fix and response programmes
              </h1>
              <p className="mt-6 text-lg text-white/80 leading-relaxed">
                Fixnado brings together vetted specialists, resilient logistics, and compliance-ready workflows so enterprises,
                public sector teams, and households can activate solutions with confidence. We orchestrate every stage from
                intake to resolution with enterprise guardrails baked in.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-primary font-semibold shadow-lg shadow-primary/20 transition hover:shadow-xl hover:-translate-y-0.5"
                >
                  Create an enterprise account
                  <ArrowLongRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/communications"
                  className="inline-flex items-center justify-center rounded-full border border-white/60 px-6 py-3 text-white font-semibold transition hover:bg-white/10"
                >
                  Talk to our command centre
                </Link>
              </div>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-4 sm:gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur p-6">
                  <p className="text-3xl font-semibold">{stat.value}</p>
                  <p className="mt-3 text-sm font-medium text-white/80">{stat.label}</p>
                  <p className="mt-2 text-xs text-white/70 leading-relaxed">{stat.caption}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3" id="mission">
            {valuePillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article key={pillar.title} className="rounded-3xl bg-white/10 backdrop-blur p-6 border border-white/15">
                  <Icon className="h-10 w-10 text-white" aria-hidden="true" />
                  <h2 className="mt-5 text-xl font-semibold">{pillar.title}</h2>
                  <p className="mt-3 text-sm text-white/80 leading-relaxed">{pillar.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 grid gap-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-10">
          <div className="rounded-3xl bg-white shadow-xl shadow-slate-200/60 p-8">
            <h2 className="text-2xl font-semibold text-primary">Our mission</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              We are obsessed with reliability. Our mission is to connect demand and supply in seconds while upholding the
              standards expected from heavily regulated programmes. Every workflow is designed with resilience, transparency,
              and human support in mind so that critical incidents are resolved before they escalate.
            </p>
          </div>
          <div className="rounded-3xl bg-secondary p-8 border border-slate-200">
            <h3 className="text-xl font-semibold text-primary">Governance workstreams</h3>
            <ul className="mt-6 space-y-4 text-sm text-slate-700">
              {governanceWorkstreams.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircleIcon className="mt-1 h-5 w-5 text-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="rounded-3xl bg-white shadow-xl shadow-slate-200/60 p-8">
          <h2 className="text-2xl font-semibold text-primary">Leadership collective</h2>
          <p className="mt-4 text-sm text-slate-600">
            Each leader is accountable for programme resilience, regulatory posture, and customer trust across their domain.
          </p>
          <div className="mt-8 grid gap-6">
            {leadershipTeam.map((leader) => (
              <div key={leader.name} className="rounded-2xl border border-slate-100 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-primary">{leader.name}</p>
                    <p className="text-sm text-accent font-medium">{leader.role}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-secondary px-4 py-1 text-xs font-semibold text-primary">
                    {leader.focus}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">{leader.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20" id="trust">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-primary/70">TRUST CENTRE</p>
              <h2 className="mt-3 text-3xl font-semibold text-primary">Enterprise-grade assurance baked into every workflow</h2>
            </div>
            <Link to="/communications" className="inline-flex items-center text-accent font-semibold">
              Request compliance pack
              <ArrowLongRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {trustControls.map((control) => (
              <article key={control.label} className="rounded-3xl border border-slate-200 p-6 shadow-sm">
                <ShieldCheckIcon className="h-8 w-8 text-accent" aria-hidden="true" />
                <h3 className="mt-5 text-xl font-semibold text-primary">{control.label}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{control.detail}</p>
              </article>
            ))}
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl bg-secondary p-8 border border-slate-200">
              <h3 className="text-lg font-semibold text-primary">Zero trust architecture</h3>
              <p className="mt-4 text-sm text-slate-600">
                All internal tools enforce device posture, MFA, and least-privilege scopes. Session telemetry is audited in real
                time and anomalies escalate to our command centre within minutes.
              </p>
            </div>
            <div className="rounded-3xl bg-primary text-white p-8">
              <h3 className="text-lg font-semibold">Enterprise integrations</h3>
              <p className="mt-4 text-sm text-white/80">
                SOC-compliant APIs, SCIM user provisioning, and SIEM-ready audit feeds ensure Fixnado slots neatly into your
                existing technology stack.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20" id="careers">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-primary/70">OUR STORY</p>
            <h2 className="mt-4 text-3xl font-semibold text-primary">A trajectory rooted in operational excellence</h2>
            <p className="mt-6 text-base text-slate-600 leading-relaxed">
              Since day one we have partnered with safety-critical industries. Our cadence of iteration is tied directly to live
              telemetry: when responders need faster coverage or procurement teams demand deeper compliance evidence, our teams
              respond in weeks, not quarters.
            </p>
            <div className="mt-10 flex flex-col gap-6">
              {timeline.map((item) => (
                <div key={item.year} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-semibold">
                      {item.year}
                    </span>
                    <span className="mt-1 h-full w-px bg-slate-200" aria-hidden="true" />
                  </div>
                  <div className="pt-2">
                    <h3 className="text-lg font-semibold text-primary">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-white shadow-xl shadow-slate-200/60 p-8">
            <h3 className="text-xl font-semibold text-primary">Join the team</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              We hire operators, engineers, designers, and field programme leads across every region. Parity between our web and
              mobile experiences is non-negotiable, and we rely on distributed squads to ship with quality.
            </p>
            <ul className="mt-6 space-y-4 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <UsersIcon className="mt-1 h-5 w-5 text-accent" aria-hidden="true" />
                <span>Hybrid teams with regional command hubs and remote-first collaboration.</span>
              </li>
              <li className="flex items-start gap-3">
                <GlobeAltIcon className="mt-1 h-5 w-5 text-accent" aria-hidden="true" />
                <span>Opportunities across product, engineering, operations, and partner success.</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheckIcon className="mt-1 h-5 w-5 text-accent" aria-hidden="true" />
                <span>Robust onboarding with compliance, security, and wellbeing support.</span>
              </li>
            </ul>
            <Link
              to="/register/company"
              className="mt-8 inline-flex items-center rounded-full bg-primary px-5 py-3 text-white font-semibold shadow-lg shadow-primary/20 transition hover:-translate-y-0.5"
            >
              Explore open programmes
              <ArrowLongRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="text-sm uppercase tracking-[0.3em] text-primary/70">GLOBAL FOOTPRINT</p>
                <h2 className="mt-4 text-3xl font-semibold text-primary">Follow-the-sun coverage with human command oversight</h2>
                <p className="mt-4 text-base text-slate-600 leading-relaxed">
                  Our command centres coordinate global programmes with redundancy across time zones. Teams meet twice daily to
                  review incidents, customer sentiment, and SLA performance to keep every booking on track.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {globalOffices.map((office) => (
                  <div key={office.region} className="rounded-2xl bg-secondary p-5 border border-slate-200">
                    <div className="flex items-center gap-3 text-primary">
                      <BuildingOffice2Icon className="h-6 w-6" aria-hidden="true" />
                      <p className="font-semibold">{office.region}</p>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">{office.focus}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-slate-900 py-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(31,78,216,0.35),transparent_55%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-3xl font-semibold">Ready for launch</h2>
                <p className="mt-4 text-base text-white/80 leading-relaxed">
                  Every Fixnado workflow has enterprise launch-readiness sign-off. Our teams audit parity across web and mobile,
                  validate security controls, and rehearse escalation paths so your programmes can go live without hesitation.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Parity assurance</h3>
                  <p className="mt-3 text-sm text-white/80">
                    UX, accessibility, and logic flows mirror the web experience for every mobile release.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
                  <h3 className="text-lg font-semibold">Security posture</h3>
                  <p className="mt-3 text-sm text-white/80">
                    Continuous monitoring, rapid patching, and secret rotation underpin our deployment cadence.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                to="/dashboards"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-primary font-semibold shadow-lg shadow-primary/25 transition hover:-translate-y-0.5"
              >
                Explore live dashboards
                <ArrowLongRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/communications"
                className="inline-flex items-center justify-center rounded-full border border-white/50 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Schedule readiness review
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
