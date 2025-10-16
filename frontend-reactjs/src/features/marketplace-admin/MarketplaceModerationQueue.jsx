import PropTypes from 'prop-types';
import Button from '../../components/ui/Button.jsx';

export default function MarketplaceModerationQueue({ items, onFocusCompany }) {
  return (
    <section aria-label="Moderation queue" className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-primary">Listing moderation queue</h3>
          <p className="text-sm text-slate-600">
            Governance signals for marketplace listings awaiting approval or follow-up.
          </p>
        </div>
      </header>
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 text-emerald-700">
            All marketplace listings are approved. No pending reviews.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-[0.3em] text-primary/50">Pending review</p>
                  <h4 className="text-lg font-semibold text-primary">{item.title}</h4>
                  <p className="text-sm text-slate-600">
                    Status: {item.status.replace(/_/g, ' ')} · Availability: {item.availability}
                  </p>
                  <p className="text-xs text-slate-500">Company: {item.companyId || 'Platform'}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    as="a"
                    href={`/admin/dashboard?focus=marketplace-workspace&listing=${item.id}`}
                    target="_blank"
                    rel="noreferrer"
                    variant="secondary"
                    size="sm"
                  >
                    Open in dashboard
                  </Button>
                  <Button type="button" variant="tertiary" size="sm" onClick={() => onFocusCompany(item.companyId)}>
                    Focus company
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

MarketplaceModerationQueue.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      availability: PropTypes.string.isRequired,
      companyId: PropTypes.string
    })
  ).isRequired,
  onFocusCompany: PropTypes.func.isRequired
};
