export const enterpriseCampaignsSection = {
  id: 'campaigns',
  icon: 'pipeline',
  label: 'Campaign Delivery',
  description: 'Coordinate enterprise-wide campaigns from launch to ROI.',
  type: 'board',
  data: {
    columns: [
      {
        title: 'Discovery',
        items: [
          { title: 'Smart campus awareness', owner: 'Marketing', value: 'KPI: +15% awareness', eta: 'Brief 22 Mar' },
          { title: 'Safety compliance storytelling', owner: 'Comms', value: 'KPI: 4k impressions', eta: 'Research sprint' }
        ]
      },
      {
        title: 'In market',
        items: [
          { title: 'Sustainability pledge', owner: 'Marketing', value: 'KPI: 120 sign-ups', eta: 'Phase 2 live' },
          { title: 'Facilities concierge launch', owner: 'Product', value: 'KPI: +18 CSAT', eta: 'Weekly sync' }
        ]
      },
      {
        title: 'Measurement',
        items: [
          { title: 'Automation ROI recap', owner: 'Finance', value: 'KPI: £420k savings', eta: 'Dashboard refresh' },
          { title: 'Vendor satisfaction pulse', owner: 'Ops', value: 'KPI: 4.6★', eta: 'Survey closes 24 Mar' }
        ]
      },
      {
        title: 'Retrospective',
        items: [
          { title: 'Quarterly board pack', owner: 'Exec office', value: 'KPI: Exec alignment', eta: 'Compile 28 Mar' }
        ]
      }
    ]
  }
};

export default enterpriseCampaignsSection;
