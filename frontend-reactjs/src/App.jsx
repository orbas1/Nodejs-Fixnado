import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SkipToContent from './components/accessibility/SkipToContent.jsx';
import FloatingChatLauncher from './components/communications/FloatingChatLauncher.jsx';
import ConsentBanner from './components/legal/ConsentBanner.jsx';
import { useSession } from './hooks/useSession.js';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute.jsx';
import ProviderProtectedRoute from './components/auth/ProviderProtectedRoute.jsx';
import ServicemanProtectedRoute from './components/auth/ServicemanProtectedRoute.jsx';
import UserProtectedRoute from './components/auth/UserProtectedRoute.jsx';
import InstructorProtectedRoute from './components/auth/InstructorProtectedRoute.jsx';
import PublicLayout from './routes/layouts/PublicLayout.jsx';
import PersonaShell from './routes/layouts/PersonaShell.jsx';
import RouteTelemetryProvider from './routes/RouteTelemetryProvider.jsx';

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
const CommunityHub = lazy(() => import('./pages/CommunityHub.jsx'));
const CommunityPost = lazy(() => import('./pages/CommunityPost.jsx'));
const CommunityEvents = lazy(() => import('./pages/CommunityEvents.jsx'));
const CommunityMessages = lazy(() => import('./pages/CommunityMessages.jsx'));
const CommunityModeration = lazy(() => import('./pages/CommunityModeration.jsx'));
const LearnerDashboard = lazy(() => import('./pages/learner/LearnerDashboard.jsx'));
const LearnerCalendar = lazy(() => import('./pages/learner/LearnerCalendar.jsx'));
const LearnerAchievements = lazy(() => import('./pages/learner/LearnerAchievements.jsx'));
const LearnerRecommendations = lazy(() => import('./pages/learner/LearnerRecommendations.jsx'));
const LearnerProfile = lazy(() => import('./pages/learner/LearnerProfile.jsx'));
const LearnerSettings = lazy(() => import('./pages/learner/LearnerSettings.jsx'));
const InstructorDashboard = lazy(() => import('./pages/instructor/InstructorDashboard.jsx'));
const InstructorCourses = lazy(() => import('./pages/instructor/InstructorCourses.jsx'));
const InstructorCatalog = lazy(() => import('./pages/instructor/InstructorCatalog.jsx'));
const InstructorOrders = lazy(() => import('./pages/instructor/InstructorOrders.jsx'));
const InstructorPayouts = lazy(() => import('./pages/instructor/InstructorPayouts.jsx'));
const InstructorStorefront = lazy(() => import('./pages/instructor/InstructorStorefront.jsx'));
const InstructorCheckout = lazy(() => import('./pages/instructor/InstructorCheckout.jsx'));
const InstructorSupport = lazy(() => import('./pages/instructor/InstructorSupport.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const SecuritySettings = lazy(() => import('./pages/SecuritySettings.jsx'));
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

const ADMIN_ROUTE_CONFIG = [
  { path: 'dashboard', Component: AdminDashboard },
  { path: 'profile', Component: AdminProfile },
  { path: 'disputes/health/:bucketId/history', Component: AdminDisputeHealthHistory },
  { path: 'home-builder', Component: AdminHomeBuilder },
  { path: 'blog', Component: AdminBlog },
  { path: 'rentals', Component: AdminRentals },
  { path: 'monetisation', Component: AdminMonetization },
  { path: 'escrows', Component: AdminEscrow },
  { path: 'bookings', Component: AdminBookings },
  { path: 'wallets', Component: AdminWallets },
  { path: 'custom-jobs', Component: AdminCustomJobs },
  { path: 'roles', Component: AdminRoles },
  { path: 'preferences', Component: AdminPreferences },
  { path: 'enterprise', Component: AdminEnterprise },
  { path: 'marketplace', Component: AdminMarketplace },
  { path: 'appearance', Component: AppearanceManagement },
  { path: 'inbox', Component: AdminInbox },
  { path: 'purchases', Component: AdminPurchaseManagement },
  { path: 'website-management', Component: AdminWebsiteManagement },
  { path: 'live-feed/auditing', Component: AdminLiveFeedAuditing },
  { path: 'system-settings', Component: AdminSystemSettings },
  { path: 'taxonomy', Component: AdminTaxonomy },
  { path: 'seo', Component: AdminSeo },
  { path: 'theme-studio', Component: ThemeStudio },
  { path: 'telemetry', Component: TelemetryDashboard },
  { path: 'zones', Component: AdminZones },
  { path: 'legal/:slug?', Component: AdminLegal }
];

const PROVIDER_APP_ROUTES = [
  { index: true, element: <Navigate to="dashboard" replace /> },
  { path: 'dashboard', Component: ProviderDashboard },
  { path: 'custom-jobs', Component: ProviderCustomJobs },
  { path: 'storefront', Component: ProviderStorefront },
  { path: 'inventory', Component: ProviderInventory },
  { path: 'services', Component: ProviderServices }
];

const PROVIDER_CONTROL_ROUTES = [
  { index: true, element: <Navigate to="/dashboards/provider?section=profile-settings" replace /> },
  { path: 'crew-control', Component: ProviderDeploymentManagement },
  { path: 'onboarding', Component: ProviderOnboardingManagement },
  { path: 'storefront', Component: ProviderStorefrontControl },
  { path: 'services', Component: ProviderServices },
  {
    path: 'profile',
    element: <Navigate to="/dashboards/provider?section=profile-settings" replace />
  }
];

const SERVICEMAN_ROUTES = [
  { index: true, element: <Navigate to="byok" replace /> },
  { path: 'byok', Component: ServicemanByokWorkspace },
  { path: 'tax', Component: ServicemanTaxWorkspace }
];

const LEARNER_ROUTES = [
  { index: true, Component: LearnerDashboard },
  { path: 'calendar', Component: LearnerCalendar },
  { path: 'achievements', Component: LearnerAchievements },
  { path: 'recommendations', Component: LearnerRecommendations },
  { path: 'profile', Component: LearnerProfile },
  { path: 'settings', Component: LearnerSettings }
];

const INSTRUCTOR_ROUTES = [
  { index: true, Component: InstructorDashboard },
  { path: 'courses', Component: InstructorCourses },
  { path: 'catalogue', Component: InstructorCatalog },
  { path: 'orders', Component: InstructorOrders },
  { path: 'payouts', Component: InstructorPayouts },
  { path: 'storefront', Component: InstructorStorefront },
  { path: 'checkout', Component: InstructorCheckout },
  { path: 'support', Component: InstructorSupport }
];

function renderRoutes(config) {
  return config.map((route) => {
    if (route.index) {
      return <Route key={`index-${route.path ?? 'default'}`} index element={route.element} />;
    }

    const { path, Component, element } = route;
    if (element) {
      return <Route key={path} path={path} element={element} />;
    }

    const Element = Component;
    return <Route key={path} path={path} element={<Element />} />;
  });
}

function App() {
  const { isAuthenticated } = useSession();

  return (
    <>
      <SkipToContent />
      <RouteTelemetryProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/company" element={<CompanyRegister />} />
            <Route path="/feed" element={<Feed />} />
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
            <Route path="/community" element={<CommunityHub />} />
            <Route path="/community/posts/:postId" element={<CommunityPost />} />
            <Route path="/community/events" element={<CommunityEvents />} />
            <Route path="/community/messages" element={<CommunityMessages />} />
            <Route path="/community/moderation" element={<CommunityModeration />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/communications" element={<Communications />} />
            <Route path="/creation-studio" element={<CreationStudio />} />
            <Route path="/operations/geo-matching" element={<GeoMatching />} />
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
          </Route>

          <Route
            path="/provider/*"
            element={
              <PersonaShell
                persona="provider"
                guard={ProviderProtectedRoute}
                loaderQa="route-loader.provider"
                loaderTitle="Preparing provider workspace"
                loaderDescription="Syncing storefront controls, crew governance, and compliance tasks."
                metadata={{ scope: 'provider-app' }}
              />
            }
          >
            {renderRoutes(PROVIDER_APP_ROUTES)}
          </Route>

          <Route
            path="/dashboards/provider/*"
            element={
              <PersonaShell
                persona="provider"
                guard={ProviderProtectedRoute}
                loaderQa="route-loader.provider-control"
                loaderTitle="Loading provider control centre"
                loaderDescription="Verifying feature flags, onboarding states, and storefront telemetry."
                metadata={{ scope: 'provider-dashboard' }}
              />
            }
          >
            {renderRoutes(PROVIDER_CONTROL_ROUTES)}
          </Route>

          <Route
            path="/dashboards/serviceman/*"
            element={
              <PersonaShell
                persona="serviceman"
                guard={ServicemanProtectedRoute}
                loaderQa="route-loader.serviceman"
                loaderTitle="Loading serviceman workspace"
                loaderDescription="Checking BYOK compliance, tax tooling, and asset readiness."
                metadata={{ scope: 'serviceman-dashboard' }}
              />
            }
          >
            {renderRoutes(SERVICEMAN_ROUTES)}
          </Route>

          <Route
            path="/dashboards/instructor/*"
            element={
              <PersonaShell
                persona="instructor"
                guard={InstructorProtectedRoute}
                loaderQa="route-loader.instructor"
                loaderTitle="Loading instructor commerce studio"
                loaderDescription="Syncing catalogue controls, checkout policies, and payout telemetry."
                metadata={{ scope: 'instructor-dashboard' }}
              />
            }
          >
            {renderRoutes(INSTRUCTOR_ROUTES)}
          </Route>

          <Route
            path="/dashboards/learner/*"
            element={
              <PersonaShell
                persona="learner"
                guard={UserProtectedRoute}
                loaderQa="route-loader.learner"
                loaderTitle="Preparing learner performance workspace"
                loaderDescription="Restoring progress analytics, cohort insights, and personalised guidance."
                metadata={{ scope: 'learner-dashboard' }}
              />
            }
          >
            {renderRoutes(LEARNER_ROUTES)}
          </Route>

          <Route
            path="/admin/*"
            element={
              <PersonaShell
                persona="admin"
                guard={AdminProtectedRoute}
                loaderQa="route-loader.admin"
                loaderTitle="Preparing admin control centre"
                loaderDescription="Applying RBAC policies, restoring audit trails, and securing telemetry."
                metadata={{ scope: 'admin-dashboard' }}
              />
            }
          >
            {renderRoutes(ADMIN_ROUTE_CONFIG)}
          </Route>

          <Route
            path="/dashboards/*"
            element={
              <PersonaShell
                persona="workspace"
                loaderQa="route-loader.workspace"
                loaderTitle="Loading dashboards"
                loaderDescription="Restoring personalised analytics, finance snapshots, and enterprise controls."
                metadata={{ scope: 'dashboards' }}
              />
            }
          >
            <Route index element={<DashboardHub />} />
            <Route path="finance" element={<FinanceOverview />} />
            <Route path="enterprise/panel" element={<EnterprisePanel />} />
            <Route path="orders/:orderId" element={<OrderWorkspace />} />
            <Route path=":roleId" element={<RoleDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </RouteTelemetryProvider>
      <FloatingChatLauncher isAuthenticated={isAuthenticated} />
      <ConsentBanner />
    </>
  );
}

export default App;
