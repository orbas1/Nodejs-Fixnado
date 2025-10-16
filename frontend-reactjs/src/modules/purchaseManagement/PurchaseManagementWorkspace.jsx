import { ArrowPathIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/blueprints/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import OrdersSection from './components/OrdersSection.jsx';
import SuppliersSection from './components/SuppliersSection.jsx';
import BudgetsSection from './components/BudgetsSection.jsx';
import { usePurchaseManagement } from './PurchaseManagementProvider.jsx';

export default function PurchaseManagementWorkspace() {
  const {
    data: { ordersMeta },
    actions: { loadOrders, loadSuppliers, loadBudgets }
  } = usePurchaseManagement();

  const handleRefresh = () => {
    loadOrders();
    loadSuppliers();
    loadBudgets();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-qa-page="admin-purchase-management">
      <PageHeader
        eyebrow="Operations"
        title="Purchase management"
        description="Create purchase orders, maintain supplier records, and align budgets for critical inventory."
        breadcrumbs={[
          { label: 'Operations', to: '/' },
          { label: 'Admin dashboard', to: '/admin/dashboard' },
          { label: 'Purchase management' }
        ]}
        actions={[
          {
            label: 'Refresh data',
            variant: 'secondary',
            icon: ArrowPathIcon,
            onClick: handleRefresh
          }
        ]}
        meta={{
          lastUpdatedLabel: ordersMeta?.total ? `${ordersMeta.total} orders tracked` : 'No purchase orders recorded yet'
        }}
      />

      <div className="mx-auto max-w-7xl space-y-12 px-6 pt-16">
        <OrdersSection />
        <SuppliersSection />
        <BudgetsSection />
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-500">
          <p className="font-semibold text-slate-700">Need to open a dedicated workspace?</p>
          <p className="mt-2">
            Launches from this control centre respect role-based access. Use the navigation menu to jump between procurement,
            monetisation, and geo-zonal tooling without losing context.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button to="/admin/dashboard" variant="ghost" size="sm">
              Return to admin overview
            </Button>
            <Button to="/dashboards/finance" variant="secondary" size="sm">
              View finance dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
