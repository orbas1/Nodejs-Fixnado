import { useMemo } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Button, TextInput, StatusPill, Spinner } from '../../../../components/ui/index.js';
import { resolveStatusTone } from './ProviderSummaryGrid.jsx';

function ProviderDirectoryPanel({
  providers,
  selectedId,
  onSelect,
  filter,
  onFilterChange,
  loading,
  error,
  onRefresh,
  onToggleCreate,
  showCreate
}) {
  const filteredProviders = useMemo(() => {
    if (!filter) return providers;
    const query = filter.toLowerCase();
    return providers.filter((provider) =>
      [provider.displayName, provider.tradingName, provider.region?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [providers, filter]);

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-accent/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-primary">Provider directory</h3>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onRefresh} disabled={loading}>
              Refresh
            </Button>
            <Button size="sm" onClick={onToggleCreate} variant={showCreate ? 'secondary' : 'primary'}>
              {showCreate ? 'Close form' : 'Add provider'}
            </Button>
          </div>
        </div>
        <TextInput
          id="provider-search"
          name="provider-search"
          placeholder="Search providers"
          value={filter}
          onChange={(event) => onFilterChange(event.target.value)}
        />
        {error ? <StatusPill tone="danger">{error.message ?? 'Unable to load providers'}</StatusPill> : null}
      </div>
      <div className="relative flex-1 overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Spinner />
          </div>
        ) : null}
        <ul className="flex h-full flex-col gap-2 overflow-y-auto pr-1">
          {filteredProviders.length === 0 && !loading ? (
            <li className="rounded-xl border border-dashed border-accent/30 p-4 text-sm text-slate-500">
              No providers match your filters. Try refreshing or adjusting the search.
            </li>
          ) : null}
          {filteredProviders.map((provider) => (
            <li key={provider.id}>
              <button
                type="button"
                onClick={() => onSelect(provider.id)}
                className={clsx(
                  'w-full rounded-xl border p-4 text-left transition-colors',
                  provider.id === selectedId
                    ? 'border-accent bg-accent/10'
                    : 'border-slate-200 hover:border-accent/70 hover:bg-secondary'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary">{provider.displayName}</p>
                    <p className="text-xs text-slate-500">
                      {provider.region?.name ? `${provider.region.name} • ` : ''}
                      {provider.statusLabel}
                    </p>
                  </div>
                  <StatusPill tone={resolveStatusTone(provider.status)}>{provider.statusLabel}</StatusPill>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-[0.7rem] text-slate-500">
                  <div>
                    <dt className="font-medium text-slate-600">Coverage</dt>
                    <dd>{provider.coverageCount.toLocaleString()} zones</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-600">Compliance</dt>
                    <dd>{provider.complianceScore.toFixed(1)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-600">Contacts</dt>
                    <dd>{provider.contactCount.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-600">Jobs completed</dt>
                    <dd>{provider.jobsCompleted.toLocaleString()}</dd>
                  </div>
                </dl>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

ProviderDirectoryPanel.propTypes = {
  providers: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  filter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.instanceOf(Error),
  onRefresh: PropTypes.func.isRequired,
  onToggleCreate: PropTypes.func.isRequired,
  showCreate: PropTypes.bool
};

ProviderDirectoryPanel.defaultProps = {
  selectedId: null,
  loading: false,
  error: null,
  showCreate: false
};

export default ProviderDirectoryPanel;
