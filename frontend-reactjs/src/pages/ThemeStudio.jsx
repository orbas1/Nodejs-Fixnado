import { useMemo } from 'react';
import { ArrowTopRightOnSquareIcon, SwatchIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/blueprints/PageHeader.jsx';
import BlueprintSection from '../components/blueprints/BlueprintSection.jsx';
import ThemePreviewCard from '../components/theme/ThemePreviewCard.jsx';
import MarketingModulePreview from '../components/theme/MarketingModulePreview.jsx';
import PreferenceChangeAnnouncer from '../components/accessibility/PreferenceChangeAnnouncer.jsx';
import { Button, Card, SegmentedControl } from '../components/ui/index.js';
import { useTheme } from '../hooks/useTheme.js';
import { PERSONALISATION_OPTIONS } from '../theme/config.js';

const preferenceMeta = ({ preferences }) => [
  {
    label: 'Active theme',
    value: preferences.theme.toUpperCase(),
    caption: 'Synced across admin, provider, and marketing shells',
    emphasis: true
  },
  {
    label: 'Density',
    value: preferences.density === 'compact' ? 'Compact' : 'Comfortable',
    caption: preferences.density === 'compact' ? '44px targets maintained' : 'Recommended default'
  },
  {
    label: 'Contrast mode',
    value: preferences.contrast === 'high' ? 'High contrast' : 'Standard',
    caption: preferences.contrast === 'high' ? 'Amber focus halo enabled' : 'Balanced tokens'
  }
];

export default function ThemeStudio() {
  const { preferences, themes, personalisationOptions, setTheme, setDensity, setContrast, setMarketingVariant } = useTheme();

  const headerMeta = useMemo(() => preferenceMeta({ preferences }), [preferences]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-qa-page="theme-studio">
      <PreferenceChangeAnnouncer />
      <PageHeader
        eyebrow="Theme & personalisation"
        title="Theme studio"
        description="Manage Fixnado appearance, accessibility presets, and marketing variants with telemetry-ready instrumentation."
        breadcrumbs={[
          { label: 'Operations', to: '/' },
          { label: 'Admin dashboard', to: '/admin/dashboard' },
          { label: 'Theme studio' }
        ]}
        actions={[
          {
            label: 'Theme guidelines',
            to: '/docs/theme-governance.pdf',
            variant: 'secondary',
            icon: ArrowTopRightOnSquareIcon,
            analyticsId: 'open_theme_guidelines'
          }
        ]}
        meta={headerMeta}
      />

      <div className="mx-auto max-w-7xl px-6 pt-16 space-y-14">
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-primary md:text-3xl">Theme presets</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Preview and activate themes aligned to governance guardrails. Each preset includes imagery guidelines, contrast
                assurances, and adoption analytics sourced from the design token telemetry feed.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={SwatchIcon}
              onClick={() =>
                typeof window !== 'undefined' &&
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
              }
              analyticsId="theme_scroll_to_marketing"
            >
              Jump to marketing variants
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3" data-qa="theme-presets-grid">
            {themes.map((preset) => (
              <ThemePreviewCard
                key={preset.id}
                preset={preset}
                active={preferences.theme === preset.id}
                onSelect={setTheme}
                qa={`theme-preset-card.${preset.id}`}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card padding="lg" className="space-y-8 border-slate-100 bg-white/90 shadow-lg shadow-primary/5">
            <header>
              <h2 className="text-xl font-semibold text-primary md:text-2xl">Personalisation controls</h2>
              <p className="mt-2 text-sm text-slate-600">
                Adjust density and contrast to align with operator preferences. All changes persist via secure local storage and
                broadcast telemetry to the governance data layer.
              </p>
            </header>

            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Density</p>
                <SegmentedControl
                  name="Theme density"
                  value={preferences.density}
                  options={personalisationOptions.density.map((option) => ({ label: option.label, value: option.value }))}
                  onChange={setDensity}
                  qa={{ group: 'density-control', option: 'density-option' }}
                />
                <p className="mt-2 text-xs text-slate-500">
                  {PERSONALISATION_OPTIONS.density.find((option) => option.value === preferences.density)?.description}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Contrast</p>
                <SegmentedControl
                  name="Contrast mode"
                  value={preferences.contrast}
                  options={personalisationOptions.contrast.map((option) => ({ label: option.label, value: option.value }))}
                  onChange={setContrast}
                  qa={{ group: 'contrast-control', option: 'contrast-option' }}
                />
                <p className="mt-2 text-xs text-slate-500">
                  {PERSONALISATION_OPTIONS.contrast.find((option) => option.value === preferences.contrast)?.description}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-600">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Telemetry hooks</p>
                <ul className="mt-3 space-y-2">
                  <li>
                    <code className="rounded bg-slate-900/90 px-2 py-1 text-xs text-white">event: &apos;theme_change&apos;</code> with
                    payload of <code className="text-xs">theme</code>, <code className="text-xs">density</code>,
                    <code className="text-xs">contrast</code>, <code className="text-xs">marketingVariant</code>.
                  </li>
                  <li>
                    Beacon dispatched to <code className="text-xs">/telemetry/ui-preferences</code> for behavioural analytics.
                  </li>
                  <li>Custom DOM event <code className="text-xs">fixnado:theme-change</code> enables integration testing.</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="space-y-6 border-slate-100 bg-white/90 shadow-lg shadow-primary/5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Accessibility snapshots</h3>
            <ul className="space-y-4 text-sm text-slate-600">
              <li>
                <span className="font-semibold text-primary">Focus ring coverage:</span> {preferences.contrast === 'high'
                  ? 'Amber 3px halo for low-vision operators.'
                  : 'Sky-blue halo meeting WCAG 2.2 AA.'}
              </li>
              <li>
                <span className="font-semibold text-primary">Hit targets:</span> Buttons retain 44px minimum height across
                density modes.
              </li>
              <li>
                <span className="font-semibold text-primary">Documentation:</span> Contrast validation matrix synced to
                <a href="/docs/accessibility-matrix.xlsx" className="ml-1 text-accent hover:text-primary">
                  accessibility audit pack
                </a>
                .
              </li>
            </ul>
          </Card>
        </section>

        <section className="space-y-6" id="marketing-variants">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-primary md:text-3xl">Marketing module variations</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Toggle hero, announcement, and seasonal overlays to see how creative adapts across active themes. Content slots
                integrate with Contentful entries <code className="text-xs">marketing.theme.variant</code>.
              </p>
            </div>
            <SegmentedControl
              name="Marketing variant"
              value={preferences.marketingVariant}
              options={personalisationOptions.marketingVariant.map((option) => ({ label: option.label, value: option.value }))}
              onChange={setMarketingVariant}
              size="sm"
              qa={{ group: 'marketing-variant-control', option: 'marketing-option' }}
            />
          </div>

          <MarketingModulePreview
            variant={preferences.marketingVariant}
            qa={`marketing-preview.${preferences.marketingVariant}`}
          />
        </section>

        <BlueprintSection
          eyebrow="Governance & validation"
          title="Operational checklist"
          description="Collaboration plan covering backend hooks, QA validation, and upcoming user sessions to ratify the theme toolkit."
          aside={
            <Card padding="lg" className="space-y-4 border-slate-100 bg-white/90 shadow-lg shadow-primary/5">
              <h4 className="text-sm font-semibold text-primary">User validation sprint</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li>
                  <span className="font-semibold text-primary">Feb 5:</span> Dark mode compliance walkthrough with operations
                  leads.
                </li>
                <li>
                  <span className="font-semibold text-primary">Feb 7:</span> Emo campaign preview with marketing & legal to
                  approve imagery and copy.
                </li>
                <li>
                  <span className="font-semibold text-primary">Feb 9:</span> Remote usability test focusing on discoverability
                  of the personalisation controls.
                </li>
              </ul>
            </Card>
          }
        >
          <ul className="list-disc space-y-3 pl-5 text-sm text-slate-600">
            <li>
              <span className="font-semibold text-primary">Backend integration:</span> Telemetry payload forwarded to the
              personalisation topic (<code className="text-xs">kafka.ui-preferences.v1</code>) with tenant + role metadata.
            </li>
            <li>
              <span className="font-semibold text-primary">QA playbook:</span> Storybook regression scenarios queued for
              Chromatic once hero/announcement components are published.
            </li>
            <li>
              <span className="font-semibold text-primary">Design documentation:</span> Full palette, typography nuances, and
              imagery guidelines captured in <code className="text-xs">theme_personalisation_toolkit.md</code>.
            </li>
            <li>
              <span className="font-semibold text-primary">Rollout guardrails:</span> Emo theme flagged as feature toggled
              experiment (`feature.theme.emo`) with automatic rollback if CTR uplift {'< 10%'}.
            </li>
          </ul>
        </BlueprintSection>
      </div>
    </div>
  );
}

