import MarketplaceWorkspace from '../features/marketplace-admin/MarketplaceWorkspace.jsx';

export default function AdminMarketplace() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-secondary/60 to-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <MarketplaceWorkspace />
      </div>
    </div>
  );
}
