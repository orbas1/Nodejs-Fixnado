export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin team' },
  { value: 'operations', label: 'Operations crew' },
  { value: 'provider_admin', label: 'Provider admins' },
  { value: 'provider', label: 'Provider managers' },
  { value: 'enterprise', label: 'Enterprise clients' }
];

export const ASSET_TYPE_OPTIONS = [
  { value: 'logo', label: 'Logo' },
  { value: 'wordmark', label: 'Wordmark' },
  { value: 'hero_image', label: 'Hero banner' },
  { value: 'illustration', label: 'Illustration' },
  { value: 'icon', label: 'Icon' },
  { value: 'screenshot', label: 'Screenshot' },
  { value: 'background', label: 'Background' },
  { value: 'pattern', label: 'Pattern' },
  { value: 'other', label: 'Other asset' }
];

export const PUBLISH_STATE_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Needs review' },
  { value: 'live', label: 'Live' },
  { value: 'retired', label: 'Archived' }
];

export const DENSITY_OPTIONS = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' }
];

export const SHADOW_OPTIONS = [
  { value: 'none', label: 'Flat' },
  { value: 'sm', label: 'Light' },
  { value: 'md', label: 'Elevated' },
  { value: 'lg', label: 'Deep' }
];

export const NAV_STYLE_OPTIONS = [
  { value: 'pill', label: 'Pills' },
  { value: 'underline', label: 'Underline' },
  { value: 'minimal', label: 'Minimal' }
];

export const STAT_COLUMN_OPTIONS = [
  { value: 2, label: '2 columns' },
  { value: 3, label: '3 columns' },
  { value: 4, label: '4 columns' }
];

export const STATUS_TONES = {
  success: 'success',
  error: 'danger',
  info: 'info'
};

export function buildRoleOptions(dashboardRoles = []) {
  const registered = new Set(dashboardRoles.map((role) => role.id));
  return ROLE_OPTIONS.map((option) => {
    if (registered.has(option.value)) {
      const role = dashboardRoles.find((entry) => entry.id === option.value);
      return {
        ...option,
        label: role?.name ?? option.label
      };
    }
    return option;
  });
}
