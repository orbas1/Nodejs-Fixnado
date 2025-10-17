export const userSupportSection = {
  id: 'support',
  icon: 'support',
  label: 'Support Desk',
  menuLabel: 'Support',
  description: 'Escalations and concierge follow-ups ready for action.',
  type: 'list',
  data: {
    items: [
      {
        title: 'Escalations',
        description: '2 urgent disputes need finance sign-off within 12 hours.',
        status: 'Priority',
        href: '/communications?tag=dispute',
        cta: 'Open inbox'
      },
      {
        title: 'Site check-ins',
        description: 'Concierge follow-ups due for 3 completed jobs today.',
        status: 'Due today',
        href: '/communications?tag=concierge'
      },
      {
        title: 'Knowledge base',
        description: 'Latest onboarding articles shared with tenant teams.',
        status: 'Updated 1h ago',
        href: 'https://support.fixnado.com/knowledge'
      }
    ]
  }
};

export default userSupportSection;
