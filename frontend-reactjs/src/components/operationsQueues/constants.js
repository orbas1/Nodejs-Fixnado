export const STATUS_OPTIONS = [
  { value: 'operational', label: 'Operational' },
  { value: 'attention', label: 'Needs attention' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'blocked', label: 'Blocked' }
];

export const TONE_OPTIONS = [
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'danger', label: 'Critical' }
];

export const STATUS_BADGE_CLASSES = {
  operational: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  attention: 'bg-amber-50 text-amber-700 border-amber-200',
  delayed: 'bg-slate-100 text-slate-600 border-slate-200',
  blocked: 'bg-rose-50 text-rose-700 border-rose-200'
};

export const TONE_BADGE_CLASSES = {
  info: 'bg-slate-100 text-slate-600 border-slate-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200'
};

export const DEFAULT_CAPABILITIES = {
  canCreate: false,
  canEdit: false,
  canArchive: false,
  canManageUpdates: false
};

export const DEFAULT_METADATA = Object.freeze({
  tags: [],
  watchers: [],
  intakeChannels: [],
  slaMinutes: '',
  escalationContact: '',
  playbookUrl: '',
  autoAlerts: true,
  notes: ''
});
