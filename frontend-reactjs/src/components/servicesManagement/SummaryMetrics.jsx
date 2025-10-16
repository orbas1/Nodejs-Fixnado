import PropTypes from 'prop-types';
import { Card } from '../ui/index.js';
import { formatMoney, formatNumber } from './formatters.js';

function SummaryMetrics({ metrics, currency }) {
  const safeMetrics = metrics || {};
  const cards = [
    { label: 'Active orders', value: formatNumber(safeMetrics.activeOrders) },
    { label: 'Funded escrows', value: formatNumber(safeMetrics.fundedEscrows) },
    { label: 'Orders in dispute', value: formatNumber(safeMetrics.disputedOrders) },
    { label: 'Total managed', value: formatNumber(safeMetrics.totalOrders) },
    { label: 'Total spend', value: formatMoney(safeMetrics.totalSpend, currency) }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label} padding="lg" className="border border-accent/10 bg-white/95 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-primary/60">{card.label}</p>
          <p className="mt-2 text-xl font-semibold text-primary">{card.value}</p>
        </Card>
      ))}
    </div>
  );
}

SummaryMetrics.propTypes = {
  metrics: PropTypes.shape({
    activeOrders: PropTypes.number,
    fundedEscrows: PropTypes.number,
    disputedOrders: PropTypes.number,
    totalOrders: PropTypes.number,
    totalSpend: PropTypes.number
  }),
  currency: PropTypes.string
};

SummaryMetrics.defaultProps = {
  metrics: null,
  currency: 'GBP'
};

export default SummaryMetrics;
