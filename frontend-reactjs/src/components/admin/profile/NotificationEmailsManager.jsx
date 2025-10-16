import PropTypes from 'prop-types';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button, TextInput } from '../../ui/index.js';

export default function NotificationEmailsManager({
  emails,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
  disableAdd
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">Escalation emails</h3>
      <p className="text-sm text-slate-600">Add distribution lists or teammates who should receive mirrored alerts.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <TextInput
          label="Add email"
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onAdd();
            }
          }}
          placeholder="ops@company.com"
          className="sm:flex-1"
        />
        <Button type="button" variant="secondary" icon={PlusIcon} onClick={onAdd} disabled={disableAdd}>
          Add
        </Button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {emails.length === 0 ? (
          <li className="text-sm text-slate-500">No additional emails configured yet.</li>
        ) : (
          emails.map((email) => (
            <li
              key={email}
              className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-primary"
            >
              <span>{email}</span>
              <button
                type="button"
                className="text-primary/60 transition hover:text-primary"
                onClick={() => onRemove(email)}
                aria-label={`Remove ${email}`}
              >
                ×
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

NotificationEmailsManager.propTypes = {
  emails: PropTypes.arrayOf(PropTypes.string).isRequired,
  inputValue: PropTypes.string.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  disableAdd: PropTypes.bool
};

NotificationEmailsManager.defaultProps = {
  disableAdd: false
};
