import { useState } from 'react';
import PropTypes from 'prop-types';
import ProviderSummaryGrid from './components/ProviderSummaryGrid.jsx';
import ProviderDirectoryPanel from './components/ProviderDirectoryPanel.jsx';
import CreateProviderForm from './components/CreateProviderForm.jsx';
import ProviderDetailWorkspace from './components/ProviderDetailWorkspace.jsx';

function ProviderManagementSection({ section }) {
  const data = section.data ?? {};
  const {
    loading,
    list = [],
    summary,
    enums = {},
    error,
    detailLoading,
    detailError,
    selected,
    selectedId,
    handlers = {}
  } = data;

  const [filter, setFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [savingCreate, setSavingCreate] = useState(false);

  const handleCreate = async (payload) => {
    try {
      setSavingCreate(true);
      setCreateError(null);
      const result = await handlers.onCreateProvider?.(payload);
      if (result?.company?.id) {
        setShowCreateForm(false);
        setFilter('');
      }
    } catch (error_) {
      setCreateError(error_ instanceof Error ? error_.message : 'Unable to create provider');
    } finally {
      setSavingCreate(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProviderSummaryGrid summary={summary} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr] xl:grid-cols-[minmax(0,360px)_1fr]">
        <div className="min-h-[24rem]">
          <ProviderDirectoryPanel
            providers={list}
            selectedId={selectedId}
            onSelect={(id) => handlers.onSelectProvider?.(id)}
            filter={filter}
            onFilterChange={setFilter}
            loading={Boolean(loading)}
            error={error}
            onRefresh={() => handlers.onRefreshDirectory?.()}
            onToggleCreate={() => setShowCreateForm((current) => !current)}
            showCreate={showCreateForm}
          />
          {showCreateForm ? (
            <div className="mt-4">
              <CreateProviderForm
                enums={enums}
                onSubmit={handleCreate}
                onCancel={() => setShowCreateForm(false)}
                saving={savingCreate}
                error={createError}
              />
            </div>
          ) : null}
        </div>
        <ProviderDetailWorkspace
          selected={selected}
          enums={enums}
          detailLoading={detailLoading}
          detailError={detailError}
          handlers={handlers}
        />
      </div>
    </div>
  );
}

ProviderManagementSection.propTypes = {
  section: PropTypes.shape({
    data: PropTypes.shape({
      loading: PropTypes.bool,
      list: PropTypes.array,
      summary: PropTypes.object,
      enums: PropTypes.object,
      error: PropTypes.instanceOf(Error),
      detailLoading: PropTypes.bool,
      detailError: PropTypes.instanceOf(Error),
      selected: PropTypes.object,
      selectedId: PropTypes.string,
      handlers: PropTypes.shape({
        onRefreshDirectory: PropTypes.func,
        onSelectProvider: PropTypes.func,
        onCreateProvider: PropTypes.func,
        onUpdateProvider: PropTypes.func,
        onUpsertContact: PropTypes.func,
        onDeleteContact: PropTypes.func,
        onUpsertCoverage: PropTypes.func,
        onDeleteCoverage: PropTypes.func,
        onArchiveProvider: PropTypes.func
      })
    })
  }).isRequired
};

export default ProviderManagementSection;
