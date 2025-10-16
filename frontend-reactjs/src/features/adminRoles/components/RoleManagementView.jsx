import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import PageHeader from '../../../components/blueprints/PageHeader.jsx';
import {
  Button,
  Card,
  Checkbox,
  FormField,
  SegmentedControl,
  Spinner,
  StatusPill,
  TextInput
} from '../../../components/ui/index.js';
import { formatDateTime } from '../utils.js';

function RoleManagementView({
  loading,
  roles,
  selectedKey,
  detail,
  formState,
  assignmentForm,
  searchDraft,
  statusFilter,
  saving,
  assigning,
  refreshingRole,
  feedback,
  error,
  headerMeta,
  availableRoleOptions,
  stats,
  newPermission,
  activeAssignments,
  historicalAssignments,
  onSearchDraftChange,
  onStatusFilterChange,
  onRefreshRoles,
  onSearchSubmit,
  onSelectRole,
  onCreateRole,
  onFormFieldChange,
  onDataVisibilityChange,
  onToggleInheritance,
  onAddPermission,
  onRemovePermission,
  onNewPermissionChange,
  onSaveRole,
  onArchiveRole,
  onAssignRole,
  onRevokeAssignment,
  onAssignmentFieldChange,
  onResetAssignmentForm,
  onReloadRole
}) {
  const permissions = formState.permissions ?? [];
  const allowedMenus = formState.allowedMenus ?? '';
  const deniedMenus = formState.deniedMenus ?? '';

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        eyebrow="Admin Control Centre"
        title="Role management"
        description="Define and govern Fixnado RBAC roles, inheritance chains, and membership assignments."
        actions={[
          {
            label: 'Refresh roles',
            onClick: onRefreshRoles,
            variant: 'secondary',
            icon: ArrowPathIcon,
            iconPosition: 'start'
          },
          {
            label: 'Create role',
            onClick: onCreateRole,
            variant: 'primary',
            icon: PlusIcon,
            iconPosition: 'start'
          }
        ]}
        meta={headerMeta}
      />

      <div className="mx-auto max-w-7xl px-6 py-10">
        {error ? (
          <div className="mb-6">
            <StatusPill tone="danger">{error}</StatusPill>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <Card padding="lg" className="space-y-5">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em]">Roles</h2>
              </div>
              <form onSubmit={onSearchSubmit} className="space-y-3">
                <TextInput
                  label="Search roles"
                  placeholder="Search by name or key"
                  value={searchDraft}
                  onChange={(event) => onSearchDraftChange(event.target.value)}
                />
                <div className="flex items-center justify-between gap-3">
                  <SegmentedControl
                    name="Role status filter"
                    value={statusFilter}
                    options={[
                      { label: 'Active', value: 'active' },
                      { label: 'All', value: 'all' },
                      { label: 'Archived', value: 'archived' }
                    ]}
                    onChange={onStatusFilterChange}
                    size="sm"
                  />
                  <Button type="submit" variant="secondary" size="sm">
                    Search
                  </Button>
                </div>
              </form>
            </Card>

            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white/70 py-12">
                  <Spinner aria-label="Loading roles" />
                </div>
              ) : roles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-slate-600">
                  No roles match this filter yet. Try adjusting your search or create a new role definition.
                </div>
              ) : (
                roles.map((role) => {
                  const isSelected = selectedKey === role.key;
                  return (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => onSelectRole(role.key)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                          : 'border-slate-200 bg-white/80 hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-primary">{role.label ?? role.name ?? role.key}</p>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{role.key}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {role.isSystem ? <StatusPill tone="info">System</StatusPill> : <StatusPill tone="success">Custom</StatusPill>}
                          {role.status === 'archived' ? <StatusPill tone="warning">Archived</StatusPill> : null}
                        </div>
                      </div>
                      {role.description ? <p className="mt-2 text-xs text-slate-600">{role.description}</p> : null}
                      <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                        Active {role.assignmentCounts?.active ?? 0} · Total {role.assignmentCounts?.total ?? 0}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="space-y-6">
            {selectedKey === '__new__' ? (
              <Card padding="lg" className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-primary">Create a new role</h2>
                    <p className="text-sm text-slate-600">
                      Configure inheritance, permissions, and navigation guardrails before provisioning members.
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={onRefreshRoles} iconPosition="start" icon={ArrowPathIcon}>
                    Refresh list
                  </Button>
                </div>
              </Card>
            ) : null}

            {feedback ? (
              <StatusPill tone={feedback.type === 'error' ? 'danger' : 'success'}>{feedback.message}</StatusPill>
            ) : null}

            {refreshingRole ? (
              <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 py-20">
                <Spinner aria-label="Loading role detail" />
              </div>
            ) : (
              <Card padding="lg" className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-primary">
                      {selectedKey === '__new__' ? 'New role' : formState.name || 'Role configuration'}
                    </h2>
                    <p className="text-sm text-slate-600">Manage the definition applied across dashboards, APIs, and admin tools.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {formState.isSystem ? <StatusPill tone="info">System managed</StatusPill> : null}
                    {formState.status === 'archived' ? <StatusPill tone="warning">Archived</StatusPill> : null}
                    {selectedKey && selectedKey !== '__new__' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        iconPosition="start"
                        icon={ArrowPathIcon}
                        onClick={() => onReloadRole(selectedKey)}
                      >
                        Reload
                      </Button>
                    ) : null}
                  </div>
                </div>

                <dl className="grid gap-4 rounded-2xl border border-slate-200 bg-white/70 p-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Active members</dt>
                    <dd className="text-lg font-semibold text-primary">{stats.activeAssignments}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Total assignments</dt>
                    <dd className="text-lg font-semibold text-primary">{stats.totalAssignments}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Tenants covered</dt>
                    <dd className="text-lg font-semibold text-primary">{stats.uniqueTenants}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Next expiry</dt>
                    <dd className="text-sm font-medium text-slate-600">
                      {formatDateTime(stats.nextExpiry, { fallback: 'None scheduled', timeStyle: undefined })}
                    </dd>
                  </div>
                </dl>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <TextInput
                      label="Role key"
                      value={formState.key}
                      onChange={(event) => onFormFieldChange('key', event.target.value)}
                      placeholder="e.g. operations_dispatch"
                      disabled={selectedKey !== '__new__' && formState.isSystem}
                      required
                    />
                    <TextInput
                      label="Role name"
                      value={formState.name}
                      onChange={(event) => onFormFieldChange('name', event.target.value)}
                      placeholder="Display name"
                      required
                    />
                    <FormField id="role-description" label="Description">
                      <textarea
                        id="role-description"
                        className="min-h-[6rem] w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={formState.description}
                        onChange={(event) => onFormFieldChange('description', event.target.value)}
                        placeholder="Describe the responsibilities and guardrails for this role"
                      />
                    </FormField>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Inheritance</p>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {availableRoleOptions.map((option) => (
                          <label
                            key={option.key}
                            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700"
                          >
                            <Checkbox
                              checked={formState.inherits.includes(option.key)}
                              onChange={() => onToggleInheritance(option.key)}
                              disabled={option.key === formState.key}
                              aria-label={`Toggle inheritance from ${option.label}`}
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Permissions</p>
                        <div className="flex gap-2">
                          <TextInput
                            label="Add permission"
                            optionalLabel=""
                            value={newPermission}
                            onChange={(event) => onNewPermissionChange(event.target.value)}
                            placeholder="scope:action"
                            className="w-48"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            iconPosition="start"
                            icon={PlusIcon}
                            onClick={onAddPermission}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {permissions.length === 0 ? (
                          <p className="text-xs text-slate-500">No permissions granted yet.</p>
                        ) : (
                          permissions.map((permission) => (
                            <div
                              key={permission}
                              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2"
                            >
                              <span className="text-sm text-slate-700">{permission}</span>
                              <Button type="button" size="xs" variant="ghost" icon={TrashIcon} onClick={() => onRemovePermission(permission)}>
                                Remove
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                      {detail?.permissionsCatalog && detail.permissionsCatalog.length > 0 ? (
                        <p className="text-xs text-slate-500">
                          Common permissions: {detail.permissionsCatalog.slice(0, 8).join(', ')}...
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField id="allowed-menus" label="Allowed menus" optionalLabel="optional">
                    <textarea
                      id="allowed-menus"
                      className="min-h-[4rem] w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={allowedMenus}
                      onChange={(event) => onFormFieldChange('allowedMenus', event.target.value)}
                      placeholder="Comma or line separated navigation keys"
                    />
                  </FormField>
                  <FormField id="denied-menus" label="Denied menus" optionalLabel="optional">
                    <textarea
                      id="denied-menus"
                      className="min-h-[4rem] w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={deniedMenus}
                      onChange={(event) => onFormFieldChange('deniedMenus', event.target.value)}
                      placeholder="Restrict access to these navigation keys"
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput
                    label="Finance visibility"
                    value={formState.dataVisibility?.finance ?? ''}
                    onChange={(event) => onDataVisibilityChange('finance', event.target.value)}
                    placeholder="e.g. summary,detail"
                  />
                  <TextInput
                    label="Messaging visibility"
                    value={formState.dataVisibility?.messaging ?? ''}
                    onChange={(event) => onDataVisibilityChange('messaging', event.target.value)}
                    placeholder="e.g. inbox"
                  />
                  <TextInput
                    label="Inventory visibility"
                    value={formState.dataVisibility?.inventory ?? ''}
                    onChange={(event) => onDataVisibilityChange('inventory', event.target.value)}
                    placeholder="e.g. stock,pricing"
                  />
                  <TextInput
                    label="Analytics visibility"
                    value={formState.dataVisibility?.analytics ?? ''}
                    onChange={(event) => onDataVisibilityChange('analytics', event.target.value)}
                    placeholder="e.g. dashboards"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" onClick={onSaveRole} loading={saving} disabled={saving}>
                    {selectedKey === '__new__' ? 'Create role' : 'Save changes'}
                  </Button>
                  {selectedKey !== '__new__' && !formState.isSystem ? (
                    <Button
                      variant="danger"
                      onClick={onArchiveRole}
                      disabled={saving}
                      iconPosition="start"
                      icon={TrashIcon}
                    >
                      Archive role
                    </Button>
                  ) : null}
                </div>
              </Card>
            )}

            {selectedKey !== '__new__' ? (
              <Card padding="lg" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-primary">Assignments</h3>
                    <p className="text-sm text-slate-600">
                      Provision or revoke members with access to this role. Last assignment {formatDateTime(stats.lastAssignedAt, { fallback: 'never' })}.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone="info">Active: {stats.activeAssignments}</StatusPill>
                    <StatusPill tone="neutral">Revoked: {stats.revokedAssignments}</StatusPill>
                    <StatusPill tone="neutral">Tenants: {stats.uniqueTenants}</StatusPill>
                  </div>
                </div>

                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Next expiry: {formatDateTime(stats.nextExpiry, { fallback: 'None scheduled' })}
                </p>

                <form onSubmit={onAssignRole} className="grid gap-4 md:grid-cols-2">
                  <TextInput
                    label="User email"
                    value={assignmentForm.email}
                    onChange={(event) => onAssignmentFieldChange('email', event.target.value)}
                    placeholder="admin@company.com"
                    required
                  />
                  <TextInput
                    label="User ID (optional)"
                    value={assignmentForm.userId}
                    onChange={(event) => onAssignmentFieldChange('userId', event.target.value)}
                    placeholder="UUID"
                  />
                  <TextInput
                    label="Tenant context"
                    value={assignmentForm.tenantId}
                    onChange={(event) => onAssignmentFieldChange('tenantId', event.target.value)}
                    placeholder="tenant-id"
                  />
                  <FormField id="assignment-expires" label="Expires on" optionalLabel="optional">
                    <input
                      id="assignment-expires"
                      type="date"
                      className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={assignmentForm.expiresAt}
                      onChange={(event) => onAssignmentFieldChange('expiresAt', event.target.value)}
                    />
                  </FormField>
                  <FormField id="assignment-note" label="Note" optionalLabel="optional" className="md:col-span-2">
                    <textarea
                      id="assignment-note"
                      className="min-h-[5rem] w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={assignmentForm.note}
                      onChange={(event) => onAssignmentFieldChange('note', event.target.value)}
                      placeholder="Add context for this assignment"
                    />
                  </FormField>
                  <div className="md:col-span-2 flex items-center gap-3">
                    <Button type="submit" variant="secondary" iconPosition="start" icon={UserPlusIcon} loading={assigning}>
                      Assign role
                    </Button>
                    <Button type="button" variant="ghost" onClick={onResetAssignmentForm}>
                      Reset form
                    </Button>
                  </div>
                </form>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Active members</h4>
                  {activeAssignments.length === 0 ? (
                    <p className="text-sm text-slate-500">No active assignments yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {activeAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-semibold text-primary">
                              {assignment.user?.email ?? 'User'}
                              {assignment.user?.firstName ? ` · ${assignment.user.firstName} ${assignment.user.lastName}` : ''}
                            </p>
                            <p className="text-xs text-slate-500">
                              Tenant: {assignment.tenantId || 'Global'} · Assigned{' '}
                              {assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString() : 'recently'}
                            </p>
                            {assignment.note ? <p className="text-xs text-slate-500">Note: {assignment.note}</p> : null}
                          </div>
                          <Button
                            variant="danger"
                            size="sm"
                            iconPosition="start"
                            icon={TrashIcon}
                            onClick={() => onRevokeAssignment(assignment.id)}
                            loading={assigning}
                          >
                            Revoke
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">History</h4>
                  <p className="text-xs text-slate-500">
                    Last revoke: {formatDateTime(stats.lastRevokedAt, { fallback: 'none recorded' })}
                  </p>
                  {historicalAssignments.length === 0 ? (
                    <p className="text-sm text-slate-500">No revoked assignments recorded.</p>
                  ) : (
                    <ul className="space-y-2 text-xs text-slate-500">
                      {historicalAssignments.map((assignment) => (
                        <li key={assignment.id}>
                          {assignment.user?.email ?? 'User'} revoked on{' '}
                          {assignment.revokedAt ? new Date(assignment.revokedAt).toLocaleString() : 'unknown'}
                          {assignment.note ? ` · ${assignment.note}` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

RoleManagementView.propTypes = {
  loading: PropTypes.bool.isRequired,
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string,
      name: PropTypes.string,
      description: PropTypes.string,
      isSystem: PropTypes.bool,
      status: PropTypes.string,
      assignmentCounts: PropTypes.shape({
        active: PropTypes.number,
        total: PropTypes.number
      })
    })
  ).isRequired,
  selectedKey: PropTypes.string,
  detail: PropTypes.shape({
    permissionsCatalog: PropTypes.arrayOf(PropTypes.string)
  }),
  formState: PropTypes.shape({
    key: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    inherits: PropTypes.arrayOf(PropTypes.string),
    permissions: PropTypes.arrayOf(PropTypes.string),
    allowedMenus: PropTypes.string,
    deniedMenus: PropTypes.string,
    dataVisibility: PropTypes.object,
    isSystem: PropTypes.bool,
    status: PropTypes.string
  }).isRequired,
  assignmentForm: PropTypes.shape({
    email: PropTypes.string,
    userId: PropTypes.string,
    tenantId: PropTypes.string,
    expiresAt: PropTypes.string,
    note: PropTypes.string
  }).isRequired,
  searchDraft: PropTypes.string.isRequired,
  statusFilter: PropTypes.string.isRequired,
  saving: PropTypes.bool.isRequired,
  assigning: PropTypes.bool.isRequired,
  refreshingRole: PropTypes.bool.isRequired,
  feedback: PropTypes.shape({
    type: PropTypes.string,
    message: PropTypes.string
  }),
  error: PropTypes.string,
  headerMeta: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      emphasis: PropTypes.bool,
      caption: PropTypes.string
    })
  ).isRequired,
  availableRoleOptions: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string,
      isSystem: PropTypes.bool
    })
  ).isRequired,
  stats: PropTypes.shape({
    activeAssignments: PropTypes.number,
    totalAssignments: PropTypes.number,
    revokedAssignments: PropTypes.number,
    uniqueTenants: PropTypes.number,
    nextExpiry: PropTypes.string,
    lastAssignedAt: PropTypes.string,
    lastRevokedAt: PropTypes.string
  }).isRequired,
  newPermission: PropTypes.string.isRequired,
  activeAssignments: PropTypes.arrayOf(PropTypes.object).isRequired,
  historicalAssignments: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSearchDraftChange: PropTypes.func.isRequired,
  onStatusFilterChange: PropTypes.func.isRequired,
  onRefreshRoles: PropTypes.func.isRequired,
  onSearchSubmit: PropTypes.func.isRequired,
  onSelectRole: PropTypes.func.isRequired,
  onCreateRole: PropTypes.func.isRequired,
  onFormFieldChange: PropTypes.func.isRequired,
  onDataVisibilityChange: PropTypes.func.isRequired,
  onToggleInheritance: PropTypes.func.isRequired,
  onAddPermission: PropTypes.func.isRequired,
  onRemovePermission: PropTypes.func.isRequired,
  onNewPermissionChange: PropTypes.func.isRequired,
  onSaveRole: PropTypes.func.isRequired,
  onArchiveRole: PropTypes.func.isRequired,
  onAssignRole: PropTypes.func.isRequired,
  onRevokeAssignment: PropTypes.func.isRequired,
  onAssignmentFieldChange: PropTypes.func.isRequired,
  onResetAssignmentForm: PropTypes.func.isRequired,
  onReloadRole: PropTypes.func.isRequired
};

RoleManagementView.defaultProps = {
  selectedKey: null,
  detail: null,
  feedback: null,
  error: null
};

export default RoleManagementView;
