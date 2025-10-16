import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  MapPinIcon,
  PencilSquareIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../ui/index.js';
import { formatRoleLabel } from '../../../../constants/accessControl.js';
import StatusChip from './StatusChip.jsx';
import { formatRelativeTime } from '../formatters.js';

function TwoFactorSummary({ user }) {
  return (
    <div className="text-xs text-slate-600">
      <p>Email: {user.twoFactor?.email ? 'On' : 'Off'}</p>
      <p>Authenticator: {user.twoFactor?.app ? 'On' : 'Off'}</p>
    </div>
  );
}

TwoFactorSummary.propTypes = {
  user: PropTypes.shape({
    twoFactor: PropTypes.shape({
      email: PropTypes.bool,
      app: PropTypes.bool
    })
  }).isRequired
};

function UserDirectoryTable({ items, pendingAction, onEdit, onResetMfa, onRevokeSessions }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">
              User
            </th>
            <th scope="col" className="px-4 py-3">
              Role
            </th>
            <th scope="col" className="px-4 py-3">
              Status
            </th>
            <th scope="col" className="px-4 py-3">
              2FA
            </th>
            <th scope="col" className="px-4 py-3">
              Last active
            </th>
            <th scope="col" className="px-4 py-3">
              Sessions
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {items.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50/80">
              <td className="px-4 py-4">
                <div className="font-semibold text-primary">
                  {user.displayName || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()}
                </div>
                <div className="text-xs text-slate-500">{user.email}</div>
                {user.region?.name ? (
                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                    <span>{user.region.name}</span>
                  </div>
                ) : null}
                {user.jobTitle ? <div className="mt-1 text-xs text-slate-500">{user.jobTitle}</div> : null}
                {user.labels?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {user.labels.map((label) => (
                      <span
                        key={label}
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-primary"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </td>
              <td className="px-4 py-4">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {formatRoleLabel(user.role)}
                </span>
              </td>
              <td className="px-4 py-4">
                <StatusChip status={user.status} />
              </td>
              <td className="px-4 py-4">
                <TwoFactorSummary user={user} />
              </td>
              <td className="px-4 py-4 text-sm text-slate-600">{formatRelativeTime(user.lastActiveAt)}</td>
              <td className="px-4 py-4 text-sm text-slate-600">
                {user.activeSessions > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                    <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                    {user.activeSessions} active
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">None</span>
                )}
              </td>
              <td className="px-4 py-4">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="secondary" icon={PencilSquareIcon} onClick={() => onEdit(user)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={ShieldExclamationIcon}
                    onClick={() => onResetMfa(user)}
                    loading={pendingAction?.type === 'reset-mfa' && pendingAction?.userId === user.id}
                  >
                    Reset MFA
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={ArrowPathIcon}
                    onClick={() => onRevokeSessions(user)}
                    loading={pendingAction?.type === 'revoke-sessions' && pendingAction?.userId === user.id}
                  >
                    Revoke sessions
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

UserDirectoryTable.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  pendingAction: PropTypes.shape({
    type: PropTypes.string,
    userId: PropTypes.string
  }),
  onEdit: PropTypes.func.isRequired,
  onResetMfa: PropTypes.func.isRequired,
  onRevokeSessions: PropTypes.func.isRequired
};

UserDirectoryTable.defaultProps = {
  pendingAction: null
};

export default UserDirectoryTable;
