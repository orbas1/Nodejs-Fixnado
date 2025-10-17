import PropTypes from 'prop-types';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, Checkbox, TextInput, Textarea } from '../../../../components/ui/index.js';
import FormStatus from './FormStatus.jsx';

function OperationsForm({
  form,
  supportDays,
  onFieldChange,
  onToggleSupportDay,
  onSupportTimeChange,
  onAddSocialLink,
  onSocialLinkChange,
  onRemoveSocialLink,
  onSubmit,
  saving,
  status
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Operations</p>
        <h3 className="text-2xl font-semibold text-primary">Service delivery & coverage readiness</h3>
        <p className="text-sm text-slate-600">
          Document playbooks, service guardrails, and support availability so Fixnado teams know exactly how to collaborate
          with your crews.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Textarea
          label="Operations notes"
          value={form.operationsNotes}
          onChange={(event) => onFieldChange('operationsNotes', event.target.value)}
          rows={6}
          hint="Outline critical procedures, escalations, or site readiness requirements."
        />
        <Textarea
          label="Coverage notes"
          value={form.coverageNotes}
          onChange={(event) => onFieldChange('coverageNotes', event.target.value)}
          rows={6}
          hint="Describe how coverage is organised across regions, rotations, or partner crews."
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">Support hours</h4>
          <p className="text-sm text-slate-600">
            Configure when Fixnado can reach your coordinators. Enabled days require a start and end time in 24-hour format.
          </p>
        </div>
        <div className="space-y-4">
          {supportDays.map((day) => {
            const entry = form.supportHours?.[day.id] ?? { enabled: false, start: '09:00', end: '17:00' };
            return (
              <div
                key={day.id}
                className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:grid-cols-[220px,1fr]"
              >
                <Checkbox
                  label={(
                    <span className="text-sm font-medium text-primary">
                      {day.label}
                      {entry.enabled ? (
                        <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          Active
                        </span>
                      ) : null}
                    </span>
                  )}
                  description="Enable contactability on this day"
                  checked={entry.enabled}
                  onChange={(event) => onToggleSupportDay(day.id, event.target.checked)}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput
                    label="Start"
                    type="time"
                    value={entry.start ?? ''}
                    onChange={(event) => onSupportTimeChange(day.id, 'start', event.target.value)}
                    disabled={!entry.enabled}
                    required={entry.enabled}
                  />
                  <TextInput
                    label="End"
                    type="time"
                    value={entry.end ?? ''}
                    onChange={(event) => onSupportTimeChange(day.id, 'end', event.target.value)}
                    disabled={!entry.enabled}
                    required={entry.enabled}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">Social & escalation links</h4>
          <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={onAddSocialLink}>
            Add link
          </Button>
        </div>
        {form.socialLinks.length === 0 ? (
          <p className="text-sm text-slate-500">
            Add customer-facing profiles, escalation playbooks, or automation dashboards that should appear on Fixnado touchpoints.
          </p>
        ) : (
          <div className="space-y-4">
            {form.socialLinks.map((link, index) => (
              <div
                key={link.id || index}
                className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:grid-cols-[1fr,1fr,auto]"
              >
                <TextInput
                  label="Label"
                  value={link.label ?? ''}
                  onChange={(event) => onSocialLinkChange(index, 'label', event.target.value)}
                  placeholder="Escalation Hub"
                />
                <TextInput
                  label="URL"
                  value={link.url ?? ''}
                  onChange={(event) => onSocialLinkChange(index, 'url', event.target.value)}
                  placeholder="https://"
                  required
                />
                <div className="flex items-end justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    icon={TrashIcon}
                    className="text-rose-600"
                    onClick={() => onRemoveSocialLink(index)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FormStatus status={status} />
        <Button type="submit" loading={saving} disabled={saving} className="sm:w-auto">
          Save operations
        </Button>
      </div>
    </form>
  );
}

OperationsForm.propTypes = {
  form: PropTypes.shape({
    operationsNotes: PropTypes.string,
    coverageNotes: PropTypes.string,
    supportHours: PropTypes.objectOf(
      PropTypes.shape({
        enabled: PropTypes.bool,
        start: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
        end: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])])
      })
    ),
    socialLinks: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        url: PropTypes.string
      })
    )
  }).isRequired,
  supportDays: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onToggleSupportDay: PropTypes.func.isRequired,
  onSupportTimeChange: PropTypes.func.isRequired,
  onAddSocialLink: PropTypes.func.isRequired,
  onSocialLinkChange: PropTypes.func.isRequired,
  onRemoveSocialLink: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']),
    message: PropTypes.string
  })
};

OperationsForm.defaultProps = {
  status: null
};

export default OperationsForm;
