import PropTypes from 'prop-types';
import clsx from 'clsx';

function InboxSettingsForm({
  configuration,
  loading,
  saving,
  error,
  onFieldChange,
  onSubmit,
  onRefresh
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-slate-800">Inbox orchestration</h1>
          <p className="max-w-2xl text-sm text-slate-500">
            Configure routing, assistant branding, and quiet hours for every tenant inbox.
          </p>
        </div>
        <div
          className={clsx(
            'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg shadow-slate-900/20',
            configuration.liveRoutingEnabled ? 'bg-slate-900/90 text-white' : 'bg-slate-200 text-slate-600'
          )}
        >
          <span
            className={clsx(
              'inline-flex h-2 w-2 rounded-full',
              configuration.liveRoutingEnabled ? 'animate-pulse bg-emerald-400' : 'bg-slate-400'
            )}
            aria-hidden="true"
          />
          {configuration.liveRoutingEnabled ? 'Live routing enabled' : 'Live routing paused'}
        </div>
      </div>

      <form
        id="inbox-settings-form"
        onSubmit={onSubmit}
        className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Inbox controls</h2>
            <p className="mt-1 text-xs text-slate-500">
              Update routing, assistant branding, and quiet hours for this workspace.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            {saving ? 'Saving…' : loading ? 'Loading…' : null}
          </div>
        </div>
        {error ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        ) : null}
        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Loading inbox configuration…</p>
        ) : (
          <>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">AI display name</span>
                <input
                  type="text"
                  value={configuration.aiAssistDisplayName}
                  onChange={(event) => onFieldChange('aiAssistDisplayName', event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Assistant tagline</span>
                <input
                  type="text"
                  value={configuration.aiAssistDescription}
                  onChange={(event) => onFieldChange('aiAssistDescription', event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </label>
              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Default greeting</span>
                <textarea
                  rows={3}
                  value={configuration.defaultGreeting}
                  onChange={(event) => onFieldChange('defaultGreeting', event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Quiet hours start</span>
                <input
                  type="time"
                  value={configuration.quietHoursStart}
                  onChange={(event) => onFieldChange('quietHoursStart', event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Quiet hours end</span>
                <input
                  type="time"
                  value={configuration.quietHoursEnd}
                  onChange={(event) => onFieldChange('quietHoursEnd', event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Timezone</span>
                <input
                  type="text"
                  value={configuration.timezone}
                  onChange={(event) => onFieldChange('timezone', event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-sky-500"
                  checked={configuration.liveRoutingEnabled}
                  onChange={(event) => onFieldChange('liveRoutingEnabled', event.target.checked)}
                />
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Enable live routing</span>
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-400"
                disabled={saving}
              >
                Save configuration
              </button>
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                disabled={saving}
              >
                Refresh from source
              </button>
            </div>
          </>
        )}
      </form>
    </section>
  );
}

InboxSettingsForm.propTypes = {
  configuration: PropTypes.shape({
    liveRoutingEnabled: PropTypes.bool,
    defaultGreeting: PropTypes.string,
    aiAssistDisplayName: PropTypes.string,
    aiAssistDescription: PropTypes.string,
    timezone: PropTypes.string,
    quietHoursStart: PropTypes.string,
    quietHoursEnd: PropTypes.string
  }).isRequired,
  loading: PropTypes.bool,
  saving: PropTypes.bool,
  error: PropTypes.string,
  onFieldChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired
};

export default InboxSettingsForm;
