import PropTypes from 'prop-types';
import {
  ArrowTopRightOnSquareIcon,
  ShieldExclamationIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Button, Card, FormField, StatusPill } from '../ui/index.js';
import { formatDateTime, formatMoney } from './formatters.js';

const STATUS_TONE = {
  draft: 'neutral',
  funded: 'info',
  in_progress: 'info',
  completed: 'success',
  disputed: 'warning'
};

const ESCROW_TONE = {
  pending: 'neutral',
  funded: 'info',
  released: 'success',
  disputed: 'warning'
};

function OrderCard({
  order,
  isExpanded,
  onToggle,
  onOpenTimeline,
  onReleaseEscrow,
  releasing,
  scheduleDraft,
  onScheduleChange,
  onSaveSchedule,
  saving,
  activeTab,
  onTabChange,
  disputeDraft,
  onDisputeChange,
  onStartDispute,
  disputing
}) {
  return (
    <Card padding="lg" className="border border-accent/10 bg-white/95 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-primary">
              {order.service?.title ?? `Order ${order.id.slice(0, 6).toUpperCase()}`}
            </h3>
            <StatusPill tone={STATUS_TONE[order.status] ?? 'neutral'}>{order.status.replace('_', ' ')}</StatusPill>
            {order.escrow ? (
              <StatusPill tone={ESCROW_TONE[order.escrow.status] ?? 'neutral'}>
                Escrow {order.escrow.status}
              </StatusPill>
            ) : null}
          </div>
          <p className="text-sm text-slate-600">
            Scheduled: {formatDateTime(order.booking?.scheduledStart)} → {formatDateTime(order.booking?.scheduledEnd)}
          </p>
          <p className="text-sm text-slate-600">Value: {formatMoney(order.totalAmount, order.currency)}</p>
          <p className="text-sm text-slate-600">Zone: {order.booking?.zoneId ?? 'Not assigned'}</p>
          {order.metrics?.disputesOpen ? (
            <p className="text-sm font-medium text-rose-600">
              {order.metrics.disputesOpen} dispute{order.metrics.disputesOpen === 1 ? '' : 's'} in progress
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 lg:items-end">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onToggle}
            >
              {isExpanded ? 'Close actions' : 'Manage order'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={ArrowTopRightOnSquareIcon}
              onClick={onOpenTimeline}
            >
              View timeline
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onReleaseEscrow}
              loading={releasing}
              disabled={!order.escrow || order.escrow.status === 'released'}
            >
              Release escrow
            </Button>
          </div>
        </div>
      </div>

      {isExpanded ? (
        <div className="mt-6 border-t border-accent/10 pt-6">
          <div className="flex flex-wrap items-center gap-3 border-b border-accent/10 pb-3">
            <Button
              type="button"
              variant={activeTab === 'schedule' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('schedule')}
            >
              Update schedule
            </Button>
            <Button
              type="button"
              variant={activeTab === 'dispute' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('dispute')}
            >
              Start dispute
            </Button>
          </div>
          {activeTab === 'schedule' ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id={`schedule-start-${order.id}`} label="Scheduled start">
                  <input
                    id={`schedule-start-${order.id}`}
                    type="datetime-local"
                    value={scheduleDraft.scheduledStart}
                    onChange={(event) => onScheduleChange('scheduledStart', event.target.value)}
                    className="w-full rounded-xl border border-accent/20 bg-white px-3 py-2 text-sm"
                  />
                </FormField>
                <FormField id={`schedule-end-${order.id}`} label="Scheduled end">
                  <input
                    id={`schedule-end-${order.id}`}
                    type="datetime-local"
                    value={scheduleDraft.scheduledEnd}
                    onChange={(event) => onScheduleChange('scheduledEnd', event.target.value)}
                    className="w-full rounded-xl border border-accent/20 bg-white px-3 py-2 text-sm"
                  />
                </FormField>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={ClockIcon}
                onClick={onSaveSchedule}
                loading={saving}
              >
                Save schedule
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <FormField id={`dispute-notes-${order.id}`} label="Explain the issue">
                <textarea
                  id={`dispute-notes-${order.id}`}
                  value={disputeDraft}
                  onChange={(event) => onDisputeChange(event.target.value)}
                  placeholder="Share evidence, observations, or expectations for resolution."
                  className="min-h-[120px] w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm"
                />
              </FormField>
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={ShieldExclamationIcon}
                onClick={onStartDispute}
                loading={disputing}
              >
                Start dispute
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </Card>
  );
}

OrderCard.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    service: PropTypes.shape({
      title: PropTypes.string
    }),
    booking: PropTypes.shape({
      scheduledStart: PropTypes.string,
      scheduledEnd: PropTypes.string,
      zoneId: PropTypes.string
    }),
    escrow: PropTypes.shape({
      status: PropTypes.string
    }),
    metrics: PropTypes.shape({
      disputesOpen: PropTypes.number
    }),
    totalAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string
  }).isRequired,
  isExpanded: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  onOpenTimeline: PropTypes.func.isRequired,
  onReleaseEscrow: PropTypes.func.isRequired,
  releasing: PropTypes.bool,
  scheduleDraft: PropTypes.shape({
    scheduledStart: PropTypes.string,
    scheduledEnd: PropTypes.string
  }).isRequired,
  onScheduleChange: PropTypes.func.isRequired,
  onSaveSchedule: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  activeTab: PropTypes.oneOf(['schedule', 'dispute']).isRequired,
  onTabChange: PropTypes.func.isRequired,
  disputeDraft: PropTypes.string,
  onDisputeChange: PropTypes.func.isRequired,
  onStartDispute: PropTypes.func.isRequired,
  disputing: PropTypes.bool
};

OrderCard.defaultProps = {
  isExpanded: false,
  releasing: false,
  saving: false,
  disputeDraft: '',
  disputing: false
};

export default OrderCard;
