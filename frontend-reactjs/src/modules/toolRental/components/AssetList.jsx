import PropTypes from 'prop-types';
import { PlusIcon } from '@heroicons/react/24/outline';
import Button from '../../../components/ui/Button.jsx';

function AssetList({ assets, selectedAssetId, onSelect, onCreate }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Tool hire catalogue</h3>
          <p className="mt-1 text-sm text-slate-600">Select a tool to edit availability, media, and pricing.</p>
        </div>
        <Button size="sm" onClick={onCreate} icon={PlusIcon} variant="secondary">
          New tool
        </Button>
      </div>
      <ul className="divide-y divide-slate-200">
        {assets.length === 0 ? (
          <li className="px-5 py-6 text-sm text-slate-500">No tool hire assets have been added yet.</li>
        ) : (
          assets.map((asset) => {
            const isActive = asset.id === selectedAssetId;
            return (
              <li key={asset.id}>
                <button
                  type="button"
                  onClick={() => onSelect(asset.id)}
                  className={`flex w-full flex-col gap-1 px-5 py-4 text-left transition ${
                    isActive ? 'bg-accent/10 text-primary' : 'hover:bg-slate-50'
                  }`}
                >
                  <p className="text-sm font-semibold">{asset.name}</p>
                  <p className="text-xs text-slate-500">
                    {asset.slug}
                    {asset.availabilityStatus ? ` · ${asset.availabilityStatus.replace(/_/g, ' ')}` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Qty {asset.quantityAvailable ?? 0}</span>
                    {asset.rentalRate != null ? (
                      <span>
                        Rate {asset.rentalRateCurrency || 'GBP'} {asset.rentalRate}
                      </span>
                    ) : null}
                    <span>{asset.couponSummary?.active ?? 0} active coupons</span>
                  </div>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

AssetList.propTypes = {
  assets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string,
      availabilityStatus: PropTypes.string,
      quantityAvailable: PropTypes.number,
      rentalRate: PropTypes.number,
      rentalRateCurrency: PropTypes.string,
      couponSummary: PropTypes.shape({
        total: PropTypes.number,
        active: PropTypes.number
      })
    })
  ).isRequired,
  selectedAssetId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired
};

AssetList.defaultProps = {
  selectedAssetId: null
};

export default AssetList;
