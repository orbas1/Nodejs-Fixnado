export const adminSettingsSection = {
  id: 'settings',
  icon: 'settings',
  label: 'Platform Settings',
  description: 'Control tenants, feature flags, governance, and notifications.',
  type: 'settings',
  data: {
    panels: [
      {
        id: 'tenants',
        title: 'Tenant controls',
        description: 'Provisioning, rate cards, and access delegation.',
        items: [
          {
            id: 'tenant-onboarding',
            label: 'Auto-provision onboarding',
            type: 'toggle',
            enabled: true,
            meta: 'Applies to growth plan'
          },
          {
            id: 'tenant-quiet-hours',
            label: 'Global quiet hours',
            type: 'value',
            value: '22:00-06:00 UTC',
            meta: 'Override per tenant'
          }
        ]
      },
      {
        id: 'governance',
        title: 'Governance & audit',
        description: 'Keep audit logs and compliance exports ready.',
        items: [
          {
            id: 'audit-retention',
            label: 'Audit log retention',
            type: 'value',
            value: '18 months',
            meta: 'Enterprise default'
          },
          {
            id: 'gov-escalations',
            label: 'Auto-escalate critical alerts',
            type: 'toggle',
            enabled: true
          }
        ]
      },
      {
        id: 'notifications-admin',
        title: 'Notification policy',
        description: 'Escalation channels for major incidents.',
        items: [
          {
            id: 'notify-exec',
            label: 'Executive bridge',
            type: 'toggle',
            enabled: true,
            meta: 'SMS + Slack bridge'
          },
          {
            id: 'notify-ops',
            label: 'Ops heartbeat',
            type: 'toggle',
            enabled: true,
            meta: 'Email hourly digest'
          }
        ]
      }
    ]
  }
};

export default adminSettingsSection;
