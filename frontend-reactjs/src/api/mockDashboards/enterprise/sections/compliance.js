export const enterpriseComplianceSection = {
  id: 'compliance',
  icon: 'compliance',
  label: 'Compliance & Risk',
  menuLabel: 'Risk',
  description: 'Manage audits, risk registers, and remediation tasks.',
  type: 'list',
  data: {
    items: [
      {
        title: 'Healthcare facility documentation',
        description: 'Two facilities require updated infection control sign-off.',
        status: 'Action required'
      },
      {
        title: 'Fire safety certifications',
        description: 'Portfolio coverage at 92% — final two sites scheduled this week.',
        status: 'In progress'
      },
      {
        title: 'Escalation backlog',
        description: 'Seven risk signals open, one tagged critical, two high.',
        status: 'Monitor'
      }
    ]
  }
};

export default enterpriseComplianceSection;
