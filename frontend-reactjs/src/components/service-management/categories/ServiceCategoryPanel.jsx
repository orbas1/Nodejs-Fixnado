import PropTypes from 'prop-types';
import Button from '../../ui/Button.jsx';
import StatusPill from '../../ui/StatusPill.jsx';

function ServiceCategoryPanel({
  categories,
  form,
  setForm,
  submitting,
  onSubmit,
  onCancel,
  onEdit,
  onArchive,
  editing
}) {
  const availableParents = editing
    ? categories.filter((category) => category.id !== editing.id)
    : categories;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Listings
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Active
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-primary">{category.name}</p>
                  <p className="text-xs text-slate-500">{category.description}</p>
                  <p className="mt-1 text-xs text-slate-400">Slug: {category.slug}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span
                        className="inline-flex h-3 w-3 rounded-full border border-slate-200"
                        style={{ backgroundColor: category.accentColour || '#cbd5f5' }}
                      />
                      Accent
                    </span>
                    <span>
                      Metadata keys:{' '}
                      {Object.keys(category.metadata ?? {}).length}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{category.servicesTotal}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{category.servicesActive}</td>
                <td className="px-4 py-3 text-sm">
                  <StatusPill tone={category.isActive ? 'success' : 'warning'}>
                    {category.isActive ? 'Active' : 'Archived'}
                  </StatusPill>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="xs" onClick={() => onEdit(category)} disabled={submitting}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="xs" onClick={() => onArchive(category)} disabled={submitting}>
                      Archive
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary">
          {editing ? 'Update category' : 'Create category'}
        </p>
        <form className="mt-4 space-y-5" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-600">
              Name
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-600">
              Slug
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                placeholder="auto-generated if blank"
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-600">
            Description
            <textarea
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              rows="3"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Internal and buyer-facing context"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-600">
              Icon reference
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={form.icon}
                onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
                placeholder="heroicon-outline:bolt"
              />
            </label>
            <label className="block text-sm font-medium text-slate-600">
              Accent colour
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                placeholder="#1f2937"
                value={form.accentColour}
                onChange={(event) => setForm((current) => ({ ...current, accentColour: event.target.value }))}
              />
            </label>
            <label className="block text-sm font-medium text-slate-600">
              Display order
              <input
                type="number"
                min="0"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={form.ordering}
                onChange={(event) => setForm((current) => ({ ...current, ordering: event.target.value }))}
              />
            </label>
            <label className="block text-sm font-medium text-slate-600">
              Parent category
              <select
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={form.parentId}
                onChange={(event) => setForm((current) => ({ ...current, parentId: event.target.value }))}
              >
                <option value="">Top level</option>
                {availableParents.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-600">
            Metadata (JSON)
            <textarea
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-mono focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              rows="4"
              value={form.metadata}
              onChange={(event) => setForm((current) => ({ ...current, metadata: event.target.value }))}
              placeholder="{\n  &quot;owner&quot;: &quot;catalogue-team&quot;\n}"
            />
            <p className="mt-1 text-xs text-slate-500">Use metadata to attach curation policies or routing tags.</p>
          </label>

          <label className="flex items-center gap-3 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-accent"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
            />
            Active in catalogue
          </label>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={submitting}>
              {editing ? 'Save changes' : 'Create category'}
            </Button>
            {editing ? (
              <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}

ServiceCategoryPanel.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      slug: PropTypes.string,
      icon: PropTypes.string,
      accentColour: PropTypes.string,
      parentId: PropTypes.string,
      metadata: PropTypes.object,
      servicesTotal: PropTypes.number,
      servicesActive: PropTypes.number,
      isActive: PropTypes.bool
    })
  ).isRequired,
  form: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string,
    description: PropTypes.string,
    icon: PropTypes.string,
    accentColour: PropTypes.string,
    parentId: PropTypes.string,
    ordering: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    metadata: PropTypes.string,
    isActive: PropTypes.bool
  }).isRequired,
  setForm: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  editing: PropTypes.shape({ id: PropTypes.string })
};

ServiceCategoryPanel.defaultProps = {
  submitting: false,
  editing: null
};

export default ServiceCategoryPanel;
