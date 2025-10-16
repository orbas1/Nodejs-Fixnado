import PropTypes from 'prop-types';
import { Fragment } from 'react';
import { Card, Button, Checkbox, StatusPill, TextInput } from '../../../components/ui/index.js';
import FormField from '../../../components/ui/FormField.jsx';
import MilestoneEditor from './MilestoneEditor.jsx';
import NotesPanel from './NotesPanel.jsx';
import { STATUS_SELECT_OPTIONS } from '../constants.js';

export default function EscrowDetail({
  selected,
  selectedLoading,
  detailDraft,
  onFieldChange,
  onSaveDetails,
  savingDetails,
  availablePolicies,
  milestoneDraft,
  onMilestoneDraftChange,
  onCreateMilestone,
  onMilestoneChange,
  onPersistMilestone,
  onDeleteMilestone,
  onAddNote,
  onDeleteNote,
  onToggleNote,
  noteSaving
}) {
  if (selectedLoading) {
    return (
      <Card className="flex h-full items-center justify-center border-slate-200">
        <span className="text-sm text-slate-500">Loading escrow details…</span>
      </Card>
    );
  }

  if (!selected) {
    return (
      <Card className="flex h-full items-center justify-center border-slate-200 bg-white/70">
        <p className="text-sm text-slate-500">Select an escrow record to view details.</p>
      </Card>
    );
  }

  return (
    <Fragment>
      <Card className="space-y-4 border-slate-200 bg-white/90 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-primary">Escrow details</h3>
            <p className="text-xs text-slate-500">Update release policies, status, and finance metadata.</p>
          </div>
          <StatusPill tone={selected.onHold ? 'warning' : selected.status === 'disputed' ? 'danger' : 'info'}>
            {selected.onHold ? 'On hold' : selected.status}
          </StatusPill>
        </div>
        <div className="grid gap-4">
          <FormField id="detail-status" label="Status">
            <select
              id="detail-status"
              className="fx-text-input"
              value={detailDraft?.status ?? 'pending'}
              onChange={(event) => onFieldChange('status', event.target.value)}
            >
              {STATUS_SELECT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          <TextInput
            label="Amount"
            type="number"
            step="0.01"
            value={detailDraft?.amount ?? ''}
            onChange={(event) => onFieldChange('amount', event.target.value)}
          />
          <TextInput
            label="Currency"
            value={detailDraft?.currency ?? ''}
            onChange={(event) => onFieldChange('currency', event.target.value)}
          />
          <FormField id="detail-policy" label="Policy">
            <select
              id="detail-policy"
              className="fx-text-input"
              value={detailDraft?.policyId ?? ''}
              onChange={(event) => onFieldChange('policyId', event.target.value)}
            >
              <option value="">Policy auto selection</option>
              {availablePolicies.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.name}
                </option>
              ))}
            </select>
          </FormField>
          <Checkbox
            label="Requires dual approval"
            checked={Boolean(detailDraft?.requiresDualApproval)}
            onChange={(event) => onFieldChange('requiresDualApproval', event.target.checked)}
          />
          <FormField id="detail-auto-release" label="Auto release">
            <input
              id="detail-auto-release"
              type="datetime-local"
              className="fx-text-input"
              value={detailDraft?.autoReleaseAt ?? ''}
              onChange={(event) => onFieldChange('autoReleaseAt', event.target.value)}
            />
          </FormField>
          <FormField id="detail-funded" label="Funded at">
            <input
              id="detail-funded"
              type="datetime-local"
              className="fx-text-input"
              value={detailDraft?.fundedAt ?? ''}
              onChange={(event) => onFieldChange('fundedAt', event.target.value)}
            />
          </FormField>
          <FormField id="detail-released" label="Released at">
            <input
              id="detail-released"
              type="datetime-local"
              className="fx-text-input"
              value={detailDraft?.releasedAt ?? ''}
              onChange={(event) => onFieldChange('releasedAt', event.target.value)}
            />
          </FormField>
          <Checkbox
            label="Escrow on hold"
            checked={Boolean(detailDraft?.onHold)}
            onChange={(event) => onFieldChange('onHold', event.target.checked)}
          />
          {detailDraft?.onHold ? (
            <TextInput
              label="Hold reason"
              value={detailDraft?.holdReason ?? ''}
              onChange={(event) => onFieldChange('holdReason', event.target.value)}
            />
          ) : null}
          <TextInput
            label="External reference"
            value={detailDraft?.externalReference ?? ''}
            onChange={(event) => onFieldChange('externalReference', event.target.value)}
          />
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={onSaveDetails} disabled={savingDetails}>
              Save details
            </Button>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 border-slate-200 bg-white/90 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">Milestones</h3>
          <StatusPill tone="neutral">{selected.milestones?.length ?? 0} items</StatusPill>
        </div>
        <div className="space-y-4">
          {selected.milestones?.length ? (
            selected.milestones.map((milestone) => (
              <MilestoneEditor
                key={milestone.id}
                milestone={milestone}
                onChange={(next) => onMilestoneChange({ ...milestone, ...next })}
                onSave={() => onPersistMilestone(milestone)}
                onDelete={() => onDeleteMilestone(milestone)}
              />
            ))
          ) : (
            <p className="text-sm text-slate-500">
              No milestones defined. Create milestones to gate escrow release against delivery checkpoints.
            </p>
          )}
          <Card className="space-y-3 border-dashed border-slate-300 bg-slate-50/70 p-4">
            <h4 className="text-sm font-semibold text-primary">Add milestone</h4>
            <div className="grid gap-3 md:grid-cols-4">
              <TextInput
                label="Label"
                value={milestoneDraft.label}
                onChange={(event) => onMilestoneDraftChange({ ...milestoneDraft, label: event.target.value })}
              />
              <FormField id="new-milestone-status" label="Status">
                <select
                  id="new-milestone-status"
                  className="fx-text-input"
                  value={milestoneDraft.status}
                  onChange={(event) => onMilestoneDraftChange({ ...milestoneDraft, status: event.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </FormField>
              <TextInput
                label="Amount"
                type="number"
                value={milestoneDraft.amount}
                onChange={(event) => onMilestoneDraftChange({ ...milestoneDraft, amount: event.target.value })}
              />
              <FormField id="new-milestone-due" label="Due date">
                <input
                  id="new-milestone-due"
                  type="date"
                  className="fx-text-input"
                  value={milestoneDraft.dueAt}
                  onChange={(event) => onMilestoneDraftChange({ ...milestoneDraft, dueAt: event.target.value })}
                />
              </FormField>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (!milestoneDraft.label.trim()) {
                    return;
                  }
                  onCreateMilestone({
                    label: milestoneDraft.label,
                    status: milestoneDraft.status,
                    amount: milestoneDraft.amount ? Number.parseFloat(milestoneDraft.amount) : null,
                    dueAt: milestoneDraft.dueAt || null
                  });
                }}
                disabled={!milestoneDraft.label.trim()}
              >
                Add milestone
              </Button>
            </div>
          </Card>
        </div>
      </Card>

      <NotesPanel
        escrow={selected}
        onAddNote={onAddNote}
        onDeleteNote={onDeleteNote}
        onTogglePinned={onToggleNote}
        adding={noteSaving}
      />
    </Fragment>
  );
}

EscrowDetail.propTypes = {
  selected: PropTypes.object,
  selectedLoading: PropTypes.bool,
  detailDraft: PropTypes.object,
  onFieldChange: PropTypes.func.isRequired,
  onSaveDetails: PropTypes.func.isRequired,
  savingDetails: PropTypes.bool,
  availablePolicies: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  milestoneDraft: PropTypes.shape({
    label: PropTypes.string,
    status: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    dueAt: PropTypes.string
  }).isRequired,
  onMilestoneDraftChange: PropTypes.func.isRequired,
  onCreateMilestone: PropTypes.func.isRequired,
  onMilestoneChange: PropTypes.func.isRequired,
  onPersistMilestone: PropTypes.func.isRequired,
  onDeleteMilestone: PropTypes.func.isRequired,
  onAddNote: PropTypes.func.isRequired,
  onDeleteNote: PropTypes.func.isRequired,
  onToggleNote: PropTypes.func.isRequired,
  noteSaving: PropTypes.bool
};

EscrowDetail.defaultProps = {
  selected: null,
  selectedLoading: false,
  detailDraft: null,
  savingDetails: false,
  availablePolicies: [],
  noteSaving: false
};
