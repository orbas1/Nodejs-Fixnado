import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  BoltIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  CloudArrowUpIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import DashboardShell from '../../components/dashboard/DashboardShell.jsx';
import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import StorefrontSettingsForm from './components/StorefrontSettingsForm.jsx';
import InventorySection from './components/InventorySection.jsx';
import CouponsSection from './components/CouponsSection.jsx';
import { useStorefrontManagement } from './StorefrontManagementProvider.jsx';

const navigation = [
  { id: 'storefront-overview', label: 'Workspace overview' },
  { id: 'storefront-settings', label: 'Brand & contact details' },
  { id: 'storefront-inventory', label: 'Inventory catalogue' },
  { id: 'storefront-coupons', label: 'Coupons & incentives' },
  { id: 'storefront-distribution', label: 'Publishing & distribution' }
];

function SummaryCard({ icon: Icon, label, value, caption, tone }) {
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <header className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-primary">{displayValue}</p>
        </div>
      </header>
      {caption ? <p className="mt-4 text-xs text-slate-500">{caption}</p> : null}
      {tone ? (
        <div className="mt-4">
          <StatusPill tone={tone}>{tone}</StatusPill>
        </div>
      ) : null}
    </article>
  );
}

SummaryCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  caption: PropTypes.node,
  tone: PropTypes.oneOf(['neutral', 'success', 'warning', 'danger', 'info'])
};

SummaryCard.defaultProps = {
  caption: null,
  tone: null
};

function renderStatusBadge(storefront) {
  const badges = [];
  const statusTone = storefront.status === 'live' ? 'success' : storefront.status === 'archived' ? 'danger' : 'info';
  badges.push({ label: `Status: ${storefront.status}`, tone: statusTone });
  badges.push({ label: storefront.isPublished ? 'Published' : 'Not published', tone: storefront.isPublished ? 'success' : 'warning' });
  if (storefront.reviewRequired) {
    badges.push({ label: 'Review required before publishing', tone: 'warning' });
  }
  return badges;
}

export default function StorefrontManagementWorkspace() {
  const { data, meta, status, error, actions } = useStorefrontManagement();

  const storefront = data.storefront;
  const inventory = data.inventory;
  const coupons = data.coupons;
  const inventoryMeta = data.inventoryMeta;
  const couponMeta = data.couponMeta;

  const heroBadges = useMemo(() => renderStatusBadge(storefront), [storefront]);

  const fallbackPublishedCount = useMemo(
    () => inventory.filter((item) => item.visibility === 'public').length,
    [inventory]
  );
  const fallbackLowStockCount = useMemo(
    () =>
      inventory.filter(
        (item) =>
          item.stockOnHand != null &&
          item.reorderPoint != null &&
          Number(item.stockOnHand) <= Number(item.reorderPoint)
      ).length,
    [inventory]
  );

  const sidebarMeta = useMemo(() => {
    const entries = [];
    if (meta?.companyId) {
      entries.push({ label: 'Company ID', value: meta.companyId });
    }
    if (storefront.slug) {
      entries.push({ label: 'Public slug', value: storefront.slug });
    }
    if (storefront.updatedAt) {
      entries.push({ label: 'Last updated', value: new Date(storefront.updatedAt).toLocaleString() });
    }
    if (meta?.generatedAt) {
      entries.push({ label: 'Snapshot generated', value: new Date(meta.generatedAt).toLocaleString() });
    }
    return entries;
  }, [meta?.companyId, meta?.generatedAt, storefront.slug, storefront.updatedAt]);

  const overviewCards = useMemo(
    () => [
      {
        id: 'inventory-total',
        icon: Squares2X2Icon,
        label: 'Inventory listings',
        value: inventoryMeta?.total ?? inventory.length,
        caption: `${inventoryMeta?.published ?? fallbackPublishedCount} live • ${
          inventoryMeta?.lowStock ?? fallbackLowStockCount
        } low stock`
      },
      {
        id: 'coupon-total',
        icon: MegaphoneIcon,
        label: 'Active campaigns',
        value: couponMeta?.active ?? coupons.filter((coupon) => coupon.status === 'active').length,
        caption: `${couponMeta?.total ?? coupons.length} total • ${couponMeta?.expiringSoon ?? 0} starting soon`
      },
      {
        id: 'conversion-focus',
        icon: ChartBarIcon,
        label: 'Performance focus',
        value: 'Attract & convert',
        caption: 'Optimise hero listings, incentives, and publishing cadence to grow storefront conversions.'
      }
    ],
    [couponMeta, coupons, inventory, inventoryMeta, fallbackLowStockCount, fallbackPublishedCount]
  );

  const handleRefresh = async () => {
    await actions.refresh({ forceRefresh: true });
  };

  const isInitialLoading = status.loading && !storefront.id;

  return (
    <DashboardShell
      eyebrow="Provider control centre"
      title="Storefront command centre"
      subtitle="Manage branding, catalogue, and incentives before syndicating your storefront across Fixnado networks."
      heroBadges={heroBadges}
      heroAside={
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="secondary"
            icon={ArrowPathIcon}
            iconPosition="start"
            onClick={handleRefresh}
            loading={status.loading}
          >
            Refresh workspace
          </Button>
          <Button
            type="button"
            href={storefront.slug ? `/providers/${storefront.slug}` : undefined}
            icon={BuildingStorefrontIcon}
            iconPosition="start"
            target="_blank"
            rel="noreferrer"
            disabled={!storefront.slug}
          >
            View public storefront
          </Button>
        </div>
      }
      navigation={navigation}
      sidebar={{ meta: sidebarMeta }}
    >
      <section id="storefront-overview" className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-primary">Operational overview</h2>
            <p className="text-sm text-slate-600">
              Track storefront readiness at a glance before pushing updates to customers and marketplace partners.
            </p>
          </div>
          {error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50/90 px-4 py-2 text-sm text-rose-600">
              {error.message || 'Unable to load storefront workspace.'}
            </div>
          ) : null}
        </header>
        {isInitialLoading ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-48 rounded-3xl" />
            <Skeleton className="h-48 rounded-3xl" />
            <Skeleton className="h-48 rounded-3xl" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {overviewCards.map((card) => (
              <SummaryCard key={card.id} icon={card.icon} label={card.label} value={card.value} caption={card.caption} />
            ))}
          </div>
        )}
      </section>

      <section id="storefront-settings" className="space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-primary">Branding & compliance</h2>
          <p className="text-sm text-slate-600">
            Keep your storefront identity, hero creative, and compliance guardrails current for every marketplace surface.
          </p>
        </header>
        {isInitialLoading ? (
          <Skeleton className="h-[520px] rounded-3xl" />
        ) : (
          <StorefrontSettingsForm
            storefront={storefront}
            saving={status.savingSettings}
            onSubmit={actions.saveSettings}
            onRefresh={handleRefresh}
          />
        )}
      </section>

      <InventorySection
        inventory={inventory}
        meta={inventoryMeta}
        onCreate={actions.createInventory}
        onUpdate={actions.updateInventory}
        onArchive={actions.archiveInventory}
        mutation={status.inventoryMutation}
      />

      <CouponsSection
        coupons={coupons}
        meta={couponMeta}
        onCreate={actions.createCoupon}
        onUpdate={actions.updateCoupon}
        onStatusChange={actions.updateCouponStatus}
        mutation={status.couponMutation}
      />

      <section id="storefront-distribution" className="space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-primary">Publishing & distribution</h2>
          <p className="text-sm text-slate-600">
            Control where your storefront appears, coordinate launch windows, and push curated experiences to each channel.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CloudArrowUpIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Syndication</p>
                  <h3 className="mt-1 text-base font-semibold text-primary">Push to marketplaces</h3>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Enable distribution to Fixnado marketplace placements and partner directories once your catalogue and creative are ready.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              icon={BoltIcon}
              iconPosition="start"
              href="/dashboards/provider"
            >
              Open provider dashboard
            </Button>
          </article>
          <article className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Compliance review</p>
                  <h3 className="mt-1 text-base font-semibold text-primary">Request publish review</h3>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Submit a compliance check before publishing major updates or enabling incentives that require finance approval.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              icon={CloudArrowUpIcon}
              iconPosition="start"
              href="mailto:compliance@fixnado.com?subject=Storefront%20publish%20request"
            >
              Email compliance desk
            </Button>
          </article>
        </div>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-6">
          <p className="text-sm font-semibold text-primary">Need advanced analytics?</p>
          <p className="mt-2 text-sm text-slate-600">
            Jump into performance reporting to understand acquisition, conversion, and rental uplift driven by your storefront updates.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" icon={ChartBarIcon} iconPosition="start" href="/dashboards/provider">
              Open provider analytics
            </Button>
            <Button type="button" variant="ghost" icon={MegaphoneIcon} iconPosition="start" href="/provider/storefront">
              Launch legacy storefront view
            </Button>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
