import { ArrowPathIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/blueprints/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import InventoryItemsSection from './components/InventoryItemsSection.jsx';
import SupplierManagementSection from './components/SupplierManagementSection.jsx';
import CategoryManagementSection from './components/CategoryManagementSection.jsx';
import TagManagementSection from './components/TagManagementSection.jsx';
import ZoneManagementSection from './components/ZoneManagementSection.jsx';
import MediaManagementSection from './components/MediaManagementSection.jsx';
import { useProviderInventory } from './ProviderInventoryProvider.jsx';

export default function ProviderInventoryWorkspace() {
  const {
    actions: { loadItems, loadSupplierDirectory, loadCategories, loadTags, loadZones }
  } = useProviderInventory();

  const handleRefreshAll = () => {
    loadItems();
    loadSupplierDirectory();
    loadCategories();
    loadTags();
    loadZones();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-qa-page="provider-inventory-management">
      <PageHeader
        eyebrow="Provider operations"
        title="Inventory management"
        description="Manage provider tooling, consumable stock, supplier pricing, and merchandising assets from a single control centre."
        breadcrumbs={[
          { label: 'Provider dashboard', to: '/provider/dashboard' },
          { label: 'Inventory management' }
        ]}
        actions={[
          {
            label: 'Refresh data',
            variant: 'secondary',
            icon: ArrowPathIcon,
            onClick: handleRefreshAll
          },
          {
            label: 'Return to dashboard',
            variant: 'ghost',
            to: '/dashboards/provider/panel'
          }
        ]}
        meta={{
          lastUpdatedLabel:
            'Keep your catalogue clean before each scheduling cycle. Changes sync instantly to procurement and storefront APIs.'
        }}
      />

      <div className="mx-auto max-w-7xl space-y-12 px-6 pt-16">
        <InventoryItemsSection />
        <SupplierManagementSection />
        <MediaManagementSection />
        <CategoryManagementSection />
        <TagManagementSection />
        <ZoneManagementSection />
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600">
          <p className="font-semibold text-primary">Need a dedicated marketplace preview?</p>
          <p className="mt-2">
            Use the provider storefront preview to validate imagery, tags, and pricing before publishing. Inventory state is
            role-gated so merchandising teams can iterate safely.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button to="/provider/storefront" variant="secondary" size="sm">
              Open provider storefront preview
            </Button>
            <Button to="/admin/purchases" variant="ghost" size="sm">
              Manage procurement directory
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
