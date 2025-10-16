import PropTypes from 'prop-types';
import Button from '../../ui/Button.jsx';
import StatusPill from '../../ui/StatusPill.jsx';

const currencyOptions = [
  { value: 'GBP', label: 'GBP' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' }
];

function formatPrice(listing) {
  if (listing.price == null) {
    return '—';
  }
  const currency = listing.currency ?? 'GBP';
  return `${currency} ${Number(listing.price).toLocaleString()}`;
}

function ServiceListingPanel({
  categories,
  listings,
  allListings,
  form,
  setForm,
  submitting,
  onSubmit,
  onCancel,
  onEdit,
  onArchive,
  onStatusChange,
  editing,
  filterStatus,
  setFilterStatus,
  filterCategory,
  setFilterCategory,
  filterQuery,
  setFilterQuery,
  statusOptions,
  visibilityOptions,
  filterKind,
  setFilterKind,
  kindOptions
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-5 xl:grid-cols-6">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Status
          <select
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
          >
            <option value="all">All</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Category
          <select
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            value={filterCategory}
            onChange={(event) => setFilterCategory(event.target.value)}
          >
            <option value="all">All</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Kind
          <select
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            value={filterKind}
            onChange={(event) => setFilterKind(event.target.value)}
          >
            <option value="all">All</option>
            {kindOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500 md:col-span-2">
          Search
          <input
            type="search"
            placeholder="Filter by title or category"
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            value={filterQuery}
            onChange={(event) => setFilterQuery(event.target.value)}
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Listing
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Kind
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Price
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Visibility
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listings.map((listing) => {
              const metadataKeys = Object.keys(listing.metadata ?? {});
              const galleryCount = Array.isArray(listing.gallery) ? listing.gallery.length : 0;
              const coverageCount = Array.isArray(listing.coverage) ? listing.coverage.length : 0;

              return (
                <tr key={listing.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-primary">{listing.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{(listing.tags ?? []).join(', ') || 'No tags assigned'}</p>
                    <p className="mt-1 text-xs text-slate-400">Slug: {listing.slug}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {metadataKeys.length
                        ? `${metadataKeys.length} metadata field${metadataKeys.length === 1 ? '' : 's'}`
                        : 'No metadata'}
                      {' • '}
                      {galleryCount} asset{galleryCount === 1 ? '' : 's'} • {coverageCount} coverage region
                      {coverageCount === 1 ? '' : 's'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{listing.category ?? 'Uncategorised'}</td>
                  <td className="px-4 py-3 text-sm">
                    <StatusPill tone={listing.status === 'published' ? 'success' : listing.status === 'paused' ? 'warning' : 'info'}>
                      {listing.status}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <StatusPill tone={listing.kind === 'package' ? 'info' : 'neutral'}>
                      {listing.kind ? `${listing.kind.charAt(0).toUpperCase()}${listing.kind.slice(1)}` : 'Standard'}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatPrice(listing)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{listing.visibility ?? 'restricted'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" size="xs" onClick={() => onEdit(listing)} disabled={submitting}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() =>
                          onStatusChange(listing, listing.status === 'published' ? 'paused' : 'published')
                        }
                        disabled={submitting}
                      >
                        {listing.status === 'published' ? 'Pause' : 'Publish'}
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => onArchive(listing)} disabled={submitting}>
                        Archive
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {listings.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">No listings match the selected filters.</div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary">
          {editing ? 'Update listing' : 'Create listing'}
        </p>
        <form className="mt-4 space-y-6" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-sm font-medium text-slate-600">
              Title
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Slug
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                placeholder="auto-generated if left blank"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Price
              <input
                type="number"
                min="0"
                step="0.01"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={form.price}
                onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Currency
              <select
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={form.currency}
                onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}
              >
                {currencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-600">
              Status
              <select
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-600">
              Visibility
              <select
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={form.visibility}
                onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}
              >
                {visibilityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-600">
              Kind
              <select
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={form.kind}
                onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))}
              >
                {kindOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-sm font-medium text-slate-600">
              Company ID
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={form.companyId}
                onChange={(event) => setForm((current) => ({ ...current, companyId: event.target.value }))}
                placeholder="Required if no provider"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Provider ID
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={form.providerId}
                onChange={(event) => setForm((current) => ({ ...current, providerId: event.target.value }))}
                placeholder="Optional"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Category
              <select
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={form.categoryId}
                onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
              >
                <option value="">Uncategorised</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-600 md:col-span-2 xl:col-span-3">
              Hero image URL
              <input
                type="url"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={form.heroImageUrl}
                onChange={(event) => setForm((current) => ({ ...current, heroImageUrl: event.target.value }))}
                placeholder="https://…"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">
              Coverage regions
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={form.coverage}
                onChange={(event) => setForm((current) => ({ ...current, coverage: event.target.value }))}
                placeholder="Comma separated"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Tags
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={form.tags}
                onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                placeholder="Comma separated"
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
              placeholder="Narrative used across marketplace touch-points"
            />
          </label>

          <label className="block text-sm font-medium text-slate-600">
            Gallery assets
            <textarea
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40 font-mono"
              rows="3"
              value={form.gallery}
              onChange={(event) => setForm((current) => ({ ...current, gallery: event.target.value }))}
              placeholder="https://example.com/image.jpg | Alt text"
            />
            <p className="mt-1 text-xs text-slate-500">One entry per line. Append “| alt text” to describe the asset.</p>
          </label>

          <label className="block text-sm font-medium text-slate-600">
            Metadata (JSON)
            <textarea
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-mono focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              rows="4"
              value={form.metadata}
              onChange={(event) => setForm((current) => ({ ...current, metadata: event.target.value }))}
              placeholder="{\n  &quot;slaHours&quot;: 4\n}"
            />
            <p className="mt-1 text-xs text-slate-500">Store operational context such as escalation contacts or SLA windows.</p>
          </label>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={submitting}>
              {editing ? 'Save listing' : 'Create listing'}
            </Button>
            {editing ? (
              <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
        {allListings.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Create your first listing to populate the catalogue view.
          </p>
        ) : null}
      </div>
    </div>
  );
}

ServiceListingPanel.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  listings: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      slug: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string),
      status: PropTypes.string,
      kind: PropTypes.string,
      price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      currency: PropTypes.string,
      visibility: PropTypes.string,
      category: PropTypes.string,
      categoryId: PropTypes.string,
      gallery: PropTypes.arrayOf(
        PropTypes.shape({ url: PropTypes.string, altText: PropTypes.string })
      ),
      coverage: PropTypes.arrayOf(PropTypes.string),
      metadata: PropTypes.object
    })
  ).isRequired,
  allListings: PropTypes.array.isRequired,
  form: PropTypes.shape({
    title: PropTypes.string,
    slug: PropTypes.string,
    description: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    status: PropTypes.string,
    visibility: PropTypes.string,
    kind: PropTypes.string,
    companyId: PropTypes.string,
    providerId: PropTypes.string,
    categoryId: PropTypes.string,
    heroImageUrl: PropTypes.string,
    coverage: PropTypes.string,
    tags: PropTypes.string,
    gallery: PropTypes.string,
    metadata: PropTypes.string
  }).isRequired,
  setForm: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  editing: PropTypes.shape({ id: PropTypes.string }),
  filterStatus: PropTypes.string.isRequired,
  setFilterStatus: PropTypes.func.isRequired,
  filterCategory: PropTypes.string.isRequired,
  setFilterCategory: PropTypes.func.isRequired,
  filterQuery: PropTypes.string.isRequired,
  setFilterQuery: PropTypes.func.isRequired,
  statusOptions: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired,
  visibilityOptions: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired,
  filterKind: PropTypes.string.isRequired,
  setFilterKind: PropTypes.func.isRequired,
  kindOptions: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired
};

ServiceListingPanel.defaultProps = {
  submitting: false,
  editing: null
};

export default ServiceListingPanel;
