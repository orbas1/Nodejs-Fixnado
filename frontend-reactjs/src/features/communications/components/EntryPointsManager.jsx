import PropTypes from 'prop-types';
import clsx from 'clsx';

function EntryPointsManager({
  entryPoints,
  dirtyMap,
  savingMap,
  deletingMap,
  onFieldChange,
  onToggle,
  onSave,
  onReset,
  onDelete,
  onTemplateSelect,
  newEntryPoint,
  onNewEntryPointChange,
  onNewEntryPointSubmit,
  onNewEntryPointReset,
  creatingEntryPoint
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Entry points</h2>
          <p className="mt-1 text-xs text-slate-500">
            Launch chat widgets across storefronts, booking flows, and in-product journeys.
          </p>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
          {entryPoints.length} configured
        </span>
      </div>

      <form onSubmit={onNewEntryPointSubmit} className="mt-4 space-y-3 rounded-2xl bg-slate-50/70 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Key
            <input
              type="text"
              value={newEntryPoint.key}
              onChange={(event) => onNewEntryPointChange('key', event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              placeholder="support-widget"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Label
            <input
              type="text"
              value={newEntryPoint.label}
              onChange={(event) => onNewEntryPointChange('label', event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              placeholder="In-app chat"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 sm:col-span-2">
            Description
            <textarea
              rows={2}
              value={newEntryPoint.description}
              onChange={(event) => onNewEntryPointChange('description', event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              placeholder="Visible on every storefront"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Icon
            <input
              type="text"
              value={newEntryPoint.icon}
              onChange={(event) => onNewEntryPointChange('icon', event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              placeholder="💬"
              maxLength={8}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Display order
            <input
              type="number"
              value={newEntryPoint.displayOrder}
              onChange={(event) => onNewEntryPointChange('displayOrder', event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              placeholder="Auto"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Default message
          <textarea
            rows={3}
            value={newEntryPoint.defaultMessage}
            onChange={(event) => onNewEntryPointChange('defaultMessage', event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            placeholder="Welcome in!"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            CTA label
            <input
              type="text"
              value={newEntryPoint.ctaLabel}
              onChange={(event) => onNewEntryPointChange('ctaLabel', event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              placeholder="Open dashboard"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            CTA URL
            <input
              type="url"
              value={newEntryPoint.ctaUrl}
              onChange={(event) => onNewEntryPointChange('ctaUrl', event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              placeholder="https://..."
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Image URL
            <input
              type="url"
              value={newEntryPoint.imageUrl}
              onChange={(event) => onNewEntryPointChange('imageUrl', event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              placeholder="https://cdn.fixnado.com/widget.png"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 accent-sky-500"
              checked={newEntryPoint.enabled}
              onChange={(event) => onNewEntryPointChange('enabled', event.target.checked)}
            />
            <span>Enabled by default</span>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-sky-200 transition hover:bg-sky-400"
            disabled={creatingEntryPoint}
          >
            {creatingEntryPoint ? 'Creating…' : 'Add entry point'}
          </button>
          <button
            type="button"
            onClick={onNewEntryPointReset}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            disabled={creatingEntryPoint}
          >
            Reset form
          </button>
        </div>
      </form>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {entryPoints.map((entry) => {
          const isDirty = Boolean(dirtyMap[entry.id]);
          const isSaving = Boolean(savingMap[entry.id]);
          const isDeleting = Boolean(deletingMap[entry.id]);
          return (
            <div key={entry.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex w-full max-w-[70%] items-start gap-3 text-left">
                  <input
                    type="text"
                    value={entry.icon || ''}
                    onChange={(event) => onFieldChange(entry.id, 'icon', event.target.value)}
                    className="w-14 rounded-lg border border-slate-200 px-3 py-2 text-center text-lg"
                    placeholder="💬"
                    maxLength={8}
                  />
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={entry.label}
                      onChange={(event) => onFieldChange(entry.id, 'label', event.target.value)}
                      className="w-full rounded-lg border border-transparent bg-transparent text-sm font-semibold text-slate-900 focus:border-sky-200 focus:outline-none focus:ring-0"
                    />
                    <input
                      type="text"
                      value={entry.description || ''}
                      onChange={(event) => onFieldChange(entry.id, 'description', event.target.value)}
                      className="w-full rounded-lg border border-transparent bg-transparent text-xs text-slate-500 focus:border-sky-200 focus:outline-none focus:ring-0"
                      placeholder="Entry point description"
                    />
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.3em]">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500">Key: {entry.key}</span>
                      {isDirty ? (
                        <span className="font-semibold text-amber-500">Unsaved changes</span>
                      ) : (
                        <span className="font-semibold text-emerald-500">Saved</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggle(entry.id)}
                  aria-pressed={entry.enabled}
                  disabled={isSaving || isDeleting}
                  className={clsx(
                    'rounded-full border px-3 py-1 text-xs font-semibold transition',
                    entry.enabled ? 'border-sky-300 bg-sky-50 text-sky-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  )}
                >
                  {entry.enabled ? 'On' : 'Off'}
                </button>
              </div>
              <textarea
                rows={3}
                value={entry.defaultMessage || ''}
                onChange={(event) => onFieldChange(entry.id, 'defaultMessage', event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
                placeholder="Greeting sent when customers open this entry point"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={entry.ctaLabel || ''}
                  onChange={(event) => onFieldChange(entry.id, 'ctaLabel', event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700"
                  placeholder="CTA label"
                />
                <input
                  type="url"
                  value={entry.ctaUrl || ''}
                  onChange={(event) => onFieldChange(entry.id, 'ctaUrl', event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700"
                  placeholder="https://..."
                />
                <input
                  type="url"
                  value={entry.imageUrl || ''}
                  onChange={(event) => onFieldChange(entry.id, 'imageUrl', event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700"
                  placeholder="Image URL"
                />
                <input
                  type="number"
                  value={entry.displayOrder ?? ''}
                  onChange={(event) => onFieldChange(entry.id, 'displayOrder', event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700"
                  placeholder="Display order"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onTemplateSelect(entry.defaultMessage)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                >
                  Use greeting in composer
                </button>
                <button
                  type="button"
                  onClick={() => onSave(entry.id)}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => onReset(entry.id)}
                  disabled={isSaving || isDeleting}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Remove this entry point?')) {
                      onDelete(entry.id);
                    }
                  }}
                  disabled={isSaving || isDeleting}
                  className="inline-flex items-center justify-center rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-500 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:border-red-100 disabled:text-red-200"
                >
                  {isDeleting ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

EntryPointsManager.propTypes = {
  entryPoints: PropTypes.arrayOf(PropTypes.object).isRequired,
  dirtyMap: PropTypes.object.isRequired,
  savingMap: PropTypes.object.isRequired,
  deletingMap: PropTypes.object.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onTemplateSelect: PropTypes.func.isRequired,
  newEntryPoint: PropTypes.shape({
    key: PropTypes.string,
    label: PropTypes.string,
    description: PropTypes.string,
    icon: PropTypes.string,
    defaultMessage: PropTypes.string,
    ctaLabel: PropTypes.string,
    ctaUrl: PropTypes.string,
    imageUrl: PropTypes.string,
    displayOrder: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    enabled: PropTypes.bool
  }).isRequired,
  onNewEntryPointChange: PropTypes.func.isRequired,
  onNewEntryPointSubmit: PropTypes.func.isRequired,
  onNewEntryPointReset: PropTypes.func.isRequired,
  creatingEntryPoint: PropTypes.bool.isRequired
};

export default EntryPointsManager;
