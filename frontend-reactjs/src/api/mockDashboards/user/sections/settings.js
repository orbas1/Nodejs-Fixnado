export const userSettingsSection = {
  id: 'settings',
  icon: 'settings',
  label: 'Account Settings',
  menuLabel: 'Settings',
  description: 'Notifications, integrations, and workspace automation.',
  type: 'settings',
  data: {
    panels: [
      {
        id: 'notifications',
        title: 'Notifications',
        description: 'Control when Fixnado emails and texts are sent.',
        items: [
          {
            type: 'toggle',
            label: 'Crew arrival alerts',
            helper: 'Send SMS to the facilities lead when a crew starts travel.',
            value: true
          },
          {
            type: 'toggle',
            label: 'Finance digest',
            helper: 'Weekly summary of escrow releases and open disputes.',
            value: true
          },
          {
            type: 'toggle',
            label: 'Tenant survey nudges',
            helper: 'Reminder to share concierge survey links post-visit.',
            value: false
          }
        ]
      },
      {
        id: 'integrations',
        title: 'Integrations',
        description: 'Connected systems that power this workspace.',
        items: [
          {
            type: 'link',
            label: 'Slack channel: #facilities-alerts',
            helper: 'Crew updates piped to facilities leadership.',
            href: 'https://slack.com'
          },
          {
            type: 'link',
            label: 'Sage Intacct',
            helper: 'Finance exports sync nightly at 02:00.',
            href: '/settings/integrations/sage'
          }
        ]
      }
    ]
  }
};

export default userSettingsSection;
