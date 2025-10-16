import PropTypes from 'prop-types';
import Button from '../../components/ui/Button.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';

const resolveTone = (health) => {
  if (!health?.status) return 'info';
  if (health.status === 'stockout') return 'danger';
  if (health.status === 'warning') return 'warning';
  return 'success';
};

export default function MarketplaceInventoryTable({
  title,
  items,
  onEdit,
  onDelete
}) {
  return (
    <section aria-label={`${title}-inventory`} className="space-y-4">
      <h3 className="text-xl font-semibold text-primary">{title}</h3>
      <div className="overflow-hidden rounded-3xl border border-accent/10 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-accent/10 text-sm text-primary">
          <thead className="bg-secondary/80">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Stock</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Company</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-accent/10 bg-white/80">
            {items.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={5}>
                  No records for this scope yet.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-secondary/60">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-primary">{item.name}</div>
                    <div className="text-xs text-slate-500">SKU: {item.sku}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-semibold">{item.quantityOnHand} on hand</div>
                    <div className="text-xs text-slate-500">Reserved: {item.quantityReserved}</div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill tone={resolveTone(item.health)}>{item.health?.status ?? 'unknown'}</StatusPill>
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-500">{item.companyId || '—'}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => onEdit(item)}>
                        Edit
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => onDelete(item.id)}>
                        Delete
                      </Button>
                      {item.datasheetUrl ? (
                        <Button as="a" href={item.datasheetUrl} target="_blank" rel="noreferrer" size="sm" variant="tertiary">
                          Datasheet
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

MarketplaceInventoryTable.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      sku: PropTypes.string.isRequired,
      quantityOnHand: PropTypes.number.isRequired,
      quantityReserved: PropTypes.number.isRequired,
      companyId: PropTypes.string,
      datasheetUrl: PropTypes.string,
      health: PropTypes.shape({
        status: PropTypes.string
      })
    })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};
