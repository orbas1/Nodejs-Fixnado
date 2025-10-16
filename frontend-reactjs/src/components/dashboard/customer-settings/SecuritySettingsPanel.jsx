import { useState } from 'react';
import PropTypes from 'prop-types';
import Spinner from '../../ui/Spinner.jsx';
import SettingsPanelShell from './SettingsPanelShell.jsx';
import StatusBanner from './StatusBanner.jsx';

function SecuritySettingsPanel({
  form,
  onToggle,
  onAddMethod,
  onRemoveMethod,
  onSubmit,
  saving,
  status
}) {
  const [newMethod, setNewMethod] = useState('');

  const handleAddMethod = () => {
    const trimmed = newMethod.trim();
    if (!trimmed) return;
    onAddMethod(trimmed);
    setNewMethod('');
  };

  return (
    <SettingsPanelShell
      id="security-settings"
      title="Security & access"
      description="Protect the account that controls bookings and payouts."
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-primary">
            <span>Authenticator app</span>
            <input
              type="checkbox"
              checked={form.twoFactorApp}
              onChange={(event) => onToggle('twoFactorApp', event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-primary">
            <span>Email backup codes</span>
            <input
              type="checkbox"
              checked={form.twoFactorEmail}
              onChange={(event) => onToggle('twoFactorEmail', event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
          </label>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-primary">Stored methods</p>
          <p className="text-xs text-slate-500">
            Add notes about security keys or recovery steps. Visible to admins approving access requests.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {form.methods.length === 0 && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">No methods saved</span>
            )}
            {form.methods.map((method) => (
              <span
                key={method}
                className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              >
                {method}
                <button
                  type="button"
                  className="text-primary/70 transition hover:text-primary"
                  onClick={() => onRemoveMethod(method)}
                  aria-label={`Remove ${method}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <input
              name="new-method"
              type="text"
              value={newMethod}
              onChange={(event) => setNewMethod(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleAddMethod();
                }
              }}
              placeholder="e.g. YubiKey in vault"
              className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={handleAddMethod}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2 text-xs font-semibold text-primary shadow-sm transition hover:border-primary/40"
            >
              Add method
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <StatusBanner status={status} />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={saving}
          >
            {saving && <Spinner className="h-4 w-4 text-white" />}
            {saving ? 'Saving…' : 'Save security'}
          </button>
        </div>
      </form>
    </SettingsPanelShell>
  );
}

SecuritySettingsPanel.propTypes = {
  form: PropTypes.shape({
    twoFactorApp: PropTypes.bool,
    twoFactorEmail: PropTypes.bool,
    methods: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onAddMethod: PropTypes.func.isRequired,
  onRemoveMethod: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    message: PropTypes.string.isRequired
  })
};

export default SecuritySettingsPanel;
