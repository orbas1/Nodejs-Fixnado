export const providerSettingsSection = {
  id: 'settings',
  icon: 'automation',
  label: 'Automation Settings',
  menuLabel: 'Settings',
  description: 'Workflows and AI assistance powering the studio.',
  type: 'settings',
  data: {
    panels: [
      {
        id: 'automations',
        title: 'Automation playbooks',
        description: 'Control AI routing, bidding, and concierge assistance.',
        items: [
          { id: 'auto-routing', label: 'AI crew routing', type: 'toggle', enabled: true, helper: 'Optimises travel buffers' },
          { id: 'auto-bid', label: 'Automated bid composer', type: 'toggle', enabled: false, helper: 'Requires finance approval' }
        ]
      },
      {
        id: 'alerts',
        title: 'Alerting thresholds',
        description: 'Tune risk tolerances for escalations and SLA breaches.',
        items: [
          { id: 'sla-alert', label: 'SLA breach threshold', type: 'value', value: '< 4 hours', meta: 'Escalate to operations' },
          { id: 'invoice-alert', label: 'Invoice ageing threshold', type: 'value', value: '> 10 days', meta: 'Finance & ops' }
        ]
      }
    ]
  }
};

export default providerSettingsSection;
