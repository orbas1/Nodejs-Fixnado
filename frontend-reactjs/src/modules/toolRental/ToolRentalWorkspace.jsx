import { useMemo, useState } from 'react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import AssetList from './components/AssetList.jsx';
import AssetForm from './components/AssetForm.jsx';
import PricingManager from './components/PricingManager.jsx';
import AvailabilityTimeline from './components/AvailabilityTimeline.jsx';
import CouponManager from './components/CouponManager.jsx';
import RentalManager from './components/RentalManager.jsx';
import { useToolRental } from './ToolRentalProvider.jsx';

export default function ToolRentalWorkspace() {
  const {
    state: { assets, selectedAssetId, rentals, coupons, availability, loading, errors },
    actions
  } = useToolRental();
  const [isCreatingAsset, setIsCreatingAsset] = useState(false);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAssetId) || null,
    [assets, selectedAssetId]
  );

  const handleAssetSubmit = async (payload) => {
    if (isCreatingAsset) {
      await actions.createAsset(payload);
      setIsCreatingAsset(false);
    } else if (selectedAsset) {
      await actions.updateAsset(selectedAsset.id, payload);
    }
  };

  const handleCreateAsset = () => {
    setIsCreatingAsset(true);
    actions.selectAsset(null);
  };

  const assetFormMode = isCreatingAsset ? 'create' : 'edit';

  return (
    <section className="space-y-8" id="provider-dashboard-tool-rentals">
      <header className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white/95 to-slate-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-accent/10 text-accent">
            <WrenchScrewdriverIcon className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Provider control centre</p>
            <h2 className="mt-2 text-2xl font-semibold text-primary">Tool hire & rental management</h2>
            <p className="mt-2 max-w-4xl text-sm text-slate-600">
              Manage catalogue content, hire programmes, deposit governance, and campaign coupons from a single workspace. All
              updates sync instantly across the Fixnado marketplace and provider storefront experiences.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <AssetList
          assets={assets}
          selectedAssetId={isCreatingAsset ? null : selectedAssetId}
          onSelect={(id) => {
            setIsCreatingAsset(false);
            actions.selectAsset(id);
          }}
          onCreate={handleCreateAsset}
        />
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <AssetForm
            asset={selectedAsset}
            mode={assetFormMode}
            onSubmit={handleAssetSubmit}
            loading={loading.action === 'createAsset' || loading.action === 'updateAsset'}
            error={errors.action}
          />
        </div>
      </div>

      <PricingManager
        asset={selectedAsset}
        onCreate={(payload) => selectedAsset && actions.createPricingTier(selectedAsset.id, payload)}
        onUpdate={(pricingId, payload) => selectedAsset && actions.updatePricingTier(selectedAsset.id, pricingId, payload)}
        onDelete={(pricingId) => selectedAsset && actions.deletePricingTier(selectedAsset.id, pricingId)}
        loading={loading.action === 'createPricing' || loading.action === 'updatePricing'}
      />

      <AvailabilityTimeline
        availability={availability}
        loading={loading.availability}
        error={errors.availability}
        onRefresh={() => selectedAsset && actions.loadAvailability(selectedAsset.id)}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <CouponManager
          assets={assets}
          coupons={coupons}
          onCreate={actions.createCoupon}
          onUpdate={actions.updateCoupon}
          onDelete={actions.deleteCoupon}
          loading={loading.action === 'createCoupon' || loading.action === 'updateCoupon'}
        />
        <RentalManager
          rentals={rentals}
          loading={loading.rentals || loading.action === 'createRental' || loading.action === 'deposit'}
          onRefresh={actions.loadRentals}
          onCreate={actions.createRental}
          onAction={actions.runRentalAction}
        />
      </div>
    </section>
  );
}
