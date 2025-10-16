const BASE_ENDPOINT = '/api/admin/rbac';

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    const payload = await response.json().catch(() => ({}));
    return payload;
  }

  const errorPayload = await response.json().catch(() => ({}));
  const error = new Error(errorPayload?.message || fallbackMessage);
  error.status = response.status;
  error.details = errorPayload?.details;
  throw error;
}

function normaliseStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0);
}

function normaliseNavigation(navigation) {
  return {
    allowedMenus: normaliseStringArray(navigation?.allowedMenus),
    deniedMenus: normaliseStringArray(navigation?.deniedMenus)
  };
}

function normaliseDataVisibility(dataVisibility) {
  if (!dataVisibility || typeof dataVisibility !== 'object') {
    return {};
  }
  const entries = {};
  Object.entries(dataVisibility).forEach(([key, value]) => {
    if (value == null) return;
    entries[key] = String(value);
  });
  return entries;
}

function normaliseRole(role) {
  if (!role || typeof role !== 'object') {
    return null;
  }
  return {
    ...role,
    navigation: normaliseNavigation(role.navigation),
    dataVisibility: normaliseDataVisibility(role.dataVisibility ?? role.metadata?.dataVisibility),
    inherits: Array.isArray(role.inherits) ? [...role.inherits] : [],
    permissions: Array.isArray(role.permissions) ? [...role.permissions] : [],
    metadata: role.metadata ?? {}
  };
}

function normaliseAssignment(assignment) {
  if (!assignment || typeof assignment !== 'object') {
    return null;
  }
  return {
    ...assignment,
    user: assignment.user ?? null,
    assignedBy: assignment.assignedBy ?? null
  };
}

function toIsoString(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normaliseRoleStats(stats) {
  if (!stats || typeof stats !== 'object') {
    return {
      activeAssignments: 0,
      totalAssignments: 0,
      revokedAssignments: 0,
      uniqueTenants: 0,
      nextExpiry: null,
      lastAssignedAt: null,
      lastRevokedAt: null,
      lastUpdatedAt: null
    };
  }

  const toCount = (value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  return {
    activeAssignments: toCount(stats.activeAssignments),
    totalAssignments: toCount(stats.totalAssignments),
    revokedAssignments: toCount(stats.revokedAssignments),
    uniqueTenants: toCount(stats.uniqueTenants),
    nextExpiry: toIsoString(stats.nextExpiry),
    lastAssignedAt: toIsoString(stats.lastAssignedAt),
    lastRevokedAt: toIsoString(stats.lastRevokedAt),
    lastUpdatedAt: toIsoString(stats.lastUpdatedAt)
  };
}

export async function listRoles({ search, status, signal } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status) params.set('status', status);

  const url = `${BASE_ENDPOINT}/roles${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  const payload = await handleResponse(response, 'Failed to load roles');
  const roles = Array.isArray(payload.roles) ? payload.roles.map(normaliseRole) : [];
  return { roles, meta: payload.meta ?? { total: roles.length } };
}

export async function fetchRole(key, { signal } = {}) {
  const response = await fetch(`${BASE_ENDPOINT}/roles/${encodeURIComponent(key)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  const payload = await handleResponse(response, 'Failed to load role');
  return {
    role: normaliseRole(payload.role),
    assignments: Array.isArray(payload.assignments)
      ? payload.assignments.map(normaliseAssignment).filter(Boolean)
      : [],
    stats: normaliseRoleStats(payload.stats),
    permissionsCatalog: Array.isArray(payload.permissionsCatalog) ? payload.permissionsCatalog : [],
    availableRoles: Array.isArray(payload.availableRoles) ? payload.availableRoles : []
  };
}

export async function createRole(body) {
  const response = await fetch(`${BASE_ENDPOINT}/roles`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await handleResponse(response, 'Failed to create role');
  return {
    role: normaliseRole(payload.role),
    assignments: Array.isArray(payload.assignments)
      ? payload.assignments.map(normaliseAssignment).filter(Boolean)
      : [],
    stats: normaliseRoleStats(payload.stats),
    permissionsCatalog: Array.isArray(payload.permissionsCatalog) ? payload.permissionsCatalog : [],
    availableRoles: Array.isArray(payload.availableRoles) ? payload.availableRoles : []
  };
}

export async function updateRole(key, body) {
  const response = await fetch(`${BASE_ENDPOINT}/roles/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await handleResponse(response, 'Failed to update role');
  return {
    role: normaliseRole(payload.role),
    assignments: Array.isArray(payload.assignments)
      ? payload.assignments.map(normaliseAssignment).filter(Boolean)
      : [],
    stats: normaliseRoleStats(payload.stats),
    permissionsCatalog: Array.isArray(payload.permissionsCatalog) ? payload.permissionsCatalog : [],
    availableRoles: Array.isArray(payload.availableRoles) ? payload.availableRoles : []
  };
}

export async function archiveRole(key) {
  const response = await fetch(`${BASE_ENDPOINT}/roles/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });

  const payload = await handleResponse(response, 'Failed to archive role');
  return { role: normaliseRole(payload.role) };
}

export async function assignRole(key, body) {
  const response = await fetch(`${BASE_ENDPOINT}/roles/${encodeURIComponent(key)}/assignments`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await handleResponse(response, 'Failed to assign role');
  return {
    role: normaliseRole(payload.role),
    assignments: Array.isArray(payload.assignments)
      ? payload.assignments.map(normaliseAssignment).filter(Boolean)
      : [],
    stats: normaliseRoleStats(payload.stats),
    permissionsCatalog: Array.isArray(payload.permissionsCatalog) ? payload.permissionsCatalog : [],
    availableRoles: Array.isArray(payload.availableRoles) ? payload.availableRoles : []
  };
}

export async function revokeRoleAssignment(key, assignmentId) {
  const response = await fetch(
    `${BASE_ENDPOINT}/roles/${encodeURIComponent(key)}/assignments/${encodeURIComponent(assignmentId)}`,
    {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
      credentials: 'include'
    }
  );

  const payload = await handleResponse(response, 'Failed to revoke assignment');
  return {
    role: normaliseRole(payload.role),
    assignments: Array.isArray(payload.assignments)
      ? payload.assignments.map(normaliseAssignment).filter(Boolean)
      : [],
    stats: normaliseRoleStats(payload.stats),
    permissionsCatalog: Array.isArray(payload.permissionsCatalog) ? payload.permissionsCatalog : [],
    availableRoles: Array.isArray(payload.availableRoles) ? payload.availableRoles : []
  };
}

export default {
  listRoles,
  fetchRole,
  createRole,
  updateRole,
  archiveRole,
  assignRole,
  revokeRoleAssignment
};

