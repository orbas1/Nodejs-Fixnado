import PropTypes from 'prop-types';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, Card, StatusPill } from '../../ui/index.js';

export default function DelegateTable({ delegates, disabled, onCreate, onEdit, onDelete }) {
  return (
    <Card className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary">Delegated access</h3>
          <p className="text-sm text-slate-600">
            Control who can access the admin control centre and which scopes they can manage.
          </p>
        </div>
        <Button type="button" variant="secondary" icon={PlusIcon} onClick={onCreate} disabled={disabled}>
          Add delegate
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-accent/10">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-secondary/60 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Permissions</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
            {delegates.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  No delegates added yet. Bring trusted teammates into the control centre for auditability.
                </td>
              </tr>
            ) : (
              delegates.map((delegate) => (
                <tr key={delegate.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">
                        {delegate.avatarUrl ? (
                          <img src={delegate.avatarUrl} alt="Delegate avatar" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <span>{delegate.name ? delegate.name[0] : delegate.email[0]}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-primary">{delegate.name || 'Unnamed delegate'}</p>
                        <p className="text-xs text-slate-500">{delegate.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{delegate.role || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {delegate.permissions.length ? delegate.permissions.join(', ') : 'Full access'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={delegate.status === 'suspended' ? 'warning' : 'success'}>
                      {delegate.status === 'suspended' ? 'Suspended' : 'Active'}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={PencilSquareIcon}
                        onClick={() => onEdit(delegate)}
                        disabled={disabled}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        icon={TrashIcon}
                        onClick={() => onDelete(delegate)}
                        disabled={disabled}
                      >
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

DelegateTable.propTypes = {
  delegates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      email: PropTypes.string,
      role: PropTypes.string,
      permissions: PropTypes.arrayOf(PropTypes.string),
      status: PropTypes.string,
      avatarUrl: PropTypes.string
    })
  ).isRequired,
  disabled: PropTypes.bool,
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

DelegateTable.defaultProps = {
  disabled: false
};
