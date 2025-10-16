import PropTypes from 'prop-types';
import { PlusIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button, SegmentedControl, TextInput, StatusPill } from '../../ui/index.js';
import {
  STATUS_OPTIONS,
  FREQUENCY_LABELS,
  STATUS_TONE,
  DUE_TONE,
  CONTROL_TYPE_LABELS,
  CATEGORY_LABELS
} from './constants.js';

function ComplianceControlsTable({
  loading,
  error,
  statusFilter,
  onStatusChange,
  frequencyFilter,
  frequencyOptions,
  onFrequencyChange,
  searchTerm,
  onSearchTermChange,
  onCreate,
  onRefresh,
  filteredControls,
  onEdit,
  onDelete
}) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-accent/10 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            name="Status filter"
            value={statusFilter}
            onChange={onStatusChange}
            options={STATUS_OPTIONS}
            size="sm"
          />
          <SegmentedControl
            name="Cadence filter"
            value={frequencyFilter}
            onChange={onFrequencyChange}
            options={frequencyOptions}
            size="sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TextInput
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search controls"
            aria-label="Search compliance controls"
          />
          <Button variant="primary" onClick={onCreate} icon={PlusIcon}>
            Add control
          </Button>
          <Button variant="secondary" onClick={onRefresh} icon={ArrowPathIcon} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          <p className="font-semibold">Unable to load compliance controls.</p>
          <p className="mt-1">{error.message || 'Please retry.'}</p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-accent/10">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-secondary text-xs font-semibold uppercase tracking-wide text-primary">
            <tr>
              <th className="px-4 py-3 text-left">Control</th>
              <th className="px-4 py-3 text-left">Owner</th>
              <th className="px-4 py-3 text-left">Cadence</th>
              <th className="px-4 py-3 text-left">Next review</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Tags</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {filteredControls.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={7}>
                  {loading ? 'Loading controls…' : 'No controls match the current filters.'}
                </td>
              </tr>
            ) : (
              filteredControls.map((control) => (
                <tr key={control.id} className="align-top hover:bg-secondary/70">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-primary">{control.title}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {[CATEGORY_LABELS[control.category] || control.category, CONTROL_TYPE_LABELS[control.controlType]]
                        .filter(Boolean)
                        .join(' • ')}
                    </div>
                    {control.documentationUrl ? (
                      <a
                        href={control.documentationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-xs font-semibold text-accent hover:underline"
                      >
                        Open runbook
                      </a>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-primary">{control.ownerTeam}</p>
                    <p className="text-xs text-slate-500">{control.ownerEmail || 'No email set'}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {FREQUENCY_LABELS[control.reviewFrequency] || control.reviewFrequency}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <StatusPill tone={DUE_TONE[control.dueStatus] || 'neutral'}>{control.dueLabel || '—'}</StatusPill>
                      {control.nextReviewAt ? (
                        <span className="text-xs text-slate-500">{new Date(control.nextReviewAt).toLocaleString()}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill tone={STATUS_TONE[control.status] || 'neutral'}>{control.status}</StatusPill>
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-500">
                    {(control.tags || []).length ? control.tags.join(', ') : '—'}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" icon={PencilSquareIcon} onClick={() => onEdit(control)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" icon={TrashIcon} onClick={() => onDelete(control)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

ComplianceControlsTable.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.shape({ message: PropTypes.string }),
  statusFilter: PropTypes.string.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  frequencyFilter: PropTypes.string.isRequired,
  frequencyOptions: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired,
  onFrequencyChange: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  onSearchTermChange: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  onRefresh: PropTypes.func,
  filteredControls: PropTypes.arrayOf(PropTypes.object).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default ComplianceControlsTable;
