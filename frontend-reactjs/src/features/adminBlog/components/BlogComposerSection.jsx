import PropTypes from 'prop-types';

const BlogComposerSection = ({
  draft,
  facets,
  editingPostId,
  busy,
  onDraftChange,
  onMetadataChange,
  onAddMediaAsset,
  onMediaChange,
  onRemoveMediaAsset,
  onSubmitDraft,
  onSubmitWithStatus,
  onResetDraft
}) => (
  <div className="rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-glow">
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <h3 className="text-lg font-semibold text-primary">Compose post</h3>
      {editingPostId ? (
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold uppercase tracking-[0.3em] text-primary/60">Editing draft</span>
          <button
            type="button"
            onClick={onResetDraft}
            className="rounded-full border border-accent/20 px-3 py-1 font-semibold text-primary hover:border-accent"
          >
            Cancel editing
          </button>
        </div>
      ) : null}
    </div>
    <form
      className="mt-6 space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmitDraft();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
          Title
          <input
            type="text"
            value={draft.title}
            onChange={(event) => onDraftChange('title', event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
          Slug
          <input
            type="text"
            value={draft.slug}
            onChange={(event) => onDraftChange('slug', event.target.value)}
            placeholder="auto-generated if left blank"
            className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
          Status
          <select
            value={draft.status}
            onChange={(event) => onDraftChange('status', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
          Reading time (minutes)
          <input
            type="number"
            min="1"
            max="60"
            value={draft.readingTimeMinutes}
            onChange={(event) => onDraftChange('readingTimeMinutes', Number(event.target.value))}
            className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
          Publish date
          <input
            type="datetime-local"
            value={draft.publishedAt}
            onChange={(event) => onDraftChange('publishedAt', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
          Schedule date
          <input
            type="datetime-local"
            value={draft.scheduledAt}
            onChange={(event) => onDraftChange('scheduledAt', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>
      <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
        Executive summary
        <textarea
          value={draft.excerpt}
          onChange={(event) => onDraftChange('excerpt', event.target.value)}
          rows={3}
          placeholder="Short description shown on the blog landing page"
          className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </label>
      <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
        Article body
        <textarea
          value={draft.content}
          onChange={(event) => onDraftChange('content', event.target.value)}
          rows={10}
          required
          className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
          Hero image URL
          <input
            type="url"
            value={draft.heroImageUrl}
            onChange={(event) => onDraftChange('heroImageUrl', event.target.value)}
            placeholder="https://"
            className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
          Hero image alt text
          <input
            type="text"
            value={draft.heroImageAlt}
            onChange={(event) => onDraftChange('heroImageAlt', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
          Categories
          <select
            multiple
            value={draft.categories}
            onChange={(event) =>
              onDraftChange(
                'categories',
                Array.from(event.target.selectedOptions).map((option) => option.value)
              )
            }
            className="mt-2 h-32 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {facets.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
          Tags
          <select
            multiple
            value={draft.tags}
            onChange={(event) =>
              onDraftChange(
                'tags',
                Array.from(event.target.selectedOptions).map((option) => option.value)
              )
            }
            className="mt-2 h-32 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {facets.tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                #{tag.slug}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-primary/60">
          <span>Media gallery</span>
          <button
            type="button"
            onClick={onAddMediaAsset}
            className="rounded-full border border-accent/20 px-3 py-1 font-semibold text-primary hover:border-accent"
          >
            Add asset
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {draft.media.length === 0 ? (
            <p className="text-xs text-primary/50">
              Attach supporting images, embeds, or documents for this article. These assets power inline media widgets and hero
              galleries.
            </p>
          ) : null}
          {draft.media.map((asset, index) => (
            <div key={`media-${index}`} className="rounded-2xl border border-accent/10 bg-secondary/60 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-primary/60">
                  Asset URL
                  <input
                    type="url"
                    value={asset.url}
                    onChange={(event) => onMediaChange(index, 'url', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-primary/60">
                  Asset type
                  <select
                    value={asset.type}
                    onChange={(event) => onMediaChange(index, 'type', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="embed">Embed</option>
                    <option value="document">Document</option>
                  </select>
                </label>
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-primary/60">
                  Alt text
                  <input
                    type="text"
                    value={asset.altText}
                    onChange={(event) => onMediaChange(index, 'altText', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-primary/60">
                  Caption
                  <input
                    type="text"
                    value={asset.caption}
                    onChange={(event) => onMediaChange(index, 'caption', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-primary/60">
                  Credit
                  <input
                    type="text"
                    value={asset.credit}
                    onChange={(event) => onMediaChange(index, 'credit', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-primary/60">
                  Focal point
                  <input
                    type="text"
                    value={asset.focalPoint}
                    onChange={(event) => onMediaChange(index, 'focalPoint', event.target.value)}
                    placeholder="e.g. center"
                    className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => onRemoveMediaAsset(index)}
                  className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-700 hover:border-rose-300"
                >
                  Remove asset
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
          Meta title
          <input
            type="text"
            value={draft.metadata.metaTitle}
            onChange={(event) => onMetadataChange('metaTitle', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
          Meta description
          <input
            type="text"
            value={draft.metadata.metaDescription}
            onChange={(event) => onMetadataChange('metaDescription', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
          Canonical URL
          <input
            type="url"
            value={draft.metadata.canonicalUrl}
            onChange={(event) => onMetadataChange('canonicalUrl', event.target.value)}
            placeholder="https://"
            className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
          Open graph image URL
          <input
            type="url"
            value={draft.metadata.ogImageUrl}
            onChange={(event) => onMetadataChange('ogImageUrl', event.target.value)}
            placeholder="https://"
            className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
          Hero caption
          <input
            type="text"
            value={draft.metadata.heroCaption}
            onChange={(event) => onMetadataChange('heroCaption', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
          Preview subtitle
          <input
            type="text"
            value={draft.metadata.previewSubtitle}
            onChange={(event) => onMetadataChange('previewSubtitle', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
          Newsletter headline
          <input
            type="text"
            value={draft.metadata.newsletterHeadline}
            onChange={(event) => onMetadataChange('newsletterHeadline', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
            CTA label
            <input
              type="text"
              value={draft.metadata.callToActionLabel}
              onChange={(event) => onMetadataChange('callToActionLabel', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.3em] text-primary/60">
            CTA URL
            <input
              type="url"
              value={draft.metadata.callToActionUrl}
              onChange={(event) => onMetadataChange('callToActionUrl', event.target.value)}
              placeholder="https://"
              className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary">
          <input
            type="checkbox"
            checked={draft.metadata.featured}
            onChange={(event) => onMetadataChange('featured', event.target.checked)}
          />
          <span className="text-xs uppercase tracking-[0.3em]">Feature on homepage</span>
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary">
          <input
            type="checkbox"
            checked={draft.metadata.pinned}
            onChange={(event) => onMetadataChange('pinned', event.target.checked)}
          />
          <span className="text-xs uppercase tracking-[0.3em]">Pin to blog top</span>
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary">
          <input
            type="checkbox"
            checked={draft.metadata.sendToSubscribers}
            onChange={(event) => onMetadataChange('sendToSubscribers', event.target.checked)}
          />
          <span className="text-xs uppercase tracking-[0.3em]">Send to subscribers</span>
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-accent/20 bg-white px-4 py-3 text-sm text-primary">
          <input
            type="checkbox"
            checked={draft.metadata.allowComments}
            onChange={(event) => onMetadataChange('allowComments', event.target.checked)}
          />
          <span className="text-xs uppercase tracking-[0.3em]">Allow comments</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-3 pt-4">
        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-60"
          disabled={busy}
        >
          {editingPostId ? 'Update draft' : 'Save draft'}
        </button>
        <button
          type="button"
          onClick={() => onSubmitWithStatus('published')}
          className="rounded-full border border-emerald-300 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 hover:border-emerald-400 disabled:opacity-60"
          disabled={busy}
        >
          Publish now
        </button>
        <button
          type="button"
          onClick={onResetDraft}
          className="rounded-full border border-accent/20 px-5 py-2 text-sm font-semibold text-primary hover:border-accent"
        >
          Clear form
        </button>
      </div>
    </form>
  </div>
);

BlogComposerSection.propTypes = {
  draft: PropTypes.shape({
    title: PropTypes.string,
    slug: PropTypes.string,
    status: PropTypes.string,
    readingTimeMinutes: PropTypes.number,
    publishedAt: PropTypes.string,
    scheduledAt: PropTypes.string,
    excerpt: PropTypes.string,
    content: PropTypes.string,
    heroImageUrl: PropTypes.string,
    heroImageAlt: PropTypes.string,
    categories: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    tags: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    media: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string,
        type: PropTypes.string,
        altText: PropTypes.string,
        caption: PropTypes.string,
        credit: PropTypes.string,
        focalPoint: PropTypes.string
      })
    ),
    metadata: PropTypes.shape({
      metaTitle: PropTypes.string,
      metaDescription: PropTypes.string,
      canonicalUrl: PropTypes.string,
      ogImageUrl: PropTypes.string,
      previewSubtitle: PropTypes.string,
      heroCaption: PropTypes.string,
      newsletterHeadline: PropTypes.string,
      callToActionLabel: PropTypes.string,
      callToActionUrl: PropTypes.string,
      featured: PropTypes.bool,
      allowComments: PropTypes.bool,
      sendToSubscribers: PropTypes.bool,
      pinned: PropTypes.bool
    })
  }).isRequired,
  facets: PropTypes.shape({
    categories: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired
      })
    ),
    tags: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        slug: PropTypes.string.isRequired
      })
    )
  }).isRequired,
  editingPostId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  busy: PropTypes.bool.isRequired,
  onDraftChange: PropTypes.func.isRequired,
  onMetadataChange: PropTypes.func.isRequired,
  onAddMediaAsset: PropTypes.func.isRequired,
  onMediaChange: PropTypes.func.isRequired,
  onRemoveMediaAsset: PropTypes.func.isRequired,
  onSubmitDraft: PropTypes.func.isRequired,
  onSubmitWithStatus: PropTypes.func.isRequired,
  onResetDraft: PropTypes.func.isRequired
};

BlogComposerSection.defaultProps = {
  editingPostId: null
};

export default BlogComposerSection;
