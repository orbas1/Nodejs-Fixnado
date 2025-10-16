import PropTypes from 'prop-types';
import {
  PhoneArrowDownLeftIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Button, Card, SegmentedControl, TextInput } from '../../../components/ui/index.js';
import { ESCALATION_METHOD_OPTIONS, ESCALATION_PRIORITY_OPTIONS, MAX_ESCALATION_CONTACTS } from '../defaults.js';

function EscalationSection({ contacts, onAdd, onUpdate, onRemove }) {
  return (
    <Card className="space-y-6" padding="lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">Escalation routing &amp; notification matrix</h2>
          <p className="mt-1 text-sm text-slate-600">
            Map critical incidents to the right channels and ensure redundant coverage.
          </p>
        </div>
        <Button
          type="button"
          to="/admin/communications/escalations"
          variant="tertiary"
          icon={PhoneArrowDownLeftIcon}
          iconPosition="start"
        >
          Manage channel connections
        </Button>
      </div>

      <div className="space-y-4">
        {contacts.length === 0 ? (
          <p className="text-sm text-slate-600">No escalation channels configured yet.</p>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact, index) => (
              <div key={`escalation-${index}`} className="space-y-4 rounded-2xl border border-slate-200 bg-white/70 p-4">
                <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Channel</span>
                    <SegmentedControl
                      name={`Escalation channel ${index + 1}`}
                      value={contact.method}
                      onChange={(value) => onUpdate(index, 'method', value)}
                      options={ESCALATION_METHOD_OPTIONS}
                      size="sm"
                    />
                  </div>
                  <TextInput
                    label="Contact label"
                    value={contact.label}
                    onChange={(event) => onUpdate(index, 'label', event.target.value)}
                  />
                  <TextInput
                    label="Destination"
                    value={contact.destination}
                    onChange={(event) => onUpdate(index, 'destination', event.target.value)}
                    hint="Email address, phone number, or Slack channel"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Priority banding</span>
                    <SegmentedControl
                      name={`Escalation priority ${index + 1}`}
                      value={contact.priority}
                      onChange={(value) => onUpdate(index, 'priority', value)}
                      options={ESCALATION_PRIORITY_OPTIONS}
                      size="sm"
                    />
                  </div>
                  <Button type="button" variant="ghost" size="sm" icon={TrashIcon} onClick={() => onRemove(index)}>
                    Remove channel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">You can register up to {MAX_ESCALATION_CONTACTS} escalation channels.</p>
          <Button
            type="button"
            variant="secondary"
            icon={PlusIcon}
            onClick={onAdd}
            disabled={contacts.length >= MAX_ESCALATION_CONTACTS}
          >
            Add escalation channel
          </Button>
        </div>
      </div>
    </Card>
  );
}

EscalationSection.propTypes = {
  contacts: PropTypes.arrayOf(
    PropTypes.shape({
      method: PropTypes.string,
      label: PropTypes.string,
      destination: PropTypes.string,
      priority: PropTypes.string
    })
  ).isRequired,
  onAdd: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired
};

export default EscalationSection;
