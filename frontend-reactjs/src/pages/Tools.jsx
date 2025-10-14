import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/blueprints/PageHeader.jsx';
import BlueprintSection from '../components/blueprints/BlueprintSection.jsx';
import ToolsShowcase from '../components/tools/ToolsShowcase.jsx';
import usePersona from '../hooks/usePersona.js';
import { useFeatureToggle } from '../providers/FeatureToggleProvider.jsx';
import { getBusinessFront, getProviderDashboard } from '../api/panelClient.js';

const ALLOWED_PERSONAS = ['provider', 'serviceman'];
const DEFAULT_SLUG = 'metro-power-services';

function normaliseCondition(condition) {
  if (!condition) return null;
  const value = String(condition).toLowerCase();
  if (value.includes('calibr')) return 'calibrated';
  if (value.includes('maint')) return 'maintenance_due';
  if (value.includes('service')) return 'service';
  if (value.includes('retir')) return 'retired';
  return null;
}

function formatCurrency(amount, currency = 'GBP') {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(amount);
  } catch (error) {
    console.warn('Failed to format currency', error);
    return `${currency} ${amount}`;
  }
}

const logisticsPlaybook = [
  {
    id: 'telemetry',
    title: 'Telemetry heartbeat',
    detail:
      'Asset trackers publish battery, vibration, and geolocation every 90 seconds. Offline fallbacks buffer to encrypted SD and alert the NOC when packets miss the SLA.',
    owner: 'Network operations'
  },
  {
    id: 'compliance',
    title: 'Compliance pack automation',
    detail:
      'COSHH sheets, calibration certificates, and insurance riders attach automatically to bookings. Expired artefacts trigger legal escalations and block dispatch.',
    owner: 'Risk & compliance'
  },
  {
    id: 'last-mile',
    title: 'Last-mile dispatch orchestration',
    detail:
      'Dynamic routing coordinates depot, courier, and onsite crews with live ETAs. Heatmaps flag congestion so bookings can pre-emptively re-time windows.',
    owner: 'Logistics control'
  }
];

const governanceControls = [
  {
    id: 'access',
    title: 'Role-scoped access',
    caption: 'Provider + Serviceman',
    detail: 'Tools hub enforces persona-scoped access tokens. Audit logs append booking IDs, hardware IDs, and user signatures.'
  },
  {
    id: 'escrow',
    title: 'Escrow alignment',
    caption: 'Automation ready',
    detail: 'Reservations require escrow milestones before release. Exceptions raise a finance approval task in the control tower.'
  },
  {
    id: 'resilience',
    title: 'Resilience posture',
    caption: 'Four-zone active-active',
    detail: 'Telemetry brokers are deployed in four regions with automatic failover. Heartbeat gaps above 45 seconds escalate to SRE duty.'
  }
];

const integrationPipelines = [
  {
    id: 'sap',
    title: 'SAP Fieldglass',
    detail: 'Syncs purchase orders, contract terms, and approval routing so enterprise clients can reconcile tool spend instantly.'
  },
  {
    id: 'azure',
    title: 'Azure IoT Hub',
    detail: 'Ingests torque sensor feeds and location telemetry for predictive maintenance dashboards and anomaly detection.'
  },
  {
    id: 'servicenow',
    title: 'ServiceNow CSM',
    detail: 'Opens remediation cases with evidence packs when telemetry flags misuse or safety interlocks trip.'
  }
];

const readinessChecklist = [
  {
    id: 'calibration',
    label: 'Calibration certificates',
    status: 'Up to date',
    notes: '96% completed within SLA; stragglers auto-paged to depot managers.'
  },
  {
    id: 'insurance',
    label: 'Insurance riders',
    status: 'Verified',
    notes: 'Coverage synced nightly with insurer webhooks and mirrored in escrow contract terms.'
  },
  {
    id: 'training',
    label: 'Crew training & toolbox talks',
    status: 'Scheduled',
    notes: 'Servicemen receive monthly toolbox briefs; completions tracked in LMS with audit exports.'
  }
];

export default function Tools() {
  const { persona, status, setPersona } = usePersona({ allowedPersonas: ALLOWED_PERSONAS });
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({ utilisation: 0, uptime: 0.0, ready: 0, total: 0 });
  const [interaction, setInteraction] = useState(null);

  const {
    enabled: toolsEnabled,
    loading: toggleLoading,
    reason: toggleReason,
    refresh: refreshToggle
  } = useFeatureToggle('tools-workbench', {
    scope: persona ?? 'provider',
    fallback: ALLOWED_PERSONAS.includes(persona),
    allowStaging: import.meta.env.MODE !== 'production'
  });

  const allowed = status.allowed && toolsEnabled !== false;

  const hydrateInventory = useCallback((profile, dashboard) => {
    const tools = profile?.tools ?? [];
    const depotLocations = profile?.hero?.locations ?? [];
    const utilisation = dashboard?.metrics?.utilisation ?? 0.78;

    const mapped = tools.map((tool, index) => {
      const condition = normaliseCondition(tool.condition) ?? 'service';
      const compliance = tool.compliance?.length
        ? tool.compliance
        : ['PAT', 'LOLER', index % 2 === 0 ? 'RAMS' : 'Risk brief'];
      const location = tool.location || depotLocations[index % depotLocations.length] || 'UK-wide depot';
      const availabilityScore = tool.availabilityScore ?? Math.min(0.95, 0.55 + (index % 5) * 0.09);
      const rentalRateLabel =
        tool.rentalRate != null
          ? `${formatCurrency(tool.rentalRate, tool.rentalRateCurrency)} / day`
          : 'Included in contract';

      return {
        id: tool.id ?? `tool-${index}`,
        name: tool.name,
        category: tool.category || 'Specialist tools',
        description:
          tool.description ||
          'Certified and calibrated equipment with documented inspection history and digital access logs.',
        rentalRateLabel,
        utilisation: tool.utilisation ?? utilisation,
        nextService: tool.nextService || 'Within 14 days',
        availabilityScore,
        condition,
        compliance,
        location
      };
    });

    const uniqueCategories = Array.from(
      new Map(
        mapped.map((item) => [
          item.category,
          {
            id: item.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            label: item.category
          }
        ])
      ).values()
    );

    const readyTools = mapped.filter((item) => item.condition !== 'maintenance_due' && item.condition !== 'retired').length;

    setInventory(mapped);
    setCategories(uniqueCategories);
    setMetrics({
      utilisation,
      uptime: dashboard?.telemetry?.uptime ?? 99.2,
      ready: readyTools,
      total: tools.length
    });
  }, []);

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }

    const abort = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [profileResult, dashboardResult] = await Promise.all([
          getBusinessFront(DEFAULT_SLUG, { signal: abort.signal }),
          getProviderDashboard({ signal: abort.signal })
        ]);
        hydrateInventory(profileResult.data, dashboardResult.data);
      } catch (caught) {
        if (abort.signal.aborted) {
          return;
        }
        console.error('Failed to load tools hub data', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to load tools hub');
      } finally {
        if (!abort.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => abort.abort();
  }, [allowed, hydrateInventory, persona]);

  const filteredInventory = useMemo(() => {
    if (!activeCategory) return inventory;
    return inventory.filter((item) => item.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') === activeCategory);
  }, [inventory, activeCategory]);

  const headerMeta = useMemo(
    () => [
      {
        label: 'Tools ready',
        value: metrics.total > 0 ? `${metrics.ready}/${metrics.total}` : '0',
        caption: 'Dispatchable this hour',
        emphasis: true
      },
      {
        label: 'Fleet uptime',
        value: `${metrics.uptime.toFixed(1)}%`,
        caption: 'Telemetry heartbeat'
      },
      {
        label: 'Avg. utilisation',
        value: `${Math.round((metrics.utilisation ?? 0) * 100)}%`,
        caption: 'Trailing 30 days'
      }
    ],
    [metrics]
  );

  const handleReserve = useCallback((tool) => {
    setInteraction({ type: 'reserve', tool });
  }, []);

  const handleInspect = useCallback((tool) => {
    setInteraction({ type: 'inspect', tool });
  }, []);

  const closeInteraction = useCallback(() => {
    setInteraction(null);
  }, []);

  const accessGate = !status.allowed
    ? {
        title: 'Switch persona to continue',
        description:
          'Tooling orchestration is reserved for provider and serviceman personas. Switch persona to review live inventory, compliance, and telemetry.',
        actionLabel: 'Switch to provider',
        onAction: () => setPersona('provider')
      }
    : toolsEnabled === false && !toggleLoading
      ? {
          title: 'Tools hub disabled',
          description:
            'The tools workbench is currently disabled for your cohort. Refresh toggles or contact operations to request access.',
          actionLabel: 'Retry access check',
          onAction: () =>
            refreshToggle({ force: true }).catch((caught) => {
              console.error('Failed to refresh tools toggle', caught);
            })
        }
      : null;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <PageHeader
        eyebrow="Operations & logistics"
        title="Tools workbench"
        description="Synchronise depot availability, compliance guardrails, and telemetry-backed tooling in one command surface."
        breadcrumbs={[
          { label: 'Experience', to: '/' },
          { label: 'Tools & rentals' }
        ]}
        actions={[
          { label: 'Download SOP pack', to: '/docs/tools-sop-pack.pdf', variant: 'secondary' },
          { label: 'Request depot onboarding', to: '/register', variant: 'primary' }
        ]}
        meta={headerMeta}
      />

      <div className="mx-auto max-w-7xl px-6 pt-16 space-y-16">
        {accessGate ? (
          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-primary">{accessGate.title}</h2>
            <p className="mt-3 text-sm text-slate-600">{accessGate.description}</p>
            <button
              type="button"
              onClick={accessGate.onAction}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
            >
              {accessGate.actionLabel}
            </button>
            {toggleReason ? (
              <p className="mt-4 text-xs uppercase tracking-[0.35em] text-slate-400">Reason: {toggleReason}</p>
            ) : null}
          </div>
        ) : (
          <>
            <ToolsShowcase
              items={filteredInventory}
              loading={loading}
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              onHire={handleReserve}
              onInspect={handleInspect}
              persona={persona}
            />

            {error ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700 shadow-sm">
                {error}
              </div>
            ) : null}

            <BlueprintSection
              id="logistics"
              eyebrow="Logistics playbook"
              title="Operational guardrails for depot-to-site deployments"
              description="Every booking inherits orchestration templates so the right tool is unlocked, inspected, and delivered ahead of the crew."
            >
              <div className="grid gap-6 md:grid-cols-3">
                {logisticsPlaybook.map((entry) => (
                  <article key={entry.id} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-primary">{entry.title}</h3>
                    <p className="mt-3 text-sm text-slate-600">{entry.detail}</p>
                    <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400">{entry.owner}</p>
                  </article>
                ))}
              </div>
            </BlueprintSection>

            <BlueprintSection
              id="governance"
              eyebrow="Governance"
              title="Access, escrow, and resilience baked into the workflow"
              description="Security controls ensure only authorised personas reserve or release tooling. Escrow, insurance, and audit logs mirror every action."
            >
              <div className="grid gap-6 md:grid-cols-3">
                {governanceControls.map((control) => (
                  <article key={control.id} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{control.caption}</p>
                    <h3 className="mt-2 text-lg font-semibold text-primary">{control.title}</h3>
                    <p className="mt-3 text-sm text-slate-600">{control.detail}</p>
                  </article>
                ))}
              </div>
            </BlueprintSection>

            <BlueprintSection
              id="integrations"
              eyebrow="Integrations"
              title="Connect the toolchain to enterprise systems"
              description="Pre-built connectors keep finance, risk, and operations aligned. Pipelines stream telemetry, contract data, and incident reports in real time."
            >
              <div className="grid gap-6 md:grid-cols-3">
                {integrationPipelines.map((pipeline) => (
                  <article key={pipeline.id} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-primary">{pipeline.title}</h3>
                    <p className="mt-3 text-sm text-slate-600">{pipeline.detail}</p>
                  </article>
                ))}
              </div>
            </BlueprintSection>

            <BlueprintSection
              id="readiness"
              eyebrow="Launch readiness"
              title="Every depot signed off for go-live"
              description="Operational readiness dashboards track calibration, insurance, and crew readiness so go-lives stay on schedule."
            >
              <div className="grid gap-4 md:grid-cols-3">
                {readinessChecklist.map((item) => (
                  <article key={item.id} className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-primary">{item.label}</h3>
                    <p className="mt-2 text-sm text-slate-600">{item.notes}</p>
                    <p className="mt-4 text-xs uppercase tracking-[0.3em] text-emerald-500">{item.status}</p>
                  </article>
                ))}
              </div>
            </BlueprintSection>
          </>
        )}
      </div>

      {interaction ? (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-3xl px-6 pb-8">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-primary/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {interaction.type === 'reserve' ? 'Reservation workflow' : 'Telemetry stream'}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-primary">{interaction.tool.name}</h3>
              </div>
              <button
                type="button"
                onClick={closeInteraction}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-primary hover:text-primary"
                aria-label="Close interaction panel"
              >
                ×
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {interaction.type === 'reserve'
                ? 'Escrow milestones and insurance riders have been pre-loaded. Confirm drop-off and pick-up windows to trigger courier dispatch.'
                : 'Live telemetry feed includes vibration, torque, geofence compliance, and battery telemetry. Alerts will raise to NOC when thresholds breach.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={closeInteraction}
                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
              >
                {interaction.type === 'reserve' ? 'Confirm reservation' : 'Subscribe to alerts'}
              </button>
              <button
                type="button"
                onClick={closeInteraction}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

