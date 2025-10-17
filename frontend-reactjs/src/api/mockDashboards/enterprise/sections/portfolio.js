export const enterprisePortfolioSection = {
  id: 'portfolio',
  icon: 'enterprise',
  label: 'Program Portfolio',
  description: 'High-level snapshot of major initiatives across regions.',
  type: 'grid',
  data: {
    cards: [
      {
        title: 'Sustainability Acceleration',
        details: ['12 buildings retrofitted', '£68k energy savings to date', 'Wave 3 pilot launching Apr'],
        accent: 'from-emerald-100 via-white to-white'
      },
      {
        title: 'Smart Security Rollout',
        details: ['18 sites deployed', '5 awaiting permits', 'Automation playbooks reduce response 23%'],
        accent: 'from-sky-100 via-white to-white'
      },
      {
        title: 'Community Spaces Revamp',
        details: ['7 civic centres in delivery', '£2.1m total value', 'Engagement up 18%'],
        accent: 'from-amber-100 via-white to-white'
      }
    ]
  }
};

export default enterprisePortfolioSection;
