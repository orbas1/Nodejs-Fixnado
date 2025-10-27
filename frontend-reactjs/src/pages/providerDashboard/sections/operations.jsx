import { CalendarDaysIcon, ClockIcon, LifebuoyIcon, TagIcon } from '@heroicons/react/24/outline';
import ToolRentalProvider from '../../../modules/toolRental/ToolRentalProvider.jsx';
import ToolRentalWorkspace from '../../../modules/toolRental/ToolRentalWorkspace.jsx';
import ProviderCalendarProvider from '../../../modules/providerCalendar/ProviderCalendarProvider.jsx';
import ProviderCalendarWorkspace from '../../../modules/providerCalendar/ProviderCalendarWorkspace.jsx';
import { ProviderBookingManagementWorkspace } from '../../../modules/providerBookingManagement/index.js';
import {
  ServiceHealthCard,
  ServiceDeliveryColumn,
  ServicePackageCard,
  ServiceCategoryCard
} from '../components/index.js';

export function createOperationsTabs({
  t,
  serviceHealth,
  deliveryBoard,
  servicePackages,
  serviceCategories,
  calendarInitialSnapshot,
  hasCalendarAccess,
  companyId,
  renderToolRental,
  renderCalendarSection
}) {
  const tabs = [];

  const deliverySections = [];

  if (serviceHealth.length) {
    deliverySections.push(
      <section key="health" className="provider-dashboard__section provider-dashboard__section--muted">
        <header className="provider-dashboard__section-header">
          <div className="flex items-center gap-3">
            <LifebuoyIcon className="h-6 w-6 text-[var(--provider-accent)]" aria-hidden="true" />
            <h3 className="provider-dashboard__section-heading">{t('providerDashboard.serviceHealthHeadline')}</h3>
          </div>
        </header>
        <div className="provider-dashboard__grid provider-dashboard__grid--wide">
          {serviceHealth.map((metric) => (
            <ServiceHealthCard key={metric.id} metric={metric} />
          ))}
        </div>
      </section>
    );
  }

  if (deliveryBoard.length) {
    deliverySections.push(
      <section key="delivery" className="provider-dashboard__section provider-dashboard__section--muted">
        <header className="provider-dashboard__section-header">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-6 w-6 text-[var(--provider-accent)]" aria-hidden="true" />
            <h3 className="provider-dashboard__section-heading">{t('providerDashboard.serviceDeliveryHeadline')}</h3>
          </div>
        </header>
        <div className="provider-dashboard__grid provider-dashboard__grid--wide">
          {deliveryBoard.map((column) => (
            <ServiceDeliveryColumn key={column.id} column={column} />
          ))}
        </div>
      </section>
    );
  }

  if (servicePackages.length) {
    deliverySections.push(
      <section key="packages" className="provider-dashboard__section provider-dashboard__section--muted">
        <header className="provider-dashboard__section-header">
          <div className="flex items-center gap-3">
            <LifebuoyIcon className="h-6 w-6 text-[var(--provider-accent)]" aria-hidden="true" />
            <h3 className="provider-dashboard__section-heading">{t('providerDashboard.servicePackagesHeadline')}</h3>
          </div>
        </header>
        <div className="provider-dashboard__grid provider-dashboard__grid--wide">
          {servicePackages.map((pkg) => (
            <ServicePackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </section>
    );
  }

  if (serviceCategories.length) {
    deliverySections.push(
      <section key="categories" className="provider-dashboard__section provider-dashboard__section--muted">
        <header className="provider-dashboard__section-header">
          <div className="flex items-center gap-3">
            <TagIcon className="h-6 w-6 text-[var(--provider-accent)]" aria-hidden="true" />
            <h3 className="provider-dashboard__section-heading">{t('providerDashboard.serviceCategoriesHeadline')}</h3>
          </div>
        </header>
        <div className="provider-dashboard__grid provider-dashboard__grid--wide">
          {serviceCategories.map((category) => (
            <ServiceCategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>
    );
  }

  if (deliverySections.length) {
    tabs.push({
      id: 'provider-dashboard-operations-delivery',
      label: t('providerDashboard.tabs.operationsDelivery'),
      content: deliverySections
    });
  }

  const schedulingSections = [];

  if (companyId) {
    schedulingSections.push(
      <section key="booking" className="provider-dashboard__section provider-dashboard__section--muted">
        <header className="provider-dashboard__section-header">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-6 w-6 text-[var(--provider-accent)]" aria-hidden="true" />
            <div>
              <h3 className="provider-dashboard__section-heading">{t('providerDashboard.bookingWorkspaceTitle')}</h3>
              <p className="provider-dashboard__section-description">
                {t('providerDashboard.bookingWorkspaceDescription')}
              </p>
            </div>
          </div>
        </header>
        <ProviderBookingManagementWorkspace companyId={companyId} />
      </section>
    );
  }

  if (renderToolRental && companyId) {
    schedulingSections.push(
      <section key="tool-rental" className="provider-dashboard__section provider-dashboard__section--muted">
        <ToolRentalProvider companyId={companyId}>
          <ToolRentalWorkspace />
        </ToolRentalProvider>
      </section>
    );
  }

  if (renderCalendarSection && hasCalendarAccess) {
    schedulingSections.push(
      <section key="calendar" className="provider-dashboard__section provider-dashboard__section--muted">
        <header className="provider-dashboard__section-header">
          <div className="flex items-center gap-3">
            <CalendarDaysIcon className="h-6 w-6 text-[var(--provider-accent)]" aria-hidden="true" />
            <div>
              <h3 className="provider-dashboard__section-heading">{t('providerDashboard.calendarHeadline')}</h3>
              <p className="provider-dashboard__section-description">
                {t('providerDashboard.calendarDescription')}
              </p>
            </div>
          </div>
        </header>
        <ProviderCalendarProvider initialSnapshot={calendarInitialSnapshot ?? {}}>
          <ProviderCalendarWorkspace />
        </ProviderCalendarProvider>
      </section>
    );
  }

  if (schedulingSections.length) {
    tabs.push({
      id: 'provider-dashboard-operations-scheduling',
      label: t('providerDashboard.tabs.operationsScheduling'),
      content: schedulingSections
    });
  }

  return tabs;
}
