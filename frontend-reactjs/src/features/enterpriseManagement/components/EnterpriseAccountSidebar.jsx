import PropTypes from 'prop-types';
import { Button, Card, StatusPill } from '../../../components/ui/index.js';
import { getOptionLabel } from '../utils.js';
import { ACCOUNT_STATUS_OPTIONS } from '../constants.js';

export default function EnterpriseAccountSidebar({
  accounts,
  selectedAccountId,
  onSelect,
  viewArchived,
  onToggleArchived,
  onCreateAccount,
  creatingAccount
}) {
  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Enterprise accounts</h2>
          <p className="text-sm text-slate-600">
            Select an account to edit settings, coverage, and programme playbooks.
          </p>
        </div>
        <StatusPill tone={viewArchived ? 'warning' : 'info'}>
          {viewArchived ? 'Archived' : 'Active'}
        </StatusPill>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleArchived}
          data-qa="toggle-archived"
        >
          {viewArchived ? 'Show active' : 'Show archived'}
        </Button>
        <Button size="sm" onClick={onCreateAccount} loading={creatingAccount} data-qa="create-enterprise">
          New enterprise
        </Button>
      </div>
      {accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
          <p className="text-sm text-slate-600">
            No enterprise accounts yet. Create one to begin configuring programmes and contacts.
          </p>
          <Button className="mt-4" size="sm" onClick={onCreateAccount} loading={creatingAccount}>
            Create enterprise account
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {accounts.map((account) => {
            const isSelected = account.id === selectedAccountId;
            const statusLabel = getOptionLabel(ACCOUNT_STATUS_OPTIONS, account.status, account.status);
            const statusTone = account.archivedAt
              ? 'warning'
              : account.status === 'active'
                ? 'success'
                : 'neutral';
            const statusCopy = account.archivedAt ? 'Archived' : statusLabel;
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => onSelect(account.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                  isSelected ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 bg-white hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{account.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {account.accountManager ? `Owner: ${account.accountManager}` : 'No owner assigned'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusPill tone={statusTone}>{statusCopy}</StatusPill>
                    {account.archivedAt ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-700">
                        Locked
                      </span>
                    ) : null}
                    {account.priority === 'critical' ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[0.65rem] font-semibold text-rose-600">
                        Critical
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

EnterpriseAccountSidebar.propTypes = {
  accounts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      status: PropTypes.string,
      priority: PropTypes.string,
      archivedAt: PropTypes.string,
      accountManager: PropTypes.string
    })
  ).isRequired,
  selectedAccountId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelect: PropTypes.func.isRequired,
  viewArchived: PropTypes.bool.isRequired,
  onToggleArchived: PropTypes.func.isRequired,
  onCreateAccount: PropTypes.func.isRequired,
  creatingAccount: PropTypes.bool
};

EnterpriseAccountSidebar.defaultProps = {
  selectedAccountId: null,
  creatingAccount: false
};
