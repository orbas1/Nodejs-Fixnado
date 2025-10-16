import RoleManagementView from '../features/adminRoles/components/RoleManagementView.jsx';
import useRoleManagement from '../features/adminRoles/hooks/useRoleManagement.js';

export default function AdminRoles() {
  const {
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
    setSearchDraft,
    setStatusFilter,
    loadRoles,
    handleSearchSubmit,
    handleSelectRole,
    startCreateRole,
    handleFormChange,
    handleDataVisibilityChange,
    handleToggleInheritance,
    handleAddPermission,
    handleRemovePermission,
    setNewPermission,
    handleSave,
    handleArchive,
    handleAssign,
    handleRevoke,
    updateAssignmentField,
    resetAssignmentForm,
    loadRoleDetail
  } = useRoleManagement();

  return (
    <RoleManagementView
      loading={loading}
      roles={roles}
      selectedKey={selectedKey}
      detail={detail}
      formState={formState}
      assignmentForm={assignmentForm}
      searchDraft={searchDraft}
      statusFilter={statusFilter}
      saving={saving}
      assigning={assigning}
      refreshingRole={refreshingRole}
      feedback={feedback}
      error={error}
      headerMeta={headerMeta}
      availableRoleOptions={availableRoleOptions}
      stats={stats}
      newPermission={newPermission}
      activeAssignments={activeAssignments}
      historicalAssignments={historicalAssignments}
      onSearchDraftChange={setSearchDraft}
      onStatusFilterChange={setStatusFilter}
      onRefreshRoles={loadRoles}
      onSearchSubmit={handleSearchSubmit}
      onSelectRole={handleSelectRole}
      onCreateRole={startCreateRole}
      onFormFieldChange={handleFormChange}
      onDataVisibilityChange={handleDataVisibilityChange}
      onToggleInheritance={handleToggleInheritance}
      onAddPermission={handleAddPermission}
      onRemovePermission={handleRemovePermission}
      onNewPermissionChange={setNewPermission}
      onSaveRole={handleSave}
      onArchiveRole={handleArchive}
      onAssignRole={handleAssign}
      onRevokeAssignment={handleRevoke}
      onAssignmentFieldChange={updateAssignmentField}
      onResetAssignmentForm={resetAssignmentForm}
      onReloadRole={loadRoleDetail}
    />
  );
}
