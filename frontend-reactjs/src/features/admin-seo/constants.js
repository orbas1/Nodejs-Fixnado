export const ROLE_LABELS = {
  admin: 'Admin',
  provider: 'Provider',
  finance: 'Finance',
  serviceman: 'Serviceman',
  user: 'Customer',
  enterprise: 'Enterprise'
};

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value,
  label
}));

export const SEO_ALLOWED_ROLES = new Set(Object.keys(ROLE_LABELS));
