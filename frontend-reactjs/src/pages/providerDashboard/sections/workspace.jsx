import ServicemanPaymentsSection from '../../../features/providerPayments/ServicemanPaymentsSection.jsx';
import WalletSection from '../../../components/dashboard/wallet/WalletSection.jsx';
import { WebsitePreferencesSection } from '../../../features/providerWebsitePreferences/index.js';
import EnterpriseUpgradeSection from '../../../features/providerControlCentre/enterpriseUpgrade/EnterpriseUpgradeSection.jsx';
import ServicemanManagementSection from '../../../features/providerServicemen/ServicemanManagementSection.jsx';

export function createWorkspaceTabs({
  t,
  servicemanFinance,
  walletSection,
  provider,
  servicemenCompanyId,
  loadDashboard,
  websitePreferences,
  handleWebsitePreferencesUpdated,
  enterpriseUpgrade
}) {
  const tabs = [];

  const financeSections = [];

  if (servicemanFinance) {
    financeSections.push(
      <section key="serviceman-payments" className="provider-dashboard__section provider-dashboard__section--muted">
        <ServicemanPaymentsSection
          initialWorkspace={servicemanFinance}
          companyId={servicemanFinance.companyId || provider?.companyId || provider?.id || null}
          onRefresh={() => loadDashboard({ forceRefresh: true })}
        />
      </section>
    );
  }

  if (walletSection) {
    financeSections.push(
      <section key="wallet" className="provider-dashboard__section provider-dashboard__section--muted">
        <WalletSection section={walletSection} />
      </section>
    );
  }

  if (financeSections.length) {
    tabs.push({
      id: 'provider-dashboard-workspace-finance',
      label: t('providerDashboard.tabs.workspaceFinance'),
      content: financeSections
    });
  }

  const peopleSections = [];

  if (servicemenCompanyId) {
    peopleSections.push(
      <section key="servicemen" className="provider-dashboard__section provider-dashboard__section--muted">
        <ServicemanManagementSection
          companyId={servicemenCompanyId}
          onRefresh={() => loadDashboard({ forceRefresh: true })}
        />
      </section>
    );
  }

  if (peopleSections.length) {
    tabs.push({
      id: 'provider-dashboard-workspace-people',
      label: t('providerDashboard.tabs.workspacePeople'),
      content: peopleSections
    });
  }

  const brandSections = [];

  brandSections.push(
    <section key="website-preferences" className="provider-dashboard__section provider-dashboard__section--muted">
      <WebsitePreferencesSection
        provider={provider}
        initialPreferences={websitePreferences}
        onUpdated={handleWebsitePreferencesUpdated}
      />
    </section>
  );

  brandSections.push(
    <section key="enterprise-upgrade" className="provider-dashboard__section provider-dashboard__section--muted">
      <EnterpriseUpgradeSection
        upgrade={enterpriseUpgrade}
        onRefresh={() => loadDashboard({ forceRefresh: true })}
      />
    </section>
  );

  tabs.push({
    id: 'provider-dashboard-workspace-brand',
    label: t('providerDashboard.tabs.workspaceBrand'),
    content: brandSections
  });

  return tabs;
}
