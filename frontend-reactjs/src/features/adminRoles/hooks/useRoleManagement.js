import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listRoles,
  fetchRole,
  createRole,
  updateRole,
  archiveRole,
  assignRole,
  revokeRoleAssignment
} from '../../../api/rbacClient.js';
import {
  EMPTY_ASSIGNMENT,
  EMPTY_FORM,
  EMPTY_STATS,
  buildMetaSummary,
  roleToForm,
  splitList
} from '../utils.js';

export function useRoleManagement() {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [detail, setDetail] = useState(null);
  const [formState, setFormState] = useState({ ...EMPTY_FORM });
  const [assignmentForm, setAssignmentForm] = useState({ ...EMPTY_ASSIGNMENT });
  const [searchDraft, setSearchDraft] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [refreshingRole, setRefreshingRole] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newPermission, setNewPermission] = useState('');

  const stats = detail?.stats ?? EMPTY_STATS;

  const availableRoleOptions = useMemo(() => {
    if (detail?.availableRoles) {
      return detail.availableRoles.filter((option) => option.key !== formState.key);
    }
    return roles
      .filter((role) => role.key !== formState.key)
      .map((role) => ({ key: role.key, label: role.label ?? role.name ?? role.key, isSystem: role.isSystem }));
  }, [detail, roles, formState.key]);

  const headerMeta = useMemo(() => buildMetaSummary(roles, lastUpdated), [roles, lastUpdated]);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const { roles: fetched } = await listRoles({ search: searchTerm, status: statusFilter });
      setRoles(fetched);
      setSelectedKey((current) => {
        if (current && fetched.some((role) => role.key === current)) {
          return current;
        }
        return fetched[0]?.key ?? '__new__';
      });
      setError(null);
      setLastUpdated(Date.now());
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to load roles';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  const loadRoleDetail = useCallback(async (key) => {
    if (!key || key === '__new__') {
      setDetail(null);
      setFormState({ ...EMPTY_FORM });
      setAssignmentForm({ ...EMPTY_ASSIGNMENT });
      return;
    }
    setRefreshingRole(true);
    try {
      const payload = await fetchRole(key);
      setDetail(payload);
      setFormState(roleToForm(payload.role));
      setAssignmentForm({ ...EMPTY_ASSIGNMENT });
      setFeedback(null);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to load role';
      setFeedback({ type: 'error', message });
    } finally {
      setRefreshingRole(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    loadRoleDetail(selectedKey);
  }, [selectedKey, loadRoleDetail]);

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      setSearchTerm(searchDraft.trim());
    },
    [searchDraft]
  );

  const handleSelectRole = useCallback((key) => {
    setSelectedKey(key);
  }, []);

  const handleFormChange = useCallback((field, value) => {
    setFormState((current) => ({
      ...current,
      [field]: value
    }));
  }, []);

  const handleDataVisibilityChange = useCallback((field, value) => {
    setFormState((current) => ({
      ...current,
      dataVisibility: { ...current.dataVisibility, [field]: value }
    }));
  }, []);

  const handleToggleInheritance = useCallback((roleKey) => {
    setFormState((current) => {
      const includes = current.inherits.includes(roleKey);
      const inherits = includes
        ? current.inherits.filter((entry) => entry !== roleKey)
        : [...current.inherits, roleKey];
      return { ...current, inherits };
    });
  }, []);

  const handleAddPermission = useCallback(() => {
    const trimmed = newPermission.trim();
    if (!trimmed) return;
    setFormState((current) => {
      if (current.permissions.includes(trimmed)) {
        return current;
      }
      return { ...current, permissions: [...current.permissions, trimmed] };
    });
    setNewPermission('');
  }, [newPermission]);

  const handleRemovePermission = useCallback((permission) => {
    setFormState((current) => ({
      ...current,
      permissions: current.permissions.filter((entry) => entry !== permission)
    }));
  }, []);

  const formToPayload = useCallback(
    () => ({
      key: formState.key,
      name: formState.name,
      description: formState.description,
      inherits: formState.inherits,
      permissions: formState.permissions,
      navigation: {
        allowedMenus: splitList(formState.allowedMenus),
        deniedMenus: splitList(formState.deniedMenus)
      },
      dataVisibility: { ...formState.dataVisibility }
    }),
    [formState]
  );

  const handleSave = useCallback(async () => {
    const payload = formToPayload();
    if (!payload.key || !payload.name) {
      setFeedback({ type: 'error', message: 'Role name and key are required.' });
      return;
    }

    setSaving(true);
    try {
      const result =
        selectedKey && selectedKey !== '__new__'
          ? await updateRole(selectedKey, payload)
          : await createRole(payload);
      setDetail(result);
      setFormState(roleToForm(result.role));
      setSelectedKey(result.role.key);
      setFeedback({ type: 'success', message: selectedKey === '__new__' ? 'Role created successfully.' : 'Role updated.' });
      setAssignmentForm({ ...EMPTY_ASSIGNMENT });
      await loadRoles();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Failed to save role';
      setFeedback({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  }, [formToPayload, loadRoles, selectedKey]);

  const handleArchive = useCallback(async () => {
    if (!selectedKey || selectedKey === '__new__') return;
    setSaving(true);
    try {
      const { role } = await archiveRole(selectedKey);
      setFeedback({ type: 'success', message: 'Role archived.' });
      setFormState(roleToForm(role));
      setDetail((current) =>
        current
          ? { ...current, role, assignments: [], stats: { ...EMPTY_STATS, lastUpdatedAt: role.updatedAt ?? null } }
          : {
              role,
              assignments: [],
              stats: { ...EMPTY_STATS, lastUpdatedAt: role.updatedAt ?? null },
              permissionsCatalog: [],
              availableRoles: []
            }
      );
      await loadRoles();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Failed to archive role';
      setFeedback({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  }, [loadRoles, selectedKey]);

  const handleAssign = useCallback(
    async (event) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }
      if (!selectedKey || selectedKey === '__new__') return;
      setAssigning(true);
      try {
        const result = await assignRole(selectedKey, assignmentForm);
        setDetail(result);
        setFormState(roleToForm(result.role));
        setAssignmentForm({ ...EMPTY_ASSIGNMENT });
        setFeedback({ type: 'success', message: 'Role assigned.' });
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Failed to assign role';
        setFeedback({ type: 'error', message });
      } finally {
        setAssigning(false);
      }
    },
    [assignmentForm, selectedKey]
  );

  const handleRevoke = useCallback(
    async (assignmentId) => {
      if (!selectedKey || !assignmentId) return;
      setAssigning(true);
      try {
        const result = await revokeRoleAssignment(selectedKey, assignmentId);
        setDetail(result);
        setFormState(roleToForm(result.role));
        setFeedback({ type: 'success', message: 'Assignment revoked.' });
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Failed to revoke assignment';
        setFeedback({ type: 'error', message });
      } finally {
        setAssigning(false);
      }
    },
    [selectedKey]
  );

  const updateAssignmentField = useCallback((field, value) => {
    setAssignmentForm((current) => ({ ...current, [field]: value }));
  }, []);

  const resetAssignmentForm = useCallback(() => {
    setAssignmentForm({ ...EMPTY_ASSIGNMENT });
  }, []);

  const activeAssignments = detail?.assignments?.filter((assignment) => !assignment.revokedAt) ?? [];
  const historicalAssignments = detail?.assignments?.filter((assignment) => assignment.revokedAt) ?? [];

  return {
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
    loadRoleDetail,
    handleSearchSubmit,
    handleSelectRole,
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
    startCreateRole: () => setSelectedKey('__new__')
  };
}

export default useRoleManagement;
