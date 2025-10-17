import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import Select from '../../../components/ui/Select.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import { CHECKLIST_STATUS_OPTIONS } from './constants.js';

function EnterpriseUpgradeChecklistCard({ items, onAddItem, onFieldChange, onRemoveItem }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-primary">Launch checklist</h3>
          <p className="text-xs text-slate-500">Track enterprise enablement tasks and their current status.</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            onAddItem({
              label: '',
              status: 'not_started',
              owner: '',
              dueDate: '',
              notes: '',
              sortOrder: items.length
            })
          }
        >
          Add task
        </Button>
      </header>
      <div className="mt-4 space-y-4">
        {items.map((item, index) => (
          <div key={item.id ?? item.clientId} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput
                label="Task"
                value={item.label}
                onChange={(event) => onFieldChange(index, 'label', event.target.value)}
                required
              />
              <FormField label="Status">
                <Select
                  value={item.status}
                  onChange={(event) => onFieldChange(index, 'status', event.target.value)}
                  options={CHECKLIST_STATUS_OPTIONS}
                />
              </FormField>
              <TextInput
                label="Owner"
                value={item.owner || ''}
                onChange={(event) => onFieldChange(index, 'owner', event.target.value)}
              />
              <TextInput
                label="Due date"
                type="date"
                value={item.dueDate || ''}
                onChange={(event) => onFieldChange(index, 'dueDate', event.target.value)}
              />
            </div>
            <TextArea
              className="mt-3"
              label="Notes"
              value={item.notes || ''}
              onChange={(event) => onFieldChange(index, 'notes', event.target.value)}
              minRows={2}
            />
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => onRemoveItem(index)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">Add milestones to track onboarding, security, and commercial readiness.</p>
        ) : null}
      </div>
    </article>
  );
}

EnterpriseUpgradeChecklistCard.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      clientId: PropTypes.string,
      label: PropTypes.string,
      status: PropTypes.string,
      owner: PropTypes.string,
      dueDate: PropTypes.string,
      notes: PropTypes.string,
      sortOrder: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })
  ).isRequired,
  onAddItem: PropTypes.func.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onRemoveItem: PropTypes.func.isRequired
};

export default EnterpriseUpgradeChecklistCard;
