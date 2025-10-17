import { createWindow } from './helpers.js';
import { enterpriseDashboardMetadata } from './enterprise/metadata.js';
import { enterpriseOverviewSection } from './enterprise/sections/overview.js';
import { enterpriseCalendarSection } from './enterprise/sections/calendar.js';
import { enterprisePortfolioSection } from './enterprise/sections/portfolio.js';
import { enterpriseCampaignsSection } from './enterprise/sections/campaigns.js';
import { enterpriseFinanceSection } from './enterprise/sections/finance.js';
import { enterpriseComplianceSection } from './enterprise/sections/compliance.js';
import { enterpriseVendorsSection } from './enterprise/sections/vendors.js';

export const enterpriseDashboard = {
  persona: 'enterprise',
  name: 'Enterprise Performance Suite',
  headline: 'Track spend, campaigns, automations, and risk signals across every facility.',
  window: createWindow(),
  metadata: enterpriseDashboardMetadata,
  navigation: [
    enterpriseOverviewSection,
    enterpriseCalendarSection,
    enterprisePortfolioSection,
    enterpriseCampaignsSection,
    enterpriseFinanceSection,
    enterpriseComplianceSection,
    enterpriseVendorsSection
  ]
};

export default enterpriseDashboard;
