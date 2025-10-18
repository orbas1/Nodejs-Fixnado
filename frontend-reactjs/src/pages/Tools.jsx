import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/blueprints/PageHeader.jsx';
import ToolsShowcase from '../components/tools/ToolsShowcase.jsx';
import usePersona from '../hooks/usePersona.js';
import { useFeatureToggle } from '../providers/FeatureToggleProvider.jsx';
import { getBusinessFront, getProviderDashboard } from '../api/panelClient.js';

const ALLOWED_PERSONAS = ['provider', 'serviceman'];
const DEFAULT_SLUG = 'metro-power-services';
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1529429617124-aee7a16be1e7?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1600&q=80'
];
const FALLBACK_VIDEO = 'https://cdn.coverr.co/videos/coverr-construction-site-2650/1080p.mp4';

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
  const safeAmount = Number(amount);
  if (!Number.isFinite(safeAmount)) {
    return null;
  }

  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(safeAmount);
  } catch (error) {
    console.warn('Failed to format currency', error);
    return `${currency} ${safeAmount}`;
  }
}

function collectMedia(tool, index) {
  const gallerySources = [
    tool?.media?.primary?.url,
    tool?.media?.cover?.url,
    tool?.photo?.url,
    tool?.imageUrl,
    tool?.heroImage,
    ...(Array.isArray(tool?.media?.gallery) ? tool.media.gallery.map((item) => item?.url) : []),
    ...(Array.isArray(tool?.gallery) ? tool.gallery.map((item) => (typeof item === 'string' ? item : item?.url)) : []),
    ...(Array.isArray(tool?.images) ? tool.images.map((item) => (typeof item === 'string' ? item : item?.url)) : [])
  ].filter((url) => typeof url === 'string' && url.length > 8);

  const uniqueGallery = Array.from(new Set(gallerySources));
  const heroImage = uniqueGallery[0] ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  const gallery = [heroImage, ...uniqueGallery.slice(1)];

  const videoSources = [
    tool?.media?.video?.url,
    tool?.media?.primaryVideo?.url,
    tool?.videoUrl,
    tool?.video?.url,
    tool?.demoVideo
  ].filter((url) => typeof url === 'string' && url.length > 8);

  const heroVideo = videoSources[0] ?? FALLBACK_VIDEO;

  return { heroImage, gallery, heroVideo };
}

function derivePricing(tool) {
  const tiers = Array.isArray(tool?.pricing?.tiers)
    ? tool.pricing.tiers
    : Array.isArray(tool?.hirePackages)
      ? tool.hirePackages
      : Array.isArray(tool?.packages)
        ? tool.packages
        : [];

  const parsedTiers = tiers
    .map((tier, index) => {
      const amount = tier?.amount ?? tier?.price ?? tier?.cost ?? tier?.value;
      const currency = tier?.currency ?? tool?.rentalRateCurrency ?? 'GBP';
      const label = tier?.label ?? tier?.name ?? tier?.duration ?? tier?.id ?? `Tier ${index + 1}`;
      const priceLabel = formatCurrency(amount, currency);
      if (!priceLabel) {
        return null;
      }
      return {
        id: tier?.id ?? `tier-${index}`,
        label,
        value: priceLabel
      };
    })
    .filter(Boolean);

  if (parsedTiers.length > 0) {
    return parsedTiers;
  }

  const baseRate = tool?.rentalRate;
  if (baseRate == null) {
    return [];
  }

  const currency = tool?.rentalRateCurrency ?? 'GBP';
  const daily = formatCurrency(baseRate, currency);
  const weekly = formatCurrency(tool?.weeklyRate ?? baseRate * 4.5, currency);
  const monthly = formatCurrency(tool?.monthlyRate ?? baseRate * 4.5 * 4, currency);

  return [
    daily ? { id: 'day', label: 'Day', value: daily } : null,
    weekly ? { id: 'week', label: 'Week', value: weekly } : null,
    monthly ? { id: 'month', label: 'Month', value: monthly } : null
  ].filter(Boolean);
}

export default function Tools() {
  const { persona, status, setPersona } = usePersona({ allowedPersonas: ALLOWED_PERSONAS });
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({ utilisation: 0, uptime: 0.0, ready: 0, total: 0 });
  const [interaction, setInteraction] = useState(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [highlightId, setHighlightId] = useState(null);

  const {
    enabled: toolsEnabled,
    loading: toggleLoading,
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
      const condition = normaliseCondition(tool?.condition) ?? 'service';
      const compliance = tool?.compliance?.length
        ? tool.compliance
        : ['PAT', 'LOLER', index % 2 === 0 ? 'RAMS' : 'Risk'];
      const location =
        tool?.location || depotLocations[index % Math.max(depotLocations.length, 1)] || 'UK depot';
      const availabilityScore = tool?.availabilityScore ?? Math.min(0.95, 0.6 + (index % 5) * 0.08);
      const rentalRateLabel =
        tool?.rentalRate != null
          ? `${formatCurrency(tool.rentalRate, tool?.rentalRateCurrency)} / day`
          : tool?.includedLabel ?? 'Included';
      const { heroImage, gallery, heroVideo } = collectMedia(tool, index);
      const pricing = derivePricing(tool);

      return {
        id: tool?.id ?? `tool-${index}`,
        name: tool?.name ?? 'Tool',
        category: tool?.category || 'Equipment',
        rentalRateLabel,
        utilisation: tool?.utilisation ?? utilisation,
        nextService: tool?.nextService || 'Within 14 days',
        availabilityScore,
        condition,
        compliance,
        location,
        pricing,
        heroImage,
        gallery,
        heroVideo
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
        setError('Load failed');
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

  const firstReadyTool = useMemo(() => {
    if (!filteredInventory.length) {
      return null;
    }

    return (
      filteredInventory.find((item) => item.condition !== 'maintenance_due' && item.condition !== 'retired') ??
      filteredInventory[0]
    );
  }, [filteredInventory]);

  useEffect(() => {
    if (!highlightId && firstReadyTool) {
      setHighlightId(firstReadyTool.id);
    }
  }, [firstReadyTool, highlightId]);

  const highlightTool = useMemo(() => {
    if (!inventory.length) {
      return null;
    }
    return inventory.find((item) => item.id === highlightId) ?? firstReadyTool ?? inventory[0];
  }, [firstReadyTool, highlightId, inventory]);

  const headerMeta = useMemo(
    () => [
      {
        label: 'Ready',
        value: metrics.ready.toString(),
        emphasis: true
      },
      {
        label: 'Fleet',
        value: metrics.total.toString()
      },
      {
        label: 'Uptime',
        value: `${metrics.uptime.toFixed(1)}%`
      }
    ],
    [metrics.ready, metrics.total, metrics.uptime]
  );

  const handleHire = useCallback((tool) => {
    setInteraction({ type: 'hire', tool });
  }, []);

  const handleMonitor = useCallback((tool) => {
    setInteraction({ type: 'monitor', tool });
  }, []);

  const handleGallery = useCallback((tool) => {
    setInteraction({ type: 'gallery', tool });
  }, []);

  const closeInteraction = useCallback(() => {
    setInteraction(null);
  }, []);

  useEffect(() => {
    if (interaction && interaction.type !== 'gallery') {
      setWizardStep(0);
    }
  }, [interaction]);

  const quickControls = useMemo(() => {
    if (!highlightTool) {
      return [];
    }

    const base = [
      { id: 'rent', label: 'Rent', onClick: () => handleHire(highlightTool) },
      { id: 'track', label: 'Track', onClick: () => handleMonitor(highlightTool) },
      { id: 'media', label: 'Media', onClick: () => handleGallery(highlightTool) }
    ];

    if (persona === 'serviceman') {
      return [
        ...base,
        { id: 'tasks', label: 'Tasks', to: '/dashboards/serviceman/byok' },
        { id: 'tax', label: 'Tax', to: '/dashboards/serviceman/tax' }
      ];
    }

    return [
      ...base,
      { id: 'stock', label: 'Stock', to: '/provider/inventory' },
      { id: 'crew', label: 'Crew', to: '/dashboards/provider/crew-control' },
      { id: 'shop', label: 'Shop', to: '/provider/storefront' }
    ];
  }, [handleGallery, handleHire, handleMonitor, highlightTool, persona]);

  const accessGate = !status.allowed
    ? {
        title: 'Select role',
        actionLabel: 'Provider',
        onAction: () => setPersona('provider')
      }
    : toolsEnabled === false && !toggleLoading
      ? {
          title: 'Paused',
          actionLabel: 'Retry',
          onAction: () =>
            refreshToggle({ force: true }).catch((caught) => {
              console.error('Failed to refresh tools toggle', caught);
            })
        }
      : null;

  const wizardSteps = useMemo(() => {
    if (!interaction) {
      return [];
    }
    if (interaction.type === 'hire') {
      return ['Schedule', 'Confirm'];
    }
    if (interaction.type === 'monitor') {
      return ['Live', 'Alerts'];
    }
    return [];
  }, [interaction]);

  const wizardContent = useMemo(() => {
    if (!interaction) {
      return null;
    }

    const { tool, type } = interaction;
    if (!tool) {
      return null;
    }

    const availabilityPercent = Math.round((tool.availabilityScore ?? 0) * 100);
    const utilisationPercent = Math.round(((tool.utilisation ?? metrics.utilisation ?? 0) || 0) * 100);

    if (type === 'gallery') {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {tool.gallery.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.open(src, '_blank', 'noopener');
                }
              }}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <img src={src} alt={`${tool.name} view`} className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
            </button>
          ))}
        </div>
      );
    }

    if (type === 'hire') {
      if (wizardStep === 0) {
        return (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Location</dt>
              <dd className="mt-1 text-sm font-semibold text-primary">{tool.location}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Rate</dt>
              <dd className="mt-1 text-sm font-semibold text-primary">{tool.rentalRateLabel}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Availability</dt>
              <dd className="mt-1 text-sm font-semibold text-primary">{availabilityPercent}%</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Next service</dt>
              <dd className="mt-1 text-sm font-semibold text-primary">{tool.nextService}</dd>
            </div>
          </dl>
        );
      }

      return (
        <div className="space-y-4">
          {tool.pricing.length ? (
            <div className="flex flex-wrap gap-2">
              {tool.pricing.map((tier) => (
                <span
                  key={tier.id}
                  className="rounded-full border border-primary/40 bg-primary/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary"
                >
                  {tier.label} {tier.value}
                </span>
              ))}
            </div>
          ) : null}
          {tool.compliance?.length ? (
            <ul className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">
              {tool.compliance.map((item) => (
                <li key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-primary">
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    }

    if (wizardStep === 0) {
      return (
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Utilisation</dt>
            <dd className="mt-1 text-sm font-semibold text-primary">{utilisationPercent}%</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Uptime</dt>
            <dd className="mt-1 text-sm font-semibold text-primary">{metrics.uptime.toFixed(1)}%</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Availability</dt>
            <dd className="mt-1 text-sm font-semibold text-primary">{availabilityPercent}%</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Location</dt>
            <dd className="mt-1 text-sm font-semibold text-primary">{tool.location}</dd>
          </div>
        </dl>
      );
    }

    return (
      <div className="space-y-4">
        {tool.compliance?.length ? (
          <ul className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">
            {tool.compliance.map((item) => (
              <li key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-primary">
                {item}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-sm font-semibold text-primary">Alerts clear</p>
      </div>
    );
  }, [interaction, metrics.uptime, metrics.utilisation, wizardStep]);

  const handleNextStep = useCallback(() => {
    setWizardStep((current) => {
      if (wizardSteps.length === 0) {
        return current;
      }
      return Math.min(current + 1, wizardSteps.length - 1);
    });
  }, [wizardSteps]);

  const handlePrevStep = useCallback(() => {
    setWizardStep((current) => {
      if (wizardSteps.length === 0) {
        return current;
      }
      return Math.max(current - 1, 0);
    });
  }, [wizardSteps]);

  const isLastWizardStep = wizardSteps.length > 0 && wizardStep >= wizardSteps.length - 1;

  const handlePrimaryAction = useCallback(() => {
    if (isLastWizardStep) {
      closeInteraction();
      return;
    }
    handleNextStep();
  }, [closeInteraction, handleNextStep, isLastWizardStep]);

  const primaryActionLabel = interaction
    ? interaction.type === 'hire'
      ? isLastWizardStep
        ? 'Confirm'
        : 'Next'
      : interaction.type === 'monitor'
        ? isLastWizardStep
          ? 'Finish'
          : 'Next'
        : ''
    : '';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <PageHeader
        eyebrow="Rent"
        title="Tools"
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Tools' }
        ]}
        actions={[
          { label: 'Quote', to: '/contact', variant: 'secondary' },
          { label: 'Book', to: '/register', variant: 'primary' }
        ]}
        meta={headerMeta}
      />

      <div className="mx-auto w-full max-w-7xl px-6 py-12">
        {accessGate ? (
          <div className="rounded-3xl border border-primary/30 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-primary">{accessGate.title}</h2>
            <button
              type="button"
              onClick={accessGate.onAction}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
            >
              {accessGate.actionLabel}
            </button>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">{error}</div>
        ) : (
          <div className="space-y-12">
            {highlightTool ? (
              <section className="grid gap-8 xl:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
                <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-6">
                    <div className="relative overflow-hidden rounded-[2rem] bg-slate-100">
                      <video
                        key={highlightTool.heroVideo}
                        controls
                        poster={highlightTool.heroImage}
                        className="aspect-video w-full rounded-[2rem] object-cover"
                      >
                        <source src={highlightTool.heroVideo} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      <button
                        type="button"
                        onClick={() => handleGallery(highlightTool)}
                        className="absolute right-4 top-4 inline-flex items-center justify-center rounded-full bg-black/60 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white backdrop-blur transition hover:bg-black/80"
                      >
                        Media
                      </button>
                    </div>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{highlightTool.category}</p>
                        <h2 className="mt-2 text-3xl font-semibold text-primary md:text-4xl">{highlightTool.name}</h2>
                      </div>
                      {highlightTool.pricing.length ? (
                        <div className="flex flex-wrap gap-2">
                          {highlightTool.pricing.slice(0, 3).map((tier) => (
                            <span
                              key={tier.id}
                              className="rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary"
                            >
                              {tier.label} {tier.value}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Ready</p>
                        <p className="mt-2 text-3xl font-semibold text-primary">{Math.round((highlightTool.availabilityScore ?? 0) * 100)}%</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Service</p>
                        <p className="mt-2 text-lg font-semibold text-primary">{highlightTool.nextService}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Location</p>
                        <p className="mt-2 text-lg font-semibold text-primary">{highlightTool.location}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleHire(highlightTool)}
                        className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
                      >
                        Rent
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMonitor(highlightTool)}
                        className="inline-flex items-center justify-center rounded-full border border-primary/40 px-6 py-2 text-sm font-semibold text-primary transition hover:border-primary hover:text-primary"
                      >
                        Track
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGallery(highlightTool)}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
                      >
                        Media
                      </button>
                      <Link
                        to="/provider/inventory"
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
                      >
                        Stock
                      </Link>
                    </div>
                  </div>
                </div>
                <aside className="flex flex-col gap-6 rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Routes</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {quickControls.map((item) =>
                        item.to ? (
                          <Link
                            key={item.id}
                            to={item.to}
                            onClick={item.onClick}
                            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary transition hover:border-primary hover:text-primary"
                          >
                            {item.label}
                          </Link>
                        ) : (
                          <button
                            key={item.id}
                            type="button"
                            onClick={item.onClick}
                            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary transition hover:border-primary hover:text-primary"
                          >
                            {item.label}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  {highlightTool.compliance?.length ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Compliance</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {highlightTool.compliance.slice(0, 6).map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </aside>
              </section>
            ) : null}

            <section className="space-y-6">
              {categories.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCategory(null)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition ${
                      activeCategory === null
                        ? 'border-primary bg-primary text-white shadow-sm shadow-primary/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((category) => {
                    const selected = activeCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          setActiveCategory(selected ? null : category.id);
                          const nextHighlight = inventory.find(
                            (item) => item.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') === category.id
                          );
                          if (nextHighlight) {
                            setHighlightId(nextHighlight.id);
                          }
                        }}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition ${
                          selected
                            ? 'border-primary bg-primary text-white shadow-sm shadow-primary/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary'
                        }`}
                      >
                        {category.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <ToolsShowcase
                items={filteredInventory}
                loading={loading}
                onHire={(tool) => {
                  setHighlightId(tool.id);
                  handleHire(tool);
                }}
                onInspect={(tool) => {
                  setHighlightId(tool.id);
                  handleMonitor(tool);
                }}
                onShowGallery={(tool) => {
                  setHighlightId(tool.id);
                  handleGallery(tool);
                }}
                onFocus={(tool) => setHighlightId(tool.id)}
              />
            </section>
          </div>
        )}
      </div>

      {interaction ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4 py-8">
          <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-primary/10">
            <button
              type="button"
              onClick={closeInteraction}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-primary hover:text-primary"
              aria-label="Close panel"
            >
              ×
            </button>
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    {interaction.type === 'hire'
                      ? 'Rent'
                      : interaction.type === 'monitor'
                        ? 'Track'
                        : 'Media'}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-primary">{interaction.tool?.name}</h3>
                </div>
                {wizardSteps.length ? (
                  <div className="flex flex-wrap gap-2">
                    {wizardSteps.map((label, index) => (
                      <span
                        key={label}
                        className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${
                          index === wizardStep ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">{wizardContent}</div>

              {interaction.type !== 'gallery' ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={closeInteraction}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary"
                    >
                      Close
                    </button>
                    {wizardStep > 0 ? (
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary"
                      >
                        Back
                      </button>
                    ) : null}
                  </div>
                  {primaryActionLabel ? (
                    <button
                      type="button"
                      onClick={handlePrimaryAction}
                      className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
                    >
                      {primaryActionLabel}
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeInteraction}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
