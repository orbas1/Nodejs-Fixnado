import PropTypes from 'prop-types';
import { Button, Card, Checkbox, FormField, Spinner, TextInput } from '../../../components/ui/index.js';
import { NEW_PAGE_ID, PAGE_STATUS_OPTIONS, PAGE_VISIBILITY_OPTIONS } from '../constants.js';
import SelectionPanel from './SelectionPanel.jsx';

function BlockEditor({
  block,
  onChange,
  onToggle,
  onSave,
  onDelete,
  saving
}) {
  const handleFieldChange = (field) => (event) => onChange(block.id, field, event.target.value);

  return (
    <Card className="flex flex-col gap-4 border border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{block.type}</p>
          <p className="text-xs text-slate-500">Position {block.position || 0}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => onSave(block.id)} disabled={saving}>
            Save block
          </Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(block.id)} disabled={saving}>
            Delete
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Block type" value={block.type} onChange={handleFieldChange('type')} />
        <TextInput label="Position" type="number" value={block.position} onChange={handleFieldChange('position')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Title" value={block.title} onChange={handleFieldChange('title')} />
        <TextInput label="Subtitle" value={block.subtitle} onChange={handleFieldChange('subtitle')} />
      </div>
      <FormField id={`block-body-${block.id}`} label="Body">
        <textarea
          id={`block-body-${block.id}`}
          className="fx-text-input min-h-[120px]"
          value={block.body}
          onChange={handleFieldChange('body')}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Layout" value={block.layout} onChange={handleFieldChange('layout')} />
        <TextInput label="Accent colour" value={block.accentColor} onChange={handleFieldChange('accentColor')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Background image" value={block.backgroundImageUrl} onChange={handleFieldChange('backgroundImageUrl')} />
        <TextInput label="Embed URL" value={block.embedUrl} onChange={handleFieldChange('embedUrl')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="CTA label" value={block.ctaLabel} onChange={handleFieldChange('ctaLabel')} />
        <TextInput label="CTA URL" value={block.ctaUrl} onChange={handleFieldChange('ctaUrl')} />
      </div>
      <TextInput label="Allowed roles" value={block.allowedRoles} onChange={handleFieldChange('allowedRoles')} />
      <FormField id={`block-media-${block.id}`} label="Media JSON">
        <textarea
          id={`block-media-${block.id}`}
          className="fx-text-input min-h-[120px] font-mono text-xs"
          value={block.media}
          onChange={handleFieldChange('media')}
        />
      </FormField>
      <FormField id={`block-settings-${block.id}`} label="Settings JSON">
        <textarea
          id={`block-settings-${block.id}`}
          className="fx-text-input min-h-[120px] font-mono text-xs"
          value={block.settings}
          onChange={handleFieldChange('settings')}
        />
      </FormField>
      <div className="flex items-center justify-between">
        <Checkbox
          label="Block visible"
          checked={block.isVisible}
          onChange={(event) => onToggle(block.id, event.target.checked)}
        />
        <TextInput label="Analytics tag" value={block.analyticsTag} onChange={handleFieldChange('analyticsTag')} />
      </div>
    </Card>
  );
}

BlockEditor.propTypes = {
  block: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  saving: PropTypes.bool
};

export default function PageManager({
  pageSelection,
  selectedPageId,
  onSelectPage,
  onCreatePage,
  loadingPages,
  pageDraft,
  handleTitleChange,
  handleSlugChange,
  handleSlugBlur,
  regenerateSlug,
  handlePreviewChange,
  handlePreviewBlur,
  syncPreviewPath,
  setPageDraft,
  loadingPageDetail,
  savePage,
  savingPage,
  deletePage,
  blocks,
  setBlocks,
  saveBlock,
  savingBlocks,
  removeBlock,
  newBlockDraft,
  setNewBlockDraft,
  addBlock,
  creatingBlock
}) {
  const onDraftFieldChange = (field) => (event) =>
    setPageDraft((current) => ({ ...current, [field]: event.target.value }));

  const blockChangeHandler = (blockId, field, value) => {
    setBlocks((current) => current.map((entry) => (entry.id === blockId ? { ...entry, [field]: value } : entry)));
  };

  const blockToggleHandler = (blockId, isVisible) => {
    setBlocks((current) => current.map((entry) => (entry.id === blockId ? { ...entry, isVisible } : entry)));
  };

  const newBlockField = (field) => (event) => setNewBlockDraft((current) => ({ ...current, [field]: event.target.value }));

  const selectionItems = pageSelection.map((page) => ({
    id: page.id,
    label: page.title,
    helper: page.status
  }));

  return (
    <section className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <SelectionPanel
          title="Pages"
          actionLabel="New page"
          onAction={onCreatePage}
          items={selectionItems}
          selectedId={selectedPageId}
          onSelect={onSelectPage}
          loading={loadingPages}
          emptyMessage="No pages created yet."
        />
        <Card className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-900">
              {selectedPageId === NEW_PAGE_ID ? 'New page' : 'Page settings'}
            </h2>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={savePage} disabled={savingPage || loadingPageDetail}>
                Save page
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={deletePage}
                disabled={savingPage || !selectedPageId || selectedPageId === NEW_PAGE_ID}
              >
                Delete
              </Button>
            </div>
          </div>
          {loadingPageDetail ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-6 w-6 text-primary" />
            </div>
          ) : (
            <div className="grid gap-4">
              <TextInput label="Page title" value={pageDraft.title} onChange={handleTitleChange} required />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <TextInput
                  label="Slug"
                  hint="Lowercase URL fragment auto-generated from the title"
                  value={pageDraft.slug}
                  onChange={handleSlugChange}
                  onBlur={handleSlugBlur}
                  className="sm:flex-1"
                />
                <Button variant="secondary" size="sm" className="sm:self-end" onClick={regenerateSlug}>
                  Generate from title
                </Button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <TextInput
                  label="Preview path"
                  value={pageDraft.previewPath}
                  onChange={handlePreviewChange}
                  onBlur={handlePreviewBlur}
                  className="sm:flex-1"
                />
                <Button variant="secondary" size="sm" className="sm:self-end" onClick={syncPreviewPath}>
                  Sync with slug
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField id="page-status" label="Status">
                  <select
                    id="page-status"
                    className="fx-text-input"
                    value={pageDraft.status}
                    onChange={onDraftFieldChange('status')}
                  >
                    {PAGE_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField id="page-visibility" label="Visibility">
                  <select
                    id="page-visibility"
                    className="fx-text-input"
                    value={pageDraft.visibility}
                    onChange={onDraftFieldChange('visibility')}
                  >
                    {PAGE_VISIBILITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <TextInput label="Layout" value={pageDraft.layout} onChange={onDraftFieldChange('layout')} />
              </div>
              <TextInput label="Hero headline" value={pageDraft.heroHeadline} onChange={onDraftFieldChange('heroHeadline')} />
              <TextInput label="Hero subheading" value={pageDraft.heroSubheading} onChange={onDraftFieldChange('heroSubheading')} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Hero image" value={pageDraft.heroImageUrl} onChange={onDraftFieldChange('heroImageUrl')} />
                <TextInput label="Hero CTA label" value={pageDraft.heroCtaLabel} onChange={onDraftFieldChange('heroCtaLabel')} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Hero CTA URL" value={pageDraft.heroCtaUrl} onChange={onDraftFieldChange('heroCtaUrl')} />
                <TextInput label="Feature image" value={pageDraft.featureImageUrl} onChange={onDraftFieldChange('featureImageUrl')} />
              </div>
              <TextInput label="SEO title" value={pageDraft.seoTitle} onChange={onDraftFieldChange('seoTitle')} />
              <FormField id="seo-description" label="SEO description">
                <textarea
                  id="seo-description"
                  className="fx-text-input min-h-[100px]"
                  value={pageDraft.seoDescription}
                  onChange={onDraftFieldChange('seoDescription')}
                />
              </FormField>
              <TextInput
                label="Allowed roles"
                hint="Comma separated role list"
                value={pageDraft.allowedRoles}
                onChange={onDraftFieldChange('allowedRoles')}
              />
              <FormField id="page-metadata" label="Metadata JSON" hint="Advanced configuration for dynamic widgets">
                <textarea
                  id="page-metadata"
                  className="fx-text-input min-h-[160px] font-mono text-xs"
                  value={pageDraft.metadata}
                  onChange={onDraftFieldChange('metadata')}
                />
              </FormField>
            </div>
          )}
        </Card>
      </div>

      <Card className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">Content blocks</h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={addBlock}
            disabled={creatingBlock || !selectedPageId || selectedPageId === NEW_PAGE_ID}
          >
            Add block
          </Button>
        </div>
        {selectedPageId === NEW_PAGE_ID ? (
          <p className="text-sm text-slate-500">Save the page to start adding content blocks.</p>
        ) : blocks.length === 0 ? (
          <p className="text-sm text-slate-500">No blocks configured for this page yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {blocks.map((block) => (
              <BlockEditor
                key={block.id}
                block={block}
                onChange={blockChangeHandler}
                onToggle={blockToggleHandler}
                onSave={saveBlock}
                onDelete={removeBlock}
                saving={Boolean(savingBlocks?.[block.id])}
              />
            ))}
          </div>
        )}
        <Card className="flex flex-col gap-4 border border-dashed border-slate-300 bg-slate-50">
          <h3 className="text-base font-semibold text-slate-900">New block</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Type" value={newBlockDraft.type} onChange={newBlockField('type')} />
            <TextInput label="Position" value={newBlockDraft.position} onChange={newBlockField('position')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Title" value={newBlockDraft.title} onChange={newBlockField('title')} />
            <TextInput label="Subtitle" value={newBlockDraft.subtitle} onChange={newBlockField('subtitle')} />
          </div>
          <FormField id="new-block-body" label="Body">
            <textarea
              id="new-block-body"
              className="fx-text-input min-h-[120px]"
              value={newBlockDraft.body}
              onChange={newBlockField('body')}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Layout" value={newBlockDraft.layout} onChange={newBlockField('layout')} />
            <TextInput label="Accent colour" value={newBlockDraft.accentColor} onChange={newBlockField('accentColor')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Background image" value={newBlockDraft.backgroundImageUrl} onChange={newBlockField('backgroundImageUrl')} />
            <TextInput label="Embed URL" value={newBlockDraft.embedUrl} onChange={newBlockField('embedUrl')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="CTA label" value={newBlockDraft.ctaLabel} onChange={newBlockField('ctaLabel')} />
            <TextInput label="CTA URL" value={newBlockDraft.ctaUrl} onChange={newBlockField('ctaUrl')} />
          </div>
          <TextInput label="Allowed roles" value={newBlockDraft.allowedRoles} onChange={newBlockField('allowedRoles')} />
          <FormField id="new-block-media" label="Media JSON">
            <textarea
              id="new-block-media"
              className="fx-text-input min-h-[120px] font-mono text-xs"
              value={newBlockDraft.media}
              onChange={newBlockField('media')}
            />
          </FormField>
          <FormField id="new-block-settings" label="Settings JSON">
            <textarea
              id="new-block-settings"
              className="fx-text-input min-h-[120px] font-mono text-xs"
              value={newBlockDraft.settings}
              onChange={newBlockField('settings')}
            />
          </FormField>
          <div className="flex items-center justify-between">
            <Checkbox
              label="Block visible"
              checked={newBlockDraft.isVisible}
              onChange={(event) => setNewBlockDraft((current) => ({ ...current, isVisible: event.target.checked }))}
            />
            <Button
              size="sm"
              variant="primary"
              onClick={addBlock}
              disabled={creatingBlock || !selectedPageId || selectedPageId === NEW_PAGE_ID}
            >
              Create block
            </Button>
          </div>
        </Card>
      </Card>
    </section>
  );
}

PageManager.propTypes = {
  pageSelection: PropTypes.array.isRequired,
  selectedPageId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectPage: PropTypes.func.isRequired,
  onCreatePage: PropTypes.func.isRequired,
  loadingPages: PropTypes.bool,
  pageDraft: PropTypes.object.isRequired,
  handleTitleChange: PropTypes.func.isRequired,
  handleSlugChange: PropTypes.func.isRequired,
  handleSlugBlur: PropTypes.func.isRequired,
  regenerateSlug: PropTypes.func.isRequired,
  handlePreviewChange: PropTypes.func.isRequired,
  handlePreviewBlur: PropTypes.func.isRequired,
  syncPreviewPath: PropTypes.func.isRequired,
  setPageDraft: PropTypes.func.isRequired,
  loadingPageDetail: PropTypes.bool,
  savePage: PropTypes.func.isRequired,
  savingPage: PropTypes.bool,
  deletePage: PropTypes.func.isRequired,
  blocks: PropTypes.array.isRequired,
  setBlocks: PropTypes.func.isRequired,
  saveBlock: PropTypes.func.isRequired,
  savingBlocks: PropTypes.object.isRequired,
  removeBlock: PropTypes.func.isRequired,
  newBlockDraft: PropTypes.object.isRequired,
  setNewBlockDraft: PropTypes.func.isRequired,
  addBlock: PropTypes.func.isRequired,
  creatingBlock: PropTypes.bool
};
