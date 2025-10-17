import { ArrowDownTrayIcon, PhotoIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Textarea from '../../../components/ui/Textarea.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import { useProviderInventory } from '../ProviderInventoryProvider.jsx';

export default function MediaManagementSection() {
  const {
    data: { selectedItem, itemMedia, mediaForm, mediaSaving, mediaFeedback, mediaError },
    actions: { handleMediaFieldChange, handleMediaEdit, resetMediaForm, handleMediaSubmit, handleMediaDelete }
  } = useProviderInventory();

  const hasSelectedItem = Boolean(selectedItem?.id);

  return (
    <Card padding="lg" className="space-y-6 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Pictures & marketing assets</h2>
          <p className="text-sm text-slate-600">
            Curate hero images and gallery shots for the active item. Upload URLs from the asset CDN or DAM and set alt text
            for accessibility.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={resetMediaForm}>
            New media asset
          </Button>
          <Button type="button" variant="ghost" size="sm" icon={ArrowDownTrayIcon} to="/admin/media">
            Open media library
          </Button>
        </div>
      </header>

      {mediaFeedback ? <StatusPill tone="success">{mediaFeedback}</StatusPill> : null}
      {mediaError ? <StatusPill tone="danger">{mediaError}</StatusPill> : null}
      {!hasSelectedItem ? (
        <StatusPill tone="info">Select an inventory item to manage pictures.</StatusPill>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {itemMedia.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500">
              No media assets uploaded yet.
            </div>
          ) : (
            itemMedia.map((media) => (
              <article
                key={media.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"
              >
                <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                  {media.url ? (
                    <img
                      src={media.url}
                      alt={media.altText || media.caption || 'Inventory media'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <PhotoIcon className="h-10 w-10 text-slate-400" />
                  )}
                </div>
                <div className="space-y-1 text-sm text-slate-600">
                  <p className="font-medium text-slate-800">{media.caption || 'Untitled asset'}</p>
                  <p className="text-xs text-slate-500">Alt text: {media.altText || '—'}</p>
                  <p className="text-xs text-slate-500">Sort order: {media.sortOrder ?? '—'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="xs" variant="secondary" onClick={() => handleMediaEdit(media)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    icon={TrashIcon}
                    iconPosition="start"
                    onClick={() => handleMediaDelete(media.id)}
                  >
                    Remove
                  </Button>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <header>
            <h3 className="text-lg font-semibold text-primary">{mediaForm.id ? 'Edit media asset' : 'Add media asset'}</h3>
            <p className="text-xs text-slate-500">
              Paste CDN URLs and enrich with captions or alt descriptions. Sort order controls gallery sequencing.
            </p>
          </header>
          <TextInput
            label="Asset URL"
            value={mediaForm.url}
            onChange={(event) => handleMediaFieldChange('url', event.target.value)}
            placeholder="https://cdn.fixnado.com/assets/tool.jpg"
            required
            disabled={!hasSelectedItem}
          />
          <TextInput
            label="Alt text"
            value={mediaForm.altText}
            onChange={(event) => handleMediaFieldChange('altText', event.target.value)}
            disabled={!hasSelectedItem}
          />
          <Textarea
            label="Caption"
            minRows={3}
            value={mediaForm.caption}
            onChange={(event) => handleMediaFieldChange('caption', event.target.value)}
            disabled={!hasSelectedItem}
          />
          <TextInput
            label="Sort order"
            type="number"
            value={mediaForm.sortOrder}
            onChange={(event) => handleMediaFieldChange('sortOrder', event.target.value)}
            disabled={!hasSelectedItem}
          />
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleMediaSubmit}
              disabled={!hasSelectedItem || mediaSaving}
            >
              {mediaSaving ? 'Saving…' : 'Save media'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={resetMediaForm}>
              Cancel
            </Button>
          </div>
        </section>
      </div>
    </Card>
  );
}
