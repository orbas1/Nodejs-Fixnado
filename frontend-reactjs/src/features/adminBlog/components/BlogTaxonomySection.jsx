import PropTypes from 'prop-types';

const BlogTaxonomySection = ({
  categoryForm,
  categoryEditor,
  categories,
  onCategoryFormChange,
  onAddCategory,
  onResetCategoryForm,
  onStartCategoryEdit,
  onCategoryEditorChange,
  onUpdateCategory,
  onCancelCategoryEdit,
  onRemoveCategory,
  tagForm,
  tagEditor,
  tags,
  onTagFormChange,
  onAddTag,
  onResetTagForm,
  onStartTagEdit,
  onTagEditorChange,
  onUpdateTag,
  onCancelTagEdit,
  onRemoveTag,
  taxonomyBusy
}) => (
  <div className="space-y-6">
    <div className="rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-glow">
      <h3 className="text-lg font-semibold text-primary">Categories</h3>
      <p className="mt-2 text-xs text-primary/60">
        Organise stories into navigable groups and control the display order across the public blog and dashboards.
      </p>
      <div className="mt-4 space-y-3">
        <div className="grid gap-3">
          <input
            type="text"
            value={categoryForm.name}
            onChange={(event) => onCategoryFormChange('name', event.target.value)}
            placeholder="Category name"
            className="rounded-2xl border border-accent/20 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="text"
            value={categoryForm.slug}
            onChange={(event) => onCategoryFormChange('slug', event.target.value)}
            placeholder="Slug (optional)"
            className="rounded-2xl border border-accent/20 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <textarea
            value={categoryForm.description}
            onChange={(event) => onCategoryFormChange('description', event.target.value)}
            rows={2}
            placeholder="Internal description"
            className="rounded-2xl border border-accent/20 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="number"
            value={categoryForm.displayOrder}
            onChange={(event) => onCategoryFormChange('displayOrder', Number(event.target.value))}
            placeholder="Display order"
            className="rounded-2xl border border-accent/20 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onAddCategory}
              className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow hover:bg-primary/90 disabled:opacity-60"
              disabled={taxonomyBusy}
            >
              Add category
            </button>
            <button
              type="button"
              onClick={onResetCategoryForm}
              className="rounded-full border border-accent/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary hover:border-accent"
            >
              Reset
            </button>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {categories.map((category) => (
            <li key={category.id} className="rounded-2xl border border-accent/10 bg-secondary/60 p-4">
              {categoryEditor?.id === category.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={categoryEditor.name}
                    onChange={(event) => onCategoryEditorChange('name', event.target.value)}
                    className="w-full rounded-2xl border border-accent/20 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <input
                    type="text"
                    value={categoryEditor.slug}
                    onChange={(event) => onCategoryEditorChange('slug', event.target.value)}
                    className="w-full rounded-2xl border border-accent/20 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <textarea
                    value={categoryEditor.description}
                    onChange={(event) => onCategoryEditorChange('description', event.target.value)}
                    rows={2}
                    className="w-full rounded-2xl border border-accent/20 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <input
                    type="number"
                    value={categoryEditor.displayOrder}
                    onChange={(event) => onCategoryEditorChange('displayOrder', Number(event.target.value))}
                    className="w-full rounded-2xl border border-accent/20 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={onUpdateCategory}
                      className="rounded-full bg-primary px-3 py-1 font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-60"
                      disabled={taxonomyBusy}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={onCancelCategoryEdit}
                      className="rounded-full border border-accent/20 px-3 py-1 font-semibold text-primary hover:border-accent"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-primary">{category.name}</p>
                    <p className="text-xs text-primary/60">/{category.slug} • Order {category.displayOrder}</p>
                    {category.description ? (
                      <p className="text-xs text-primary/50">{category.description}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        onStartCategoryEdit({
                          id: category.id,
                          name: category.name,
                          slug: category.slug,
                          description: category.description ?? '',
                          displayOrder: category.displayOrder ?? 0
                        })
                      }
                      className="rounded-full border border-accent/20 px-3 py-1 font-semibold text-primary hover:border-accent"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveCategory(category.id)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-semibold text-rose-700 hover:border-rose-300 disabled:opacity-60"
                      disabled={taxonomyBusy}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>

    <div className="rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-glow">
      <h3 className="text-lg font-semibold text-primary">Tags</h3>
      <p className="mt-2 text-xs text-primary/60">Surface cross-cutting topics and enable role-specific dashboards.</p>
      <div className="mt-4 space-y-3">
        <div className="grid gap-3">
          <input
            type="text"
            value={tagForm.name}
            onChange={(event) => onTagFormChange('name', event.target.value)}
            placeholder="Tag name"
            className="rounded-2xl border border-accent/20 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="text"
            value={tagForm.slug}
            onChange={(event) => onTagFormChange('slug', event.target.value)}
            placeholder="Slug (optional)"
            className="rounded-2xl border border-accent/20 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onAddTag}
              className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow hover:bg-primary/90 disabled:opacity-60"
              disabled={taxonomyBusy}
            >
              Add tag
            </button>
            <button
              type="button"
              onClick={onResetTagForm}
              className="rounded-full border border-accent/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary hover:border-accent"
            >
              Reset
            </button>
          </div>
        </div>
        <ul className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-primary/60">
          {tags.map((tag) => (
            <li key={tag.id} className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-primary">
              #{tag.slug}
              {tagEditor?.id === tag.id ? null : (
                <button
                  type="button"
                  onClick={() => onStartTagEdit({ id: tag.id, name: tag.name, slug: tag.slug })}
                  className="text-[0.6rem] uppercase"
                >
                  Edit
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemoveTag(tag.id)}
                className="text-[0.6rem] uppercase"
                disabled={taxonomyBusy}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        {tagEditor ? (
          <div className="rounded-2xl border border-accent/20 bg-secondary/60 p-4 text-xs text-primary">
            <p className="font-semibold uppercase tracking-[0.3em]">Edit tag</p>
            <input
              type="text"
              value={tagEditor.name}
              onChange={(event) => onTagEditorChange('name', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              type="text"
              value={tagEditor.slug}
              onChange={(event) => onTagEditorChange('slug', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-accent/20 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={onUpdateTag}
                className="rounded-full bg-primary px-3 py-1 font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-60"
                disabled={taxonomyBusy}
              >
                Save
              </button>
              <button
                type="button"
                onClick={onCancelTagEdit}
                className="rounded-full border border-accent/20 px-3 py-1 font-semibold text-primary hover:border-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>

    <div className="rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-glow">
      <h3 className="text-lg font-semibold text-primary">Publishing checklist</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-primary/70">
        <li>Verify hero media has descriptive alt text and captions.</li>
        <li>Ensure canonical URL points to the primary location for the story.</li>
        <li>Preview the article in a new tab to validate formatting and embeds.</li>
        <li>Confirm categories and tags align with role-based dashboards.</li>
        <li>Schedule newsletter distribution only when the hero image is final.</li>
      </ul>
    </div>
  </div>
);

BlogTaxonomySection.propTypes = {
  categoryForm: PropTypes.shape({
    name: PropTypes.string,
    slug: PropTypes.string,
    description: PropTypes.string,
    displayOrder: PropTypes.number
  }).isRequired,
  categoryEditor: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    slug: PropTypes.string,
    description: PropTypes.string,
    displayOrder: PropTypes.number
  }),
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string,
      description: PropTypes.string,
      displayOrder: PropTypes.number
    })
  ).isRequired,
  onCategoryFormChange: PropTypes.func.isRequired,
  onAddCategory: PropTypes.func.isRequired,
  onResetCategoryForm: PropTypes.func.isRequired,
  onStartCategoryEdit: PropTypes.func.isRequired,
  onCategoryEditorChange: PropTypes.func.isRequired,
  onUpdateCategory: PropTypes.func.isRequired,
  onCancelCategoryEdit: PropTypes.func.isRequired,
  onRemoveCategory: PropTypes.func.isRequired,
  tagForm: PropTypes.shape({
    name: PropTypes.string,
    slug: PropTypes.string
  }).isRequired,
  tagEditor: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    slug: PropTypes.string
  }),
  tags: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired
    })
  ).isRequired,
  onTagFormChange: PropTypes.func.isRequired,
  onAddTag: PropTypes.func.isRequired,
  onResetTagForm: PropTypes.func.isRequired,
  onStartTagEdit: PropTypes.func.isRequired,
  onTagEditorChange: PropTypes.func.isRequired,
  onUpdateTag: PropTypes.func.isRequired,
  onCancelTagEdit: PropTypes.func.isRequired,
  onRemoveTag: PropTypes.func.isRequired,
  taxonomyBusy: PropTypes.bool.isRequired
};

BlogTaxonomySection.defaultProps = {
  categoryEditor: null,
  tagEditor: null
};

export default BlogTaxonomySection;
