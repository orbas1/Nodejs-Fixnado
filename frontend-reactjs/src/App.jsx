import { lazy, Suspense, useMemo } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import clsx from 'clsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import SkipToContent from './components/accessibility/SkipToContent.jsx';
import Spinner from './components/ui/Spinner.jsx';
import FloatingChatLauncher from './components/communications/FloatingChatLauncher.jsx';
import RouteErrorBoundary from './components/error/RouteErrorBoundary.jsx';
import { useLocale } from './hooks/useLocale.js';
import { useSession } from './hooks/useSession.js';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute.jsx';
import ProviderProtectedRoute from './components/auth/ProviderProtectedRoute.jsx';
import ServicemanProtectedRoute from './components/auth/ServicemanProtectedRoute.jsx';
import ConsentBanner from './components/legal/ConsentBanner.jsx';
import GlobalMobileDock from './components/navigation/GlobalMobileDock.jsx';
import { buildMobileDockLinks } from './constants/globalShellConfig.js';

const Home = lazy(() => import('./pages/Home.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const CompanyRegister = lazy(() => import('./pages/CompanyRegister.jsx'));
const Feed = lazy(() => import('./pages/Feed.jsx'));
const BusinessFront = lazy(() => import('./pages/BusinessFront.jsx'));
const ProviderDashboard = lazy(() => import('./pages/ProviderDashboard.jsx'));
const ProviderStorefront = lazy(() => import('./pages/ProviderStorefront.jsx'));
const ProviderDeploymentManagement = lazy(() => import('./pages/ProviderDeploymentManagement.jsx'));
const ProviderOnboardingManagement = lazy(() => import('./pages/ProviderOnboardingManagement.jsx'));
const ProviderInventory = lazy(() => import('./pages/ProviderInventory.jsx'));
const ProviderServices = lazy(() => import('./pages/ProviderServices.jsx'));
const ProviderStorefrontControl = lazy(() => import('./pages/ProviderStorefrontControl.jsx'));
const ProviderCustomJobs = lazy(() => import('./pages/ProviderCustomJobs.jsx'));
const EnterprisePanel = lazy(() => import('./pages/EnterprisePanel.jsx'));
const Search = lazy(() => import('./pages/Search.jsx'));
const Services = lazy(() => import('./pages/Services.jsx'));
const Tools = lazy(() => import('./pages/Tools.jsx'));
const Materials = lazy(() => import('./pages/Materials.jsx'));
const AdminLogin = lazy(() => import('./pages/AdminLogin.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const AdminDisputeHealthHistory = lazy(() => import('./pages/AdminDisputeHealthHistory.jsx'));
const AdminHomeBuilder = lazy(() => import('./features/homeBuilder/AdminHomeBuilderPage.jsx'));
const AdminMonetization = lazy(() => import('./pages/AdminMonetization.jsx'));
const AdminEscrow = lazy(() => import('./pages/AdminEscrow.jsx'));
const AdminBookings = lazy(() => import('./pages/AdminBookings.jsx'));
const AdminWallets = lazy(() => import('./pages/AdminWallets.jsx'));
const AdminCustomJobs = lazy(() => import('./pages/AdminCustomJobs.jsx'));
const AdminRoles = lazy(() => import('./pages/AdminRoles.jsx'));
const AdminProfile = lazy(() => import('./pages/AdminProfile.jsx'));
const AdminPreferences = lazy(() => import('./pages/AdminPreferences.jsx'));
const AdminEnterprise = lazy(() => import('./pages/AdminEnterprise.jsx'));
const AppearanceManagement = lazy(() => import('./pages/AppearanceManagement.jsx'));
const AdminInbox = lazy(() => import('./pages/AdminInbox.jsx'));
const AdminRentals = lazy(() => import('./pages/AdminRentals.jsx'));
const AdminPurchaseManagement = lazy(() => import('./pages/AdminPurchaseManagement.jsx'));
const AdminWebsiteManagement = lazy(() => import('./pages/AdminWebsiteManagement.jsx'));
const AdminLiveFeedAuditing = lazy(() => import('./pages/AdminLiveFeedAuditing.jsx'));
const AdminSystemSettings = lazy(() => import('./pages/AdminSystemSettings.jsx'));
const ThemeStudio = lazy(() => import('./pages/ThemeStudio.jsx'));
const TelemetryDashboard = lazy(() => import('./pages/TelemetryDashboard.jsx'));
const AdminMarketplace = lazy(() => import('./pages/AdminMarketplace.jsx'));
const AdminTaxonomy = lazy(() => import('./pages/AdminTaxonomy.jsx'));
const Communications = lazy(() => import('./pages/Communications.jsx'));
const CreationStudio = lazy(() => import('./pages/CreationStudio.jsx'));
const DashboardHub = lazy(() => import('./pages/DashboardHub.jsx'));
const RoleDashboard = lazy(() => import('./pages/RoleDashboard.jsx'));
const OrderWorkspace = lazy(() => import('./pages/OrderWorkspace.jsx'));
const FinanceOverview = lazy(() => import('./pages/FinanceOverview.jsx'));
const GeoMatching = lazy(() => import('./pages/GeoMatching.jsx'));
const Blog = lazy(() => import('./pages/Blog.jsx'));
const BlogPost = lazy(() => import('./pages/BlogPost.jsx'));
const AdminBlog = lazy(() => import('./pages/AdminBlog.jsx'));
const AdminZones = lazy(() => import('./pages/AdminZones.jsx'));
const AdminLegal = lazy(() => import('./pages/AdminLegal.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const SecuritySettings = lazy(() => import('./pages/SecuritySettings.jsx'));
const CustomerSettingsDevPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/CustomerSettingsDevPreview.jsx'))
  : null;
const ServicemanTaxDevPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/ServicemanTaxDevPreview.jsx'))
  : null;
const ProviderAdsDevPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/ProviderAdsDevPreview.jsx'))
  : null;
const BusinessFrontDevPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/BusinessFrontDevPreview.jsx'))
  : null;
const CompliancePortal = lazy(() => import('./pages/CompliancePortal.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const AdminSeo = lazy(() => import('./pages/AdminSeo.jsx'));
const ServicemanByokWorkspace = lazy(() =>
  import('./modules/servicemanControlCentre/ServicemanByokWorkspace.jsx')
);
const ServicemanTaxWorkspace = lazy(() =>
  import('./modules/servicemanControlCentre/tax/ServicemanTaxWorkspace.jsx')
);

const ADMIN_ROUTES = [
  { path: '/admin/dashboard', Component: AdminDashboard },
  { path: '/admin/profile', Component: AdminProfile },
  { path: '/admin/disputes/health/:bucketId/history', Component: AdminDisputeHealthHistory },
  { path: '/admin/home-builder', Component: AdminHomeBuilder },
  { path: '/admin/blog', Component: AdminBlog },
  { path: '/admin/rentals', Component: AdminRentals },
  { path: '/admin/monetisation', Component: AdminMonetization },
  { path: '/admin/escrows', Component: AdminEscrow },
  { path: '/admin/bookings', Component: AdminBookings },
  { path: '/admin/wallets', Component: AdminWallets },
  { path: '/admin/custom-jobs', Component: AdminCustomJobs },
  { path: '/admin/roles', Component: AdminRoles },
  { path: '/admin/preferences', Component: AdminPreferences },
  { path: '/admin/enterprise', Component: AdminEnterprise },
  { path: '/admin/marketplace', Component: AdminMarketplace },
  { path: '/admin/appearance', Component: AppearanceManagement },
  { path: '/admin/inbox', Component: AdminInbox },
  { path: '/admin/purchases', Component: AdminPurchaseManagement },
  { path: '/admin/website-management', Component: AdminWebsiteManagement },
  { path: '/admin/live-feed/auditing', Component: AdminLiveFeedAuditing },
  { path: '/admin/system-settings', Component: AdminSystemSettings },
  { path: '/admin/taxonomy', Component: AdminTaxonomy },
  { path: '/admin/seo', Component: AdminSeo },
  { path: '/admin/theme-studio', Component: ThemeStudio },
  { path: '/admin/telemetry', Component: TelemetryDashboard },
  { path: '/admin/zones', Component: AdminZones },
  { path: '/admin/legal/:slug?', Component: AdminLegal }
];

function App() {
  const { t } = useLocale();
  const location = useLocation();
  const { isAuthenticated } = useSession();
  const isDashboardExperience = location.pathname.startsWith('/dashboards');
  const mobileDockLinks = useMemo(
    () => buildMobileDockLinks({ t, isAuthenticated }),
    [isAuthenticated, t]
  );

  return (
    <div className={`min-h-screen flex flex-col ${isDashboardExperience ? 'bg-slate-50' : 'gradient-bg'}`}>
      <SkipToContent />
      {!isDashboardExperience && <Header />}
      <main className={clsx('flex-1', !isDashboardExperience && 'pb-28 lg:pb-0')} id="main-content">
        <Suspense
          fallback={
            <div
              className="flex min-h-[50vh] items-center justify-center"
              role="status"
              aria-live="polite"
              data-qa="route-loader"
            >
              <Spinner className="h-8 w-8 text-primary" />
              <span className="sr-only">{t('common.loading')}</span>
            </div>
          }
        >
          <RouteErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register/company" element={<CompanyRegister />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/provider/dashboard" element={<ProviderDashboard />} />
              <Route
                path="/provider/custom-jobs"
                element={
                  <ProviderProtectedRoute>
                    <ProviderCustomJobs />
                  </ProviderProtectedRoute>
                }
              />
              <Route
                path="/provider/storefront"
                element={
                  <ProviderProtectedRoute>
                    <ProviderStorefront />
                  </ProviderProtectedRoute>
                }
              />
              <Route
                path="/provider/inventory"
                element={
                  <ProviderProtectedRoute>
                    <ProviderInventory />
                  </ProviderProtectedRoute>
                }
              />
              <Route
                path="/provider/services"
                element={
                  <ProviderProtectedRoute>
                    <ProviderServices />
                  </ProviderProtectedRoute>
                }
              />
              <Route path="/enterprise/panel" element={<Navigate to="/dashboards/enterprise/panel" replace />} />
              <Route path="/providers" element={<BusinessFront />} />
              <Route path="/providers/:slug" element={<BusinessFront />} />
              <Route path="/search" element={<Search />} />
              <Route path="/services" element={<Services />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/privacy" element={<Navigate to="/legal/privacy" replace />} />
              <Route path="/about" element={<About />} />
              <Route path="/settings/security" element={<SecuritySettings />} />
              <Route path="/account/profile" element={<Profile />} />
              <Route path="/compliance/data-requests" element={<CompliancePortal />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/admin" element={<AdminLogin />} />
              {ADMIN_ROUTES.map(({ path, Component }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <AdminProtectedRoute>
                      <Component />
                    </AdminProtectedRoute>
                  }
                />
              ))}
              <Route path="/communications" element={<Communications />} />
              <Route path="/creation-studio" element={<CreationStudio />} />
              <Route path="/operations/geo-matching" element={<GeoMatching />} />
              <Route
                path="/dashboards/provider/crew-control"
                element={
                  <ProviderProtectedRoute>
                    <ProviderDeploymentManagement />
                  </ProviderProtectedRoute>
                }
              />
              <Route path="/dashboards" element={<DashboardHub />} />
              <Route
                path="/dashboards/provider/onboarding"
                element={
                  <ProviderProtectedRoute>
                    <ProviderOnboardingManagement />
                  </ProviderProtectedRoute>
                }
              />
              <Route path="/dashboards/finance" element={<FinanceOverview />} />
              <Route path="/dashboards/enterprise/panel" element={<EnterprisePanel />} />
              <Route path="/dashboards/orders/:orderId" element={<OrderWorkspace />} />
              <Route
                path="/dashboards/serviceman/byok"
                element={
                  <ServicemanProtectedRoute>
                    <ServicemanByokWorkspace />
                  </ServicemanProtectedRoute>
                }
              />
              <Route
                path="/dashboards/serviceman/tax"
                element={
                  <ServicemanProtectedRoute>
                    <ServicemanTaxWorkspace />
                  </ServicemanProtectedRoute>
                }
              />
              <Route
                path="/dashboards/provider/storefront"
                element={
                  <ProviderProtectedRoute>
                    <ProviderStorefrontControl />
                  </ProviderProtectedRoute>
                }
              />
              <Route
                path="/dashboards/provider/services"
                element={
                  <ProviderProtectedRoute>
                    <ProviderServices />
                  </ProviderProtectedRoute>
                }
              />
              <Route
                path="/dashboards/provider/profile"
                element={<Navigate to="/dashboards/provider?section=profile-settings" replace />}
              />
              <Route path="/dashboards/:roleId" element={<RoleDashboard />} />
              <Route path="/legal/terms" element={<Terms />} />
              <Route path="/legal/:slug" element={<Terms />} />
              {import.meta.env.DEV && CustomerSettingsDevPreview ? (
                <Route path="/dev/customer-settings" element={<CustomerSettingsDevPreview />} />
              ) : null}
              {import.meta.env.DEV && ServicemanTaxDevPreview ? (
                <Route path="/dev/serviceman-tax" element={<ServicemanTaxDevPreview />} />
              ) : null}
              {import.meta.env.DEV && ProviderAdsDevPreview ? (
                <Route path="/dev/provider-ads" element={<ProviderAdsDevPreview />} />
              ) : null}
              {import.meta.env.DEV && BusinessFrontDevPreview ? (
                <Route path="/dev/storefront-business-front" element={<BusinessFrontDevPreview />} />
              ) : null}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RouteErrorBoundary>
        </Suspense>
      </main>
      {!isDashboardExperience && <GlobalMobileDock links={mobileDockLinks} />}
      {!isDashboardExperience && !isAuthenticated && <Footer />}
      <FloatingChatLauncher isAuthenticated={isAuthenticated} />
      <ConsentBanner />
    </div>
  );
}

export default App;
