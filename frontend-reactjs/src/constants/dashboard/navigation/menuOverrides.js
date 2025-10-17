import { userNavigation } from './userNavigation.js';
import { providerNavigation } from './providerNavigation.js';
import { servicemanNavigation } from './servicemanNavigation.js';
import { adminNavigation } from './adminNavigation.js';
import { financeNavigation } from './financeNavigation.js';
import { enterpriseNavigation } from './enterpriseNavigation.js';

const toLookup = (items) =>
  items.reduce((acc, item) => {
    acc[item.id] = { menuLabel: item.menuLabel, href: item.href, icon: item.icon, label: item.label };
    return acc;
  }, {});

export const DASHBOARD_MENU_OVERRIDES = {
  user: toLookup(userNavigation),
  provider: toLookup(providerNavigation),
  serviceman: toLookup(servicemanNavigation),
  admin: toLookup(adminNavigation),
  finance: toLookup(financeNavigation),
  enterprise: toLookup(enterpriseNavigation)
};

export default DASHBOARD_MENU_OVERRIDES;
