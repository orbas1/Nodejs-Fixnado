import PropTypes from 'prop-types';
import StatusPill from '../../../components/ui/StatusPill.jsx';

function resolveInvoiceTone(status) {
  switch (status) {
    case 'paid':
      return 'success';
    case 'overdue':
      return 'danger';
    case 'issued':
    case 'pending':
      return 'warning';
    default:
      return 'info';
  }
}

export default function InvoicesPanel({ invoices }) {
  if (!invoices.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-primary">Billing</h3>
        <p className="mt-2 text-sm text-slate-600">No invoices issued for Gigvora campaigns yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
        <h3 className="text-lg font-semibold text-primary">Billing</h3>
        <p className="text-sm text-slate-600">Track invoice status and settlement progress across campaigns.</p>
      </div>
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Invoice
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Campaign
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Amount due
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Paid
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Due date
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoices.map((invoice) => {
            const amountLabel = invoice.amountDue != null
              ? `${invoice.currency || 'GBP'} ${Number(invoice.amountDue).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`
              : '—';
            const paidLabel = invoice.amountPaid != null
              ? `${invoice.currency || 'GBP'} ${Number(invoice.amountPaid).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`
              : '—';
            const dueLabel = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—';
            const tone = resolveInvoiceTone(invoice.status);

            return (
              <tr key={invoice.id} className="hover:bg-secondary/60">
                <td className="px-4 py-3 text-sm text-slate-700">
                  <div className="flex flex-col">
                    <span className="font-semibold text-primary">{invoice.invoiceNumber}</span>
                    <span className="text-xs text-slate-500">Period {invoice.metadata?.period || 'n/a'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{invoice.campaignName || '—'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{amountLabel}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{paidLabel}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{dueLabel}</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  <StatusPill tone={tone}>{invoice.status}</StatusPill>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

InvoicesPanel.propTypes = {
  invoices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      invoiceNumber: PropTypes.string,
      campaignName: PropTypes.string,
      status: PropTypes.string,
      currency: PropTypes.string,
      amountDue: PropTypes.number,
      amountPaid: PropTypes.number,
      dueDate: PropTypes.string,
      metadata: PropTypes.object
    })
  )
};

InvoicesPanel.defaultProps = {
  invoices: []
};
