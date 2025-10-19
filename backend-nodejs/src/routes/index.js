import { Router } from 'express';
import authRoutes from './authRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import feedRoutes from './feedRoutes.js';
import timelineHubRoutes from './timelineHubRoutes.js';
import searchRoutes from './searchRoutes.js';
import adminLiveFeedAuditRoutes from './adminLiveFeedAuditRoutes.js';
import adminRoutes from './adminRoutes.js';
import adminRentalRoutes from './adminRentalRoutes.js';
import adminServiceManagementRoutes from './adminServiceManagementRoutes.js';
import telemetryRoutes from './telemetryRoutes.js';
import zoneRoutes from './zoneRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import rentalRoutes from './rentalRoutes.js';
import toolRentalRoutes from './toolRentalRoutes.js';
import complianceRoutes from './complianceRoutes.js';
import marketplaceRoutes from './marketplaceRoutes.js';
import materialsRoutes from './materialsRoutes.js';
import campaignRoutes from './campaignRoutes.js';
import communicationsRoutes from './communicationsRoutes.js';
import analyticsPipelineRoutes from './analyticsPipelineRoutes.js';
import panelRoutes from './panelRoutes.js';
import providerSettingsRoutes from './providerSettingsRoutes.js';
import businessFrontRoutes from './businessFrontRoutes.js';
import blogRoutes from './blogRoutes.js';
import adminBlogRoutes from './adminBlogRoutes.js';
import adminHomeBuilderRoutes from './adminHomeBuilderRoutes.js';
import affiliateRoutes from './affiliateRoutes.js';
import consentRoutes from './consentRoutes.js';
import financeRoutes from './financeRoutes.js';
import customerServiceManagementRoutes from './customerServiceManagementRoutes.js';
import accountSupportRoutes from './accountSupportRoutes.js';
import adminEnterpriseRoutes from './adminEnterpriseRoutes.js';
import adminMarketplaceRoutes from './adminMarketplaceRoutes.js';
import legalRoutes from './legalRoutes.js';
import userSettingsRoutes from './userSettingsRoutes.js';
import serviceOrderRoutes from './serviceOrderRoutes.js';
import customerControlRoutes from './customerControlRoutes.js';
import accountRoutes from './accountRoutes.js';
import providerControlRoutes from './providerControlRoutes.js';
import servicemenRoutes from './servicemenRoutes.js';
import servicemanFinanceRoutes from './servicemanFinanceRoutes.js';
import servicemanTaxRoutes from './servicemanTaxRoutes.js';
import servicemanSettingsRoutes from './servicemanSettingsRoutes.js';
import providerCalendarRoutes from './providerCalendarRoutes.js';
import servicemanBookingRoutes from './servicemanBookingRoutes.js';
import providerBookingRoutes from './providerBookingRoutes.js';
import providerEscrowRoutes from './providerEscrowRoutes.js';
import servicemanEscrowRoutes from './servicemanEscrowRoutes.js';
import fixnadoAdsRoutes from './fixnadoAdsRoutes.js';
import providerRoutes from './providerRoutes.js';
import adminBookingRoutes from './adminBookingRoutes.js';
import servicemanRoutes from './servicemanRoutes.js';
import servicemanMetricsRoutes from './servicemanMetricsRoutes.js';
import servicemanCustomJobRoutes from './servicemanCustomJobRoutes.js';
import servicemanControlRoutes from './servicemanControlRoutes.js';
import walletRoutes, { adminWalletRouter } from './walletRoutes.js';
import { authenticate } from '../middleware/auth.js';
import { requireFeatureToggle } from '../middleware/featureToggleMiddleware.js';

const router = Router();
const v1Router = Router();

const financeGate = requireFeatureToggle('finance.platform', {
  message: 'Finance and payout tooling is currently restricted to launch partners.',
  remediation:
    'Contact the Fixnado finance operations team and reference feature toggle "finance.platform" to request rollout approval.',
  auditResource: 'routes:finance'
});

const servicemanGate = requireFeatureToggle('serviceman.core', {
  message: 'Serviceman tooling is rolling out gradually and is not enabled for this account yet.',
  remediation: 'Coordinate with Field Operations and reference feature toggle "serviceman.core" to be included in the rollout.',
  auditResource: 'routes:serviceman'
});

const servicemanSurfaceRouter = Router();
servicemanSurfaceRouter.use('/', servicemanRoutes);
servicemanSurfaceRouter.use('/', servicemanEscrowRoutes);
servicemanSurfaceRouter.use('/custom-jobs', servicemanCustomJobRoutes);
servicemanSurfaceRouter.use('/bookings', servicemanBookingRoutes);
servicemanSurfaceRouter.use('/metrics', servicemanMetricsRoutes);
servicemanSurfaceRouter.use('/control-centre', authenticate, servicemanControlRoutes);

const routeDefinitions = [
  { path: '/auth', router: authRoutes },
  { path: '/services', router: serviceRoutes },
  { path: '/feed', router: feedRoutes },
  { path: '/timeline-hub', router: timelineHubRoutes },
  { path: '/search', router: searchRoutes },
  { path: '/admin/bookings', router: adminBookingRoutes },
  { path: '/admin/rentals', router: adminRentalRoutes },
  { path: '/admin/services', router: adminServiceManagementRoutes },
  { path: '/admin/live-feed', router: adminLiveFeedAuditRoutes },
  { path: '/admin', router: adminRoutes },
  { path: '/admin/enterprise', router: adminEnterpriseRoutes },
  { path: '/admin/marketplace', router: adminMarketplaceRoutes },
  { path: '/telemetry', router: telemetryRoutes },
  { path: '/zones', router: zoneRoutes },
  { path: '/bookings', router: bookingRoutes },
  { path: '/inventory', router: inventoryRoutes },
  { path: '/rentals', router: rentalRoutes },
  { path: '/tool-rentals', router: toolRentalRoutes },
  { path: '/compliance', router: complianceRoutes },
  { path: '/marketplace', router: marketplaceRoutes },
  { path: '/materials', router: materialsRoutes },
  { path: '/campaigns', router: campaignRoutes },
  { path: '/communications', router: communicationsRoutes },
  { path: '/analytics', router: analyticsPipelineRoutes },
  { path: '/panel/provider/settings', router: providerSettingsRoutes },
  { path: '/panel', router: panelRoutes },
  { path: '/business-fronts', router: businessFrontRoutes },
  { path: '/blog', router: blogRoutes },
  { path: '/admin/blog', router: adminBlogRoutes },
  { path: '/admin/home-builder', router: adminHomeBuilderRoutes },
  { path: '/affiliate', router: affiliateRoutes },
  { path: '/consent', router: consentRoutes },
  { path: '/customer/services', router: customerServiceManagementRoutes },
  { path: '/account-support', router: accountSupportRoutes },
  { path: '/admin/wallets', router: adminWalletRouter, middleware: [financeGate] },
  { path: '/legal', router: legalRoutes },
  { path: '/settings', router: userSettingsRoutes },
  { path: '/wallet', router: walletRoutes, middleware: [financeGate] },
  { path: '/service-orders', router: serviceOrderRoutes },
  { path: '/customer-control', router: customerControlRoutes },
  { path: '/account', router: accountRoutes },
  { path: '/provider-control', router: providerControlRoutes },
  { path: '/providers', router: providerCalendarRoutes },
  { path: '/provider/bookings', router: providerBookingRoutes },
  { path: '/provider/escrows', router: providerEscrowRoutes, middleware: [financeGate] },
  { path: '/provider', router: providerRoutes },
  { path: '/finance', router: financeRoutes, middleware: [financeGate] },
  { path: '/fixnado/ads', router: fixnadoAdsRoutes },
  { path: '/serviceman', router: servicemanSurfaceRouter, middleware: [authenticate, servicemanGate] },
  { path: '/servicemen', router: servicemenRoutes, middleware: [authenticate, servicemanGate] },
  { path: '/servicemen/finance', router: servicemanFinanceRoutes, middleware: [authenticate, servicemanGate] },
  { path: '/servicemen/tax', router: servicemanTaxRoutes, middleware: [authenticate, servicemanGate] },
  { path: '/servicemen/settings', router: servicemanSettingsRoutes, middleware: [authenticate, servicemanGate] }
];

const mountedRouters = new Map();

for (const definition of routeDefinitions) {
  const { path, router: targetRouter, middleware = [] } = definition;
  if (!targetRouter || typeof targetRouter.use !== 'function') {
    throw new Error(`Attempted to register an invalid router for path ${path}`);
  }

  if (mountedRouters.has(targetRouter)) {
    const previous = mountedRouters.get(targetRouter);
    throw new Error(`Router already mounted at ${previous}; refusing to mount again at ${path}`);
  }

  mountedRouters.set(targetRouter, path);
  const middlewareStack = Array.isArray(middleware) ? middleware.filter(Boolean) : [middleware].filter(Boolean);
  v1Router.use(path, ...middlewareStack, targetRouter);
}

router.use('/v1', v1Router);

export { v1Router };
export default router;
