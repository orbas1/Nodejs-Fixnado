import PropTypes from 'prop-types';
import { FormField, TextInput, Checkbox, Button } from '../../ui/index.js';

function ComplianceAutomationForm({ form, onChange, onSubmit, saving, message }) {
  return (
    <section className="rounded-3xl border border-accent/10 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-primary">Automation guardrails</h3>
        <p className="text-sm text-slate-600">
          Configure reminder cadences, escalation paths, and evidence grace periods for new controls.
        </p>
      </header>

      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <FormField label="Auto reminders" helper="Toggle automated reminders for upcoming reviews">
          <Checkbox checked={form.autoReminders} onChange={(event) => onChange('autoReminders', event.target.checked)}>
            Send reminder emails to owners
          </Checkbox>
        </FormField>
        <FormField label="Reminder offset (days)" helper="How many days before the due date to trigger reminders">
          <TextInput
            type="number"
            min="0"
            value={form.reminderOffsetDays}
            onChange={(event) => onChange('reminderOffsetDays', event.target.value)}
          />
        </FormField>
        <FormField label="Default owner team" helper="Applied when creating new controls">
          <TextInput value={form.defaultOwnerTeam} onChange={(event) => onChange('defaultOwnerTeam', event.target.value)} />
        </FormField>
        <FormField label="Escalation email" helper="Escalations are sent here when evidence is overdue">
          <TextInput type="email" value={form.escalateTo} onChange={(event) => onChange('escalateTo', event.target.value)} />
        </FormField>
        <FormField label="Evidence grace period (days)" helper="Buffer before escalating missing uploads">
          <TextInput
            type="number"
            min="0"
            value={form.evidenceGraceDays}
            onChange={(event) => onChange('evidenceGraceDays', event.target.value)}
          />
        </FormField>
        <div className="flex items-end justify-end gap-3 md:col-span-2">
          {message ? <p className="text-xs text-slate-500">{message}</p> : null}
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save automation defaults'}
          </Button>
        </div>
      </form>
    </section>
  );
}

ComplianceAutomationForm.propTypes = {
  form: PropTypes.shape({
    autoReminders: PropTypes.bool,
    reminderOffsetDays: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    defaultOwnerTeam: PropTypes.string,
    escalateTo: PropTypes.string,
    evidenceGraceDays: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  message: PropTypes.string
};

export default ComplianceAutomationForm;
