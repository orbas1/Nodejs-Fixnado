import PropTypes from 'prop-types';
import Button from '../ui/Button.jsx';
import { useServiceManagement } from './useServiceManagement.js';
import ServiceManagementNotices from './ServiceManagementNotices.jsx';
import ServiceHealthSummary from './ServiceHealthSummary.jsx';
import ServiceDeliveryBoard from './ServiceDeliveryBoard.jsx';
import ServiceCategoryPanel from './categories/ServiceCategoryPanel.jsx';
import ServiceListingPanel from './listings/ServiceListingPanel.jsx';
import ServicePackagePanel from './packages/ServicePackagePanel.jsx';

function ServiceManagementSection({ section }) {
  const service = useServiceManagement(section);
  const data = section?.data ?? {};

  const handlePackageSelect = (pkg) => {
    if (!pkg) return;
    const target = service.listings.find((listing) => listing.id === pkg.serviceId || listing.id === pkg.id);
    if (target) {
      service.setActiveTab('listings');
      service.handleEditListing(target);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Service catalogue</p>
          <h2 className="text-2xl font-semibold text-primary">{section.label}</h2>
          <p className="text-sm text-slate-500">{section.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={data.onRefresh} disabled={service.loading}>
            Refresh
          </Button>
        </div>
      </div>

      <ServiceManagementNotices
        alerts={service.alerts}
        loading={service.loading}
        error={service.error}
        feedback={service.formFeedback}
      />

      {service.health.length ? <ServiceHealthSummary metrics={service.health} /> : null}
      <ServiceDeliveryBoard columns={service.deliveryBoard} />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={service.activeTab === 'listings' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => service.setActiveTab('listings')}
        >
          Listings
        </Button>
        <Button
          variant={service.activeTab === 'categories' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => service.setActiveTab('categories')}
        >
          Categories
        </Button>
        <Button
          variant={service.activeTab === 'packages' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => service.setActiveTab('packages')}
        >
          Packages
        </Button>
      </div>

      {service.activeTab === 'categories' ? (
        <ServiceCategoryPanel
          categories={service.categories}
          form={service.categoryForm}
          setForm={service.setCategoryForm}
          submitting={service.submitting}
          onSubmit={service.handleCategorySubmit}
          onCancel={service.resetCategoryForm}
          onEdit={service.handleEditCategory}
          onArchive={service.handleArchiveCategory}
          editing={service.editingCategory}
        />
      ) : null}

      {service.activeTab === 'listings' ? (
        <ServiceListingPanel
          categories={service.categories}
          listings={service.filteredListings}
          allListings={service.listings}
          form={service.listingForm}
          setForm={service.setListingForm}
          submitting={service.submitting}
          onSubmit={service.handleListingSubmit}
          onCancel={service.resetListingForm}
          onEdit={service.handleEditListing}
          onArchive={service.handleArchiveListing}
          onStatusChange={service.handleListingStatusChange}
          editing={service.editingListing}
          filterStatus={service.filterStatus}
          setFilterStatus={service.setFilterStatus}
          filterCategory={service.filterCategory}
          setFilterCategory={service.setFilterCategory}
          filterQuery={service.filterQuery}
          setFilterQuery={service.setFilterQuery}
          filterKind={service.filterKind}
          setFilterKind={service.setFilterKind}
          statusOptions={service.statusOptions}
          visibilityOptions={service.visibilityOptions}
          kindOptions={service.kindOptions}
        />
      ) : null}

      {service.activeTab === 'packages' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">Packages are curated bundles sourced from your published listings.</p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={service.beginCreatePackage} disabled={service.submitting}>
                New package
              </Button>
            </div>
          </div>
          <ServicePackagePanel packages={service.packages} onManage={handlePackageSelect} />
        </div>
      ) : null}
    </div>
  );
}

ServiceManagementSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    data: PropTypes.shape({
      onRefresh: PropTypes.func
    })
  }).isRequired
};

export default ServiceManagementSection;
