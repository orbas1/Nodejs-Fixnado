import PropTypes from 'prop-types';
import { Button, Card, Checkbox, StatusPill, TextInput } from '../../../components/ui/index.js';
import { ROLE_OPTIONS } from '../constants.js';

function SeoSettingsForm({
  seoForm,
  onChange,
  onSubmit,
  onSitemapRefresh,
  saving,
  error,
  success,
  defaultKeywordsCount,
  sitemapLastGenerated
}) {
  if (!seoForm) {
    return null;
  }

  return (
    <form id="global" onSubmit={onSubmit} className="space-y-12">
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-primary">Global metadata</h2>
          <p className="mt-2 text-sm text-slate-600">
            Update brand-wide metadata defaults used for pages, social previews, and AI generated snippets.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Site name"
            value={seoForm.siteName}
            onChange={(event) => onChange('siteName', event.target.value)}
            required
          />
          <TextInput
            label="Default title"
            value={seoForm.defaultTitle}
            onChange={(event) => onChange('defaultTitle', event.target.value)}
            required
            hint="Used for pages without explicit titles"
          />
          <TextInput
            label="Title template"
            value={seoForm.titleTemplate}
            onChange={(event) => onChange('titleTemplate', event.target.value)}
            hint="Supports %s token for page titles"
          />
          <TextInput
            label="Canonical host"
            value={seoForm.canonicalHost}
            onChange={(event) => onChange('canonicalHost', event.target.value)}
            hint="Example: https://www.fixnado.com"
          />
        </div>

        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">
          Default description
          <textarea
            value={seoForm.defaultDescription}
            onChange={(event) => onChange('defaultDescription', event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <TextInput
          label="Default keywords"
          value={seoForm.defaultKeywordsText}
          onChange={(event) => onChange('defaultKeywordsText', event.target.value)}
          hint="Comma separated keywords shared across the experience"
        />

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-primary">Keywords tracked:</span> {defaultKeywordsCount}
          </p>
        </div>
      </section>

      <section id="indexing" className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-primary">Indexing & sitemap</h2>
          <p className="mt-2 text-sm text-slate-600">
            Control robots directives, auto indexing, and sitemap cadence for Fixnado properties.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-2xl border border-slate-200 bg-white/80 p-5" padding="lg">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">Robots directives</p>
            <div className="mt-4 space-y-4 text-sm">
              <Checkbox
                label="Allow indexing"
                checked={seoForm.robots.index}
                onChange={(event) => onChange('robots.index', event.target.checked)}
              />
              <Checkbox
                label="Follow links"
                checked={seoForm.robots.follow}
                onChange={(event) => onChange('robots.follow', event.target.checked)}
              />
              <TextInput
                label="Advanced directives"
                value={seoForm.robots.advancedDirectives}
                onChange={(event) => onChange('robots.advancedDirectives', event.target.value)}
                hint="Optional disallow statements or crawl hints"
              />
            </div>
          </Card>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">Sitemap controls</p>
            <Checkbox
              label="Auto-generate sitemap"
              checked={seoForm.sitemap.autoGenerate}
              onChange={(event) => onChange('sitemap.autoGenerate', event.target.checked)}
            />
            <Checkbox
              label="Ping search engines after updates"
              checked={seoForm.sitemap.pingSearchEngines}
              onChange={(event) => onChange('sitemap.pingSearchEngines', event.target.checked)}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="secondary" onClick={onSitemapRefresh} disabled={saving}>
                {saving ? 'Updating…' : 'Mark sitemap regenerated'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (!seoForm.canonicalHost) return;
                  window.open(`${seoForm.canonicalHost.replace(/\/$/, '')}/sitemap.xml`, '_blank', 'noopener');
                }}
                disabled={!seoForm.canonicalHost}
              >
                View sitemap
              </Button>
            </div>
            <StatusPill tone="info">Last updated {sitemapLastGenerated}</StatusPill>
          </div>
        </div>
      </section>

      <section id="social" className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-primary">Social & structured data</h2>
          <p className="mt-2 text-sm text-slate-600">
            Define the social defaults, JSON-LD snippets, and tag governance applied across Fixnado.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <TextInput
            label="Twitter handle"
            value={seoForm.social.twitterHandle}
            onChange={(event) => onChange('social.twitterHandle', event.target.value)}
          />
          <TextInput
            label="Facebook App ID"
            value={seoForm.social.facebookAppId}
            onChange={(event) => onChange('social.facebookAppId', event.target.value)}
          />
          <TextInput
            label="Default social image URL"
            value={seoForm.social.defaultImageUrl}
            onChange={(event) => onChange('social.defaultImageUrl', event.target.value)}
          />
          <TextInput
            label="Default social image alt text"
            value={seoForm.social.defaultImageAlt}
            onChange={(event) => onChange('social.defaultImageAlt', event.target.value)}
          />
        </div>

        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">
          Organisation JSON-LD
          <textarea
            value={seoForm.structuredData.organisationJsonLd}
            onChange={(event) => onChange('structuredData.organisationJsonLd', event.target.value)}
            rows={6}
            className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 font-mono text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder='{"@context":"https://schema.org","@type":"Organization"}'
          />
        </label>

        <Checkbox
          label="Auto-generate breadcrumbs for new pages"
          checked={seoForm.structuredData.enableAutoBreadcrumbs}
          onChange={(event) => onChange('structuredData.enableAutoBreadcrumbs', event.target.checked)}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">Tag defaults</p>
            <TextInput
              label="Meta title template"
              value={seoForm.tagDefaults.metaTitleTemplate}
              onChange={(event) => onChange('tagDefaults.metaTitleTemplate', event.target.value)}
              hint="Use %tag% and %site% tokens"
            />
            <TextInput
              label="Meta description template"
              value={seoForm.tagDefaults.metaDescriptionTemplate}
              onChange={(event) => onChange('tagDefaults.metaDescriptionTemplate', event.target.value)}
            />
            <TextInput
              label="Default Open Graph alt text"
              value={seoForm.tagDefaults.defaultOgImageAlt}
              onChange={(event) => onChange('tagDefaults.defaultOgImageAlt', event.target.value)}
            />
            <Checkbox
              label="Auto-populate tag Open Graph image"
              checked={seoForm.tagDefaults.autoPopulateOg}
              onChange={(event) => onChange('tagDefaults.autoPopulateOg', event.target.checked)}
            />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">Default role access</p>
              <div className="flex flex-wrap gap-3">
                {ROLE_OPTIONS.map((option) => (
                  <Checkbox
                    key={option.value}
                    label={option.label}
                    checked={seoForm.tagDefaults.defaultRoleAccess.includes(option.value)}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...seoForm.tagDefaults.defaultRoleAccess, option.value]
                        : seoForm.tagDefaults.defaultRoleAccess.filter((role) => role !== option.value);
                      onChange('tagDefaults.defaultRoleAccess', next);
                    }}
                  />
                ))}
              </div>
            </div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">
              Owner role
              <select
                value={seoForm.tagDefaults.ownerRole}
                onChange={(event) => onChange('tagDefaults.ownerRole', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">Governance</p>
            <Checkbox
              label="Lock slug edits for published tags"
              checked={seoForm.governance.lockSlugEdits}
              onChange={(event) => onChange('governance.lockSlugEdits', event.target.checked)}
            />
            <Checkbox
              label="Require owner role to publish tag metadata"
              checked={seoForm.governance.requireOwnerForPublish}
              onChange={(event) => onChange('governance.requireOwnerForPublish', event.target.checked)}
            />
            <Card className="rounded-2xl border border-slate-200 bg-white/70 p-4" padding="lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Role visibility</p>
              <p className="mt-2 text-sm text-slate-600">
                Roles provisioned: {ROLE_OPTIONS.map((option) => option.label).join(' • ')}
              </p>
            </Card>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-2xl border border-slate-200 bg-white/80 p-4" padding="lg">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Search preview</p>
            <div className="mt-3 space-y-2 text-sm">
              <p className="text-indigo-700">{seoForm.defaultTitle || 'Default title preview'}</p>
              <p className="text-xs text-emerald-600">{seoForm.canonicalHost ? seoForm.canonicalHost : 'https://www.fixnado.com'}</p>
              <p className="text-slate-600">{seoForm.defaultDescription || 'Meta description preview will appear here.'}</p>
            </div>
          </Card>
          <Card className="rounded-2xl border border-slate-200 bg-white/80 p-4" padding="lg">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Social preview</p>
            <div className="mt-3 flex gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                {seoForm.social.defaultImageUrl ? (
                  <img
                    src={seoForm.social.defaultImageUrl}
                    alt={seoForm.social.defaultImageAlt || 'Default social preview'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">No image</div>
                )}
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-primary">{seoForm.defaultTitle || 'Default title preview'}</p>
                <p className="text-xs text-slate-500">{seoForm.canonicalHost || 'https://www.fixnado.com'}</p>
                <p className="text-xs text-slate-500">{seoForm.defaultDescription || 'Meta description preview.'}</p>
              </div>
            </div>
          </Card>
        </div>

        {error ? <StatusPill tone="danger">{error}</StatusPill> : null}
        {success ? <StatusPill tone="success">{success}</StatusPill> : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save SEO settings'}
          </Button>
        </div>
      </section>
    </form>
  );
}

SeoSettingsForm.propTypes = {
  seoForm: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onSitemapRefresh: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  error: PropTypes.string,
  success: PropTypes.string,
  defaultKeywordsCount: PropTypes.number.isRequired,
  sitemapLastGenerated: PropTypes.string.isRequired
};

export default SeoSettingsForm;
