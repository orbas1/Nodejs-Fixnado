export const EMPTY_FORM = {
  key: '',
  name: '',
  description: '',
  inherits: [],
  permissions: [],
  allowedMenus: '',
  deniedMenus: '',
  dataVisibility: {
    finance: '',
    messaging: '',
    inventory: '',
    analytics: ''
  },
  status: 'active',
  isSystem: false
};

export const EMPTY_ASSIGNMENT = {
  email: '',
  userId: '',
  tenantId: '',
  expiresAt: '',
  note: ''
};

export const EMPTY_STATS = {
  activeAssignments: 0,
  totalAssignments: 0,
  revokedAssignments: 0,
  uniqueTenants: 0,
  nextExpiry: null,
  lastAssignedAt: null,
  lastRevokedAt: null,
  lastUpdatedAt: null
};

export function splitList(value) {
  if (typeof value !== 'string') {
    return [];
  }
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item, index, self) => item && self.indexOf(item) === index);
}

export function roleToForm(role) {
  if (!role) {
    return { ...EMPTY_FORM };
  }
  return {
    key: role.key ?? '',
    name: role.label ?? role.name ?? '',
    description: role.description ?? '',
    inherits: Array.isArray(role.inherits) ? [...role.inherits] : [],
    permissions: Array.isArray(role.permissions) ? [...role.permissions] : [],
    allowedMenus: Array.isArray(role.navigation?.allowedMenus)
      ? role.navigation.allowedMenus.join(', ')
      : '',
    deniedMenus: Array.isArray(role.navigation?.deniedMenus) ? role.navigation.deniedMenus.join(', ') : '',
    dataVisibility: {
      finance: role.dataVisibility?.finance ?? '',
      messaging: role.dataVisibility?.messaging ?? '',
      inventory: role.dataVisibility?.inventory ?? '',
      analytics: role.dataVisibility?.analytics ?? ''
    },
    status: role.status ?? 'active',
    isSystem: Boolean(role.isSystem)
  };
}

export function buildMetaSummary(roles, lastUpdated) {
  const activeRoles = roles.filter((role) => role.status !== 'archived').length;
  const customRoles = roles.filter((role) => role.isSystem === false).length;
  const activeAssignments = roles.reduce(
    (total, role) => total + (role.assignmentCounts?.active ?? 0),
    0
  );
  return [
    { label: 'Active roles', value: String(activeRoles), emphasis: true },
    { label: 'Active assignments', value: String(activeAssignments) },
    { label: 'Custom roles', value: String(customRoles) },
    {
      label: 'Last sync',
      value: lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Pending',
      caption: lastUpdated ? new Date(lastUpdated).toLocaleDateString() : undefined
    }
  ];
}

export function formatDateTime(value, { fallback = '—', ...options } = {}) {
  if (!value) {
    return fallback;
  }

  try {
    const formatterOptions = {
      dateStyle: 'medium',
      timeStyle: 'short',
      ...options
    };

    if (formatterOptions.timeStyle == null) {
      delete formatterOptions.timeStyle;
    }
    if (formatterOptions.dateStyle == null) {
      delete formatterOptions.dateStyle;
    }

    return new Intl.DateTimeFormat(undefined, formatterOptions).format(new Date(value));
  } catch {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date.toLocaleString();
  }
}
