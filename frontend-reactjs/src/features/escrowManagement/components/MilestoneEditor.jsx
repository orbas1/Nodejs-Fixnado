import PropTypes from 'prop-types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Card, Button } from '../../../components/ui/index.js';
import FormField from '../../../components/ui/FormField.jsx';

export default function MilestoneEditor({ milestone, onChange, onSave, onDelete, saving }) {
  const handleFieldChange = (field) => (event) => {
    onChange({ ...milestone, [field]: event.target.value });
  };

  return (
    <Card className="space-y-4 border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">{milestone.label || 'Milestone'}</p>
          <p className="text-xs text-slate-500">Sequence {milestone.sequence ?? '—'}</p>
        </div>
        {onDelete ? (
          <Button type="button" variant="ghost" size="sm" onClick={onDelete} icon={XMarkIcon}>
            Remove
          </Button>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <FormField id={`milestone-${milestone.id || 'new'}-label`} label="Label">
          <input
            id={`milestone-${milestone.id || 'new'}-label`}
            type="text"
            value={milestone.label}
            onChange={handleFieldChange('label')}
            className="fx-text-input"
          />
        </FormField>
        <FormField id={`milestone-${milestone.id || 'new'}-status`} label="Status">
          <select
            id={`milestone-${milestone.id || 'new'}-status`}
            value={milestone.status}
            onChange={handleFieldChange('status')}
            className="fx-text-input"
          >
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </FormField>
        <FormField id={`milestone-${milestone.id || 'new'}-amount`} label="Amount">
          <input
            id={`milestone-${milestone.id || 'new'}-amount`}
            type="number"
            value={milestone.amount ?? ''}
            onChange={handleFieldChange('amount')}
            className="fx-text-input"
            min="0"
            step="0.01"
          />
        </FormField>
        <FormField id={`milestone-${milestone.id || 'new'}-due`} label="Due date">
          <input
            id={`milestone-${milestone.id || 'new'}-due`}
            type="date"
            value={milestone.dueAt ? milestone.dueAt.slice(0, 10) : ''}
            onChange={handleFieldChange('dueAt')}
            className="fx-text-input"
          />
        </FormField>
      </div>
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={onSave} disabled={saving}>
          Save milestone
        </Button>
      </div>
    </Card>
  );
}

MilestoneEditor.propTypes = {
  milestone: PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
    status: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    dueAt: PropTypes.string,
    sequence: PropTypes.number
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  saving: PropTypes.bool
};

MilestoneEditor.defaultProps = {
  onDelete: null,
  saving: false
};
