import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Button from '../../../ui/Button.jsx';
import SegmentedControl from '../../../ui/SegmentedControl.jsx';
import StatusPill from '../../../ui/StatusPill.jsx';
import SignalModal from './SignalModal.jsx';

function SignalRow({ signal, onEdit, onArchive, onMove, canReorder, capabilities }) {
  const archived = signal.isActive === false;
  return (
    <tr className={`border-b border-slate-200 last:border-b-0 ${archived ? 'bg-secondary/40 text-slate-500' : ''}`}>
      <td className="px-4 py-3 align-top">
        <div className="font-semibold text-primary">{signal.label}</div>
        <div className="text-xs text-slate-500">Key: {signal.metricKey}</div>
      </td>
      <td className="px-4 py-3 align-top">
        <div className="text-sm font-semibold text-primary">{signal.valueLabel}</div>
        {signal.unit ? <div className="text-xs text-slate-500">Unit: {signal.unit}</div> : null}
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex flex-wrap gap-2">
          <StatusPill tone={signal.tone}>{signal.statusLabel ?? 'Monitor'}</StatusPill>
          {archived ? <StatusPill tone="warning">Archived</StatusPill> : null}
        </div>
      </td>
      <td className="px-4 py-3 align-top text-sm text-slate-600">
        <div>{signal.caption}</div>
        {signal.ownerRole ? <div className="mt-1 text-xs text-slate-500">Owner: {signal.ownerRole}</div> : null}
        {signal.runbookUrl ? (
          <Button
            as="a"
            href={signal.runbookUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="ghost"
            size="sm"
            icon={ArrowTopRightOnSquareIcon}
            iconPosition="end"
            className="mt-2 text-xs"
          >
            Open runbook
          </Button>
        ) : null}
      </td>
      <td className="px-4 py-3 align-top text-right">
        <div className="flex flex-wrap justify-end gap-2">
          {canReorder ? (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="px-2"
                icon={ArrowUpIcon}
                onClick={() => onMove(signal, 'up')}
                disabled={!capabilities?.canManageSignals}
                aria-label={`Move ${signal.label} up`}
              />
              <Button
                variant="ghost"
                size="sm"
                className="px-2"
                icon={ArrowDownIcon}
                onClick={() => onMove(signal, 'down')}
                disabled={!capabilities?.canManageSignals}
                aria-label={`Move ${signal.label} down`}
              />
            </div>
          ) : null}
          <Button
            variant="tertiary"
            size="sm"
            icon={PencilSquareIcon}
            onClick={() => onEdit(signal)}
            disabled={!capabilities?.canManageSignals}
            aria-label={`Edit ${signal.label}`}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={TrashIcon}
            onClick={() => onArchive(signal)}
            disabled={!capabilities?.canManageSignals || !signal?.id}
            aria-label={`Archive ${signal.label}`}
          >
            Archive
          </Button>
        </div>
      </td>
    </tr>
  );
}

SignalRow.propTypes = {
  signal: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  canReorder: PropTypes.bool.isRequired,
  capabilities: PropTypes.shape({
    canManageSignals: PropTypes.bool
  })
};

export default function SignalsSection({ signals, capabilities, onSave, onArchive, onReorder }) {
  const [filter, setFilter] = useState('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSignal, setEditingSignal] = useState(null);

  const filteredSignals = useMemo(
    () =>
      (signals ?? []).filter((signal) =>
        filter === 'archived' ? signal.isActive === false : signal.isActive !== false
      ),
    [signals, filter]
  );

  const handleEdit = (signal) => {
    setEditingSignal(signal);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingSignal(null);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    await onSave(payload, editingSignal?.id ?? null);
    setModalOpen(false);
    setEditingSignal(null);
  };

  const handleArchive = async (signal) => {
    if (!signal?.id) return;
    await onArchive(signal.id);
  };

  const handleMove = async (signal, direction) => {
    if (!signal?.id || !onReorder) return;
    const orderedIds = (signals ?? []).map((item) => item.id);
    const currentIndex = orderedIds.findIndex((id) => id === signal.id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= orderedIds.length) {
      return;
    }
    const nextOrder = [...orderedIds];
    [nextOrder[currentIndex], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[currentIndex]];
    await onReorder(nextOrder);
  };

  const canReorder = Boolean(onReorder) && (signals?.length ?? 0) > 1 && capabilities?.canManageSignals;

  return (
    <div className="space-y-4 rounded-3xl border border-accent/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-primary">Security signals</h4>
          <p className="text-sm text-slate-600">Live posture indicators with owner alignment and automated thresholds.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            name="signal-visibility"
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
            disabled={!capabilities?.canManageSignals}
          >
            Add signal
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Signal</th>
              <th className="px-4 py-3 font-semibold">Value</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Details</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSignals.map((signal) => (
              <SignalRow
                key={signal.id}
                signal={signal}
                onEdit={handleEdit}
                onArchive={handleArchive}
                onMove={handleMove}
                canReorder={canReorder}
                capabilities={capabilities}
              />
            ))}
            {filteredSignals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                  {filter === 'archived'
                    ? 'No archived signals yet. Archive posture signals to keep historical context without cluttering the live dashboard.'
                    : 'No security signals configured yet. Add your first metric to start tracking security posture.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <SignalModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingSignal(null);
        }}
        onSubmit={handleSubmit}
        signal={editingSignal}
        capabilities={capabilities}
      />
    </div>
  );
}

SignalsSection.propTypes = {
  signals: PropTypes.arrayOf(PropTypes.object),
  capabilities: PropTypes.shape({
    canManageSignals: PropTypes.bool
  }),
  onSave: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onReorder: PropTypes.func
};

SignalsSection.defaultProps = {
  signals: [],
  capabilities: null,
  onReorder: null
};
