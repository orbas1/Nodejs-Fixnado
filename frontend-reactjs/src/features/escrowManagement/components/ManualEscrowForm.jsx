import PropTypes from 'prop-types';
import { Card, Button, Checkbox, TextInput } from '../../../components/ui/index.js';
import FormField from '../../../components/ui/FormField.jsx';
import { STATUS_SELECT_OPTIONS } from '../constants.js';

export default function ManualEscrowForm({
  form,
  availablePolicies,
  onFieldChange,
  onMilestoneChange,
  onAddMilestone,
  onRemoveMilestone,
  onSubmit,
  onCancel,
  submitting
}) {
  return (
    <Card className="space-y-6 border-primary/30 bg-white/90 p-6 shadow-lg shadow-primary/10">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-primary">Manual escrow entry</h2>
        <p className="text-sm text-slate-600">Seed a manual escrow for offline contracts or to stage finance workflows.</p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Order ID"
          value={form.orderId}
          onChange={(event) => onFieldChange('orderId', event.target.value)}
          required
        />
        <TextInput
          label="Amount"
          type="number"
          step="0.01"
          value={form.amount}
          onChange={(event) => onFieldChange('amount', event.target.value)}
          required
        />
        <TextInput
          label="Currency"
          value={form.currency}
          onChange={(event) => onFieldChange('currency', event.target.value)}
        />
        <FormField id="manual-policy" label="Policy">
          <select
            id="manual-policy"
            className="fx-text-input"
            value={form.policyId}
            onChange={(event) => onFieldChange('policyId', event.target.value)}
          >
            <option value="">Auto select from rules</option>
            {availablePolicies.map((policy) => (
              <option key={policy.id} value={policy.id}>
                {policy.name}
              </option>
            ))}
          </select>
        </FormField>
        <div className="md:col-span-2">
          <Checkbox
            label="Requires dual approval"
            checked={form.requiresDualApproval}
            onChange={(event) => onFieldChange('requiresDualApproval', event.target.checked)}
          />
        </div>
        <FormField id="manual-autorelease" label="Auto release">
          <input
            id="manual-autorelease"
            type="datetime-local"
            className="fx-text-input"
            value={form.autoReleaseAt}
            onChange={(event) => onFieldChange('autoReleaseAt', event.target.value)}
          />
        </FormField>
        <FormField id="manual-note" label="Kick-off note">
          <textarea
            id="manual-note"
            className="fx-text-input min-h-[120px]"
            value={form.note}
            onChange={(event) => onFieldChange('note', event.target.value)}
          />
        </FormField>
        <div className="md:col-span-2 flex items-center gap-3">
          <Checkbox
            label="Pin note"
            checked={form.pinNote}
            onChange={(event) => onFieldChange('pinNote', event.target.checked)}
          />
        </div>
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-primary">Milestone plan</h3>
            <Button type="button" variant="ghost" size="sm" onClick={onAddMilestone}>
              Add milestone
            </Button>
          </div>
          <div className="space-y-4">
            {form.milestones.map((milestone, index) => (
              <Card key={`manual-milestone-${index}`} className="space-y-3 border-slate-200">
                <div className="grid gap-3 md:grid-cols-4">
                  <TextInput
                    label="Label"
                    value={milestone.label}
                    onChange={(event) => onMilestoneChange(index, 'label', event.target.value)}
                    required
                  />
                  <FormField id={`manual-status-${index}`} label="Status">
                    <select
                      id={`manual-status-${index}`}
                      className="fx-text-input"
                      value={milestone.status}
                      onChange={(event) => onMilestoneChange(index, 'status', event.target.value)}
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
                    value={milestone.amount}
                    onChange={(event) => onMilestoneChange(index, 'amount', event.target.value)}
                  />
                  <FormField id={`manual-due-${index}`} label="Due date">
                    <input
                      id={`manual-due-${index}`}
                      type="date"
                      className="fx-text-input"
                      value={milestone.dueAt}
                      onChange={(event) => onMilestoneChange(index, 'dueAt', event.target.value)}
                    />
                  </FormField>
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveMilestone(index)}>
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
        <div className="md:col-span-2 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel manual escrow
          </Button>
          <Button type="submit" size="sm" disabled={submitting || !form.orderId || !form.amount}>
            Create escrow
          </Button>
        </div>
      </form>
    </Card>
  );
}

ManualEscrowForm.propTypes = {
  form: PropTypes.shape({
    orderId: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    policyId: PropTypes.string,
    requiresDualApproval: PropTypes.bool,
    autoReleaseAt: PropTypes.string,
    note: PropTypes.string,
    pinNote: PropTypes.bool,
    milestones: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        status: PropTypes.string,
        amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        dueAt: PropTypes.string
      })
    )
  }).isRequired,
  availablePolicies: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  onFieldChange: PropTypes.func.isRequired,
  onMilestoneChange: PropTypes.func.isRequired,
  onAddMilestone: PropTypes.func.isRequired,
  onRemoveMilestone: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  submitting: PropTypes.bool
};

ManualEscrowForm.defaultProps = {
  availablePolicies: [],
  submitting: false
};
