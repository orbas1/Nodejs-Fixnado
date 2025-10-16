import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowTopRightOnSquareIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '../../../ui/Button.jsx';
import SegmentedControl from '../../../ui/SegmentedControl.jsx';
import StatusPill from '../../../ui/StatusPill.jsx';
import ConnectorModal from './ConnectorModal.jsx';

function ConnectorCard({ connector, onEdit, onArchive, capabilities }) {
  const archived = connector.isActive === false;
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${archived ? 'border-dashed border-accent/30 bg-secondary/40' : 'border-accent/10 bg-white'}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h5 className="text-base font-semibold text-primary">{connector.name}</h5>
          <p className="text-xs uppercase tracking-wide text-slate-500">{connector.connectorType}</p>
        </div>
        <StatusPill tone={connector.status === 'healthy' ? 'success' : connector.status === 'warning' ? 'warning' : 'danger'}>
          {connector.status}
        </StatusPill>
      </div>
      {connector.description ? <p className="mt-3 text-sm text-slate-600">{connector.description}</p> : null}
      <dl className="mt-3 space-y-2 text-xs text-slate-500">
        {connector.region ? (
          <div className="flex items-center justify-between">
            <dt className="font-semibold">Region</dt>
            <dd>{connector.region}</dd>
          </div>
        ) : null}
        {connector.ingestionEndpoint ? (
          <div className="flex items-center justify-between">
            <dt className="font-semibold">Endpoint</dt>
            <dd className="truncate" title={connector.ingestionEndpoint}>
              {connector.ingestionEndpoint}
            </dd>
          </div>
        ) : null}
        {connector.eventsPerMinuteTarget != null || connector.eventsPerMinuteActual != null ? (
          <div className="flex items-center justify-between">
            <dt className="font-semibold">Events / min</dt>
            <dd>
              {connector.eventsPerMinuteActual?.toLocaleString?.() ?? '—'} /{' '}
              {connector.eventsPerMinuteTarget?.toLocaleString?.() ?? '—'}
            </dd>
          </div>
        ) : null}
        {connector.lastHealthCheckAt ? (
          <div className="flex items-center justify-between">
            <dt className="font-semibold">Last health</dt>
            <dd>{connector.lastHealthCheckAt}</dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {connector.dashboardUrl ? (
          <Button
            as="a"
            href={connector.dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
            size="sm"
            icon={ArrowTopRightOnSquareIcon}
            iconPosition="end"
          >
            Open dashboard
          </Button>
        ) : null}
        <Button
          variant="tertiary"
          size="sm"
          icon={PencilSquareIcon}
          onClick={() => onEdit(connector)}
          disabled={!capabilities?.canManageConnectors}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={TrashIcon}
          onClick={() => onArchive(connector)}
          disabled={!capabilities?.canManageConnectors || !connector?.id}
        >
          Archive
        </Button>
      </div>
    </div>
  );
}

ConnectorCard.propTypes = {
  connector: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  capabilities: PropTypes.shape({
    canManageConnectors: PropTypes.bool
  })
};

export default function ConnectorsSection({ connectors, capabilities, onSave, onArchive }) {
  const [filter, setFilter] = useState('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConnector, setEditingConnector] = useState(null);

  const filteredConnectors = useMemo(
    () =>
      (connectors ?? []).filter((connector) =>
        filter === 'archived' ? connector.isActive === false : connector.isActive !== false
      ),
    [connectors, filter]
  );

  const handleEdit = (connector) => {
    setEditingConnector(connector);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingConnector(null);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    await onSave(payload, editingConnector?.id ?? null);
    setModalOpen(false);
    setEditingConnector(null);
  };

  const handleArchive = async (connector) => {
    if (!connector?.id) return;
    await onArchive(connector.id);
  };

  return (
    <div className="space-y-4 rounded-3xl border border-accent/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-primary">Telemetry connectors</h4>
          <p className="text-sm text-slate-600">Review SIEM, observability, and data lake connectors powering posture analytics.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            name="connector-visibility"
            value={filter}
            onChange={setFilter}
            size="sm"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'archived', label: 'Archived' }
            ]}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreate}
            disabled={!capabilities?.canManageConnectors}
          >
            Add connector
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredConnectors.map((connector) => (
          <ConnectorCard
            key={connector.id}
            connector={connector}
            onEdit={handleEdit}
            onArchive={handleArchive}
            capabilities={capabilities}
          />
        ))}
        {filteredConnectors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-accent/30 bg-secondary/60 p-6 text-sm text-slate-500">
            {filter === 'archived'
              ? 'No archived connectors yet. Archive connectors to retain configuration history.'
              : 'No connectors registered yet. Log your first connector to keep track of ingestion health and endpoints.'}
          </div>
        ) : null}
      </div>
      <ConnectorModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingConnector(null);
        }}
        onSubmit={handleSubmit}
        connector={editingConnector}
        capabilities={capabilities}
      />
    </div>
  );
}

ConnectorsSection.propTypes = {
  connectors: PropTypes.arrayOf(PropTypes.object),
  capabilities: PropTypes.shape({
    canManageConnectors: PropTypes.bool
  }),
  onSave: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired
};

ConnectorsSection.defaultProps = {
  connectors: [],
  capabilities: null
};
