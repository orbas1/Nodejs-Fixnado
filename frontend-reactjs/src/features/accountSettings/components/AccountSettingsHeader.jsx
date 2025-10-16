import PropTypes from 'prop-types';
import { Button } from '../../../components/ui/index.js';

function AccountSettingsHeader({ heading, description, onManageSessions, onViewAudit }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Account control centre</p>
          <h2 className="mt-2 text-3xl font-semibold text-primary">{heading}</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" onClick={onManageSessions}>
            Manage login sessions
          </Button>
          <Button type="button" variant="ghost" onClick={onViewAudit}>
            View activity log
          </Button>
        </div>
      </div>
    </section>
  );
}

AccountSettingsHeader.propTypes = {
  heading: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onManageSessions: PropTypes.func.isRequired,
  onViewAudit: PropTypes.func.isRequired
};

export default AccountSettingsHeader;
