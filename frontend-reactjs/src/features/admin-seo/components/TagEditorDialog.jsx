import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Button, Card, Checkbox, StatusPill, TextInput } from '../../../components/ui/index.js';
import { ROLE_OPTIONS } from '../constants.js';
import { applyTagTemplate } from '../utils.js';

function TagEditorDialog({
  open,
  tagForm,
  onClose,
  onChange,
  onSave,
  onDelete,
  onApplyDefaults,
  saving,
  error,
  seoForm
}) {
  const siteName = seoForm?.siteName ?? 'Fixnado';
  const canonicalHost = seoForm?.canonicalHost?.replace(/\/$/, '') ?? '';
  const previewSlug = tagForm?.slug || 'tag';
  const previewUrl = canonicalHost ? `${canonicalHost}/blog/tags/${previewSlug}` : `/blog/tags/${previewSlug}`;
  const lockSlugEdits = Boolean(seoForm?.governance?.lockSlugEdits && tagForm?.id);
  const previewTitle = tagForm?.metaTitle?.trim()
    ? tagForm.metaTitle
    : applyTagTemplate(seoForm?.tagDefaults?.metaTitleTemplate, { tagName: tagForm?.name, siteName });
  const previewDescription = tagForm?.metaDescription?.trim()
    ? tagForm.metaDescription
    : applyTagTemplate(seoForm?.tagDefaults?.metaDescriptionTemplate, { tagName: tagForm?.name, siteName });
  const socialImage = tagForm?.ogImageUrl?.trim() || seoForm?.social?.defaultImageUrl || '';
  const socialAlt = tagForm?.ogImageAlt?.trim() || seoForm?.social?.defaultImageAlt || 'Social preview';

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-4xl overflow-hidden rounded-3xl border border-accent/10 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <Dialog.Title className="text-lg font-semibold text-primary">
                    {tagForm?.id ? 'Edit tag metadata' : 'Create tag metadata'}
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-transparent p-2 text-slate-500 transition hover:border-slate-200 hover:text-primary"
                    aria-label="Close tag editor"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>

                <form
                  className="grid gap-6 px-6 py-6"
                  onSubmit={(event) => {
                    event.preventDefault();
                    onSave();
                  }}
                >
                  {error ? <StatusPill tone="danger">{error}</StatusPill> : null}

                  <div className="grid gap-5 md:grid-cols-2">
                    <TextInput
                      label="Tag name"
                      value={tagForm?.name ?? ''}
                      onChange={(event) => onChange('name', event.target.value)}
                      required
                    />
                    <TextInput
                      label="Slug"
                      value={tagForm?.slug ?? ''}
                      onChange={(event) => onChange('slug', event.target.value, { manual: true })}
                      required
                      disabled={lockSlugEdits}
                      hint={
                        lockSlugEdits
                          ? 'Slug edits are locked for existing tags. Update governance settings to change.'
                          : 'URL-friendly identifier'
                      }
                    />
                  </div>

                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">
                    Description
                    <textarea
                      value={tagForm?.description ?? ''}
                      onChange={(event) => onChange('description', event.target.value)}
                      rows={3}
                      className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </label>

                  <div className="grid gap-5 md:grid-cols-2">
                    <TextInput
                      label="Meta title"
                      value={tagForm?.metaTitle ?? ''}
                      onChange={(event) => onChange('metaTitle', event.target.value)}
                      hint="Supports %tag% and %site% tokens"
                    />
                    <TextInput
                      label="Meta keywords"
                      value={tagForm?.metaKeywordsText ?? ''}
                      onChange={(event) => onChange('metaKeywordsText', event.target.value)}
                      hint="Comma separated keywords"
                    />
                  </div>

                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">
                    Meta description
                    <textarea
                      value={tagForm?.metaDescription ?? ''}
                      onChange={(event) => onChange('metaDescription', event.target.value)}
                      rows={3}
                      className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </label>

                  <div className="grid gap-5 md:grid-cols-2">
                    <TextInput
                      label="Canonical URL"
                      value={tagForm?.canonicalUrl ?? ''}
                      onChange={(event) => onChange('canonicalUrl', event.target.value)}
                      hint="Absolute URL to the tag landing page"
                    />
                    <TextInput
                      label="Open Graph image URL"
                      value={tagForm?.ogImageUrl ?? ''}
                      onChange={(event) => onChange('ogImageUrl', event.target.value)}
                    />
                    <TextInput
                      label="Open Graph image alt text"
                      value={tagForm?.ogImageAlt ?? ''}
                      onChange={(event) => onChange('ogImageAlt', event.target.value)}
                    />
                    <TextInput
                      label="Synonyms"
                      value={tagForm?.synonymsText ?? ''}
                      onChange={(event) => onChange('synonymsText', event.target.value)}
                      hint="Comma separated related terms"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <Checkbox
                      label="Block from search indexing"
                      checked={Boolean(tagForm?.noindex)}
                      onChange={(event) => onChange('noindex', event.target.checked)}
                    />
                    <StatusPill tone={tagForm?.noindex ? 'warning' : 'success'}>
                      {tagForm?.noindex ? 'Noindex enabled' : 'Indexable'}
                    </StatusPill>
                  </div>

                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">
                    Structured data (JSON-LD)
                    <textarea
                      value={tagForm?.structuredDataInput ?? ''}
                      onChange={(event) => onChange('structuredDataInput', event.target.value)}
                      rows={6}
                      className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 font-mono text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder='{"@context":"https://schema.org","@type":"Thing"}'
                    />
                  </label>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">Role access</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {ROLE_OPTIONS.map((option) => (
                        <Checkbox
                          key={option.value}
                          label={option.label}
                          checked={tagForm?.roleAccess?.includes(option.value)}
                          onChange={(event) => onChange('roleAccess', option.value, { checked: event.target.checked })}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">
                      Owner role
                      <select
                        value={tagForm?.ownerRole ?? 'admin'}
                        onChange={(event) => onChange('ownerRole', event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex items-end justify-end">
                      <Button type="button" variant="secondary" onClick={onApplyDefaults}>
                        Apply global defaults
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="rounded-2xl border border-slate-200 bg-white/80 p-4" padding="lg">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Search preview</p>
                      <div className="mt-3 space-y-2 text-sm">
                        <p className="text-indigo-700">{previewTitle || 'Tag title preview'}</p>
                        <p className="text-xs text-emerald-600">{previewUrl}</p>
                        <p className="text-slate-600">{previewDescription || 'Meta description preview will appear here.'}</p>
                      </div>
                    </Card>
                    <Card className="rounded-2xl border border-slate-200 bg-white/80 p-4" padding="lg">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Social preview</p>
                      <div className="mt-3 flex gap-3">
                        <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                          {socialImage ? (
                            <img src={socialImage} alt={socialAlt} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">No image</div>
                          )}
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-semibold text-primary">{previewTitle || 'Title preview'}</p>
                          <p className="text-xs text-slate-500">{previewUrl}</p>
                          <p className="text-xs text-slate-500">{previewDescription || 'Meta description preview.'}</p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-3">
                      <Button type="submit" disabled={saving}>
                        {saving ? 'Saving…' : tagForm?.id ? 'Save changes' : 'Create tag'}
                      </Button>
                      <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                      </Button>
                      {tagForm?.id ? (
                        <Button type="button" variant="danger" onClick={onDelete} disabled={saving}>
                          Delete tag
                        </Button>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => window.open(previewUrl, '_blank', 'noopener')}
                    >
                      Open preview
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

TagEditorDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  tagForm: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onApplyDefaults: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  error: PropTypes.string,
  seoForm: PropTypes.object
};

export default TagEditorDialog;
