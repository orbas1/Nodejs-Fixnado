import PropTypes from 'prop-types';
import { Spinner } from '../ui/index.js';
import OrderCard from './OrderCard.jsx';

function OrdersList({
  orders,
  loading,
  expandedOrderId,
  onToggleOrder,
  onOpenTimeline,
  onReleaseEscrow,
  releasingOrderId,
  getScheduleDraft,
  onScheduleChange,
  onSaveSchedule,
  savingOrderId,
  getActiveTab,
  onTabChange,
  getDisputeDraft,
  onDisputeChange,
  onStartDispute,
  disputeOrderId
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-accent/10 bg-white/95 p-6">
        <Spinner />
        <p className="text-sm text-slate-600">Loading services management data…</p>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-accent/10 bg-white/95 p-6 text-sm text-slate-600">
        No service orders match the selected filter.
      </div>
    );
  }

  return orders.map((order) => (
    <OrderCard
      key={order.id}
      order={order}
      isExpanded={expandedOrderId === order.id}
      onToggle={() => onToggleOrder(order.id)}
      onOpenTimeline={() => onOpenTimeline(order.id)}
      onReleaseEscrow={() => onReleaseEscrow(order.id)}
      releasing={releasingOrderId === order.id}
      scheduleDraft={getScheduleDraft(order)}
      onScheduleChange={(field, value) => onScheduleChange(order.id, field, value)}
      onSaveSchedule={() => onSaveSchedule(order)}
      saving={savingOrderId === order.id}
      activeTab={getActiveTab(order.id)}
      onTabChange={(tab) => onTabChange(order.id, tab)}
      disputeDraft={getDisputeDraft(order.id)}
      onDisputeChange={(value) => onDisputeChange(order.id, value)}
      onStartDispute={() => onStartDispute(order.id)}
      disputing={disputeOrderId === order.id}
    />
  ));
}

OrdersList.propTypes = {
  orders: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  expandedOrderId: PropTypes.string,
  onToggleOrder: PropTypes.func.isRequired,
  onOpenTimeline: PropTypes.func.isRequired,
  onReleaseEscrow: PropTypes.func.isRequired,
  releasingOrderId: PropTypes.string,
  getScheduleDraft: PropTypes.func.isRequired,
  onScheduleChange: PropTypes.func.isRequired,
  onSaveSchedule: PropTypes.func.isRequired,
  savingOrderId: PropTypes.string,
  getActiveTab: PropTypes.func.isRequired,
  onTabChange: PropTypes.func.isRequired,
  getDisputeDraft: PropTypes.func.isRequired,
  onDisputeChange: PropTypes.func.isRequired,
  onStartDispute: PropTypes.func.isRequired,
  disputeOrderId: PropTypes.string
};

OrdersList.defaultProps = {
  loading: false,
  expandedOrderId: null,
  releasingOrderId: null,
  savingOrderId: null,
  disputeOrderId: null
};

export default OrdersList;
