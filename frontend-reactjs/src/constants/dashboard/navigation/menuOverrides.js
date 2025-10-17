import { userNavigation } from './userNavigation.js';
import { providerNavigation } from './providerNavigation.js';
import { servicemanNavigation } from './servicemanNavigation.js';

const toLookup = (items) =>
  items.reduce((acc, item) => {
    acc[item.id] = { menuLabel: item.menuLabel, href: item.href, icon: item.icon, label: item.label };
    return acc;
  }, {});

export const DASHBOARD_MENU_OVERRIDES = {
  user: toLookup(userNavigation),
  provider: toLookup(providerNavigation),
  serviceman: toLookup(servicemanNavigation)
};

export default DASHBOARD_MENU_OVERRIDES;
