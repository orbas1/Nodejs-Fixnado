import PropTypes from 'prop-types';
import { useMemo } from 'react';
import {
  BriefcaseIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  DocumentCheckIcon,
  EnvelopeOpenIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import Button from '../../../components/ui/Button.jsx';
import Skeleton from '../../../components/ui/Skeleton.jsx';

function SummaryCard({ icon: Icon, label, value, helper, tone }) {
  return (
    <article className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <header className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-primary">{value}</p>
        </div>
      </header>
      {helper ? <p className="mt-4 text-xs text-slate-500">{helper}</p> : null}
      {tone ? (
        <div className="mt-4">
          <StatusPill tone={tone.name}>{tone.label}</StatusPill>
        </div>
      ) : null}
    </article>
  );
}

SummaryCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string,
  tone: PropTypes.shape({
    name: PropTypes.string,
    label: PropTypes.string
  })
};

SummaryCard.defaultProps = {
  helper: undefined,
  tone: undefined
};

export default function SummaryCards({ summary, loading, onRefresh }) {
  const cards = useMemo(() => {
    const winRate = summary.winRate != null ? `${Math.round((summary.winRate || 0) * 100)}%` : '0%';
    const responseRate = summary.responseRate != null ? `${Math.round((summary.responseRate || 0) * 100)}%` : '0%';
    const pendingValue = summary.pendingValue != null ? `£${Number(summary.pendingValue).toLocaleString()}` : '£0';
    const awardedValue = summary.awardedValue != null ? `£${Number(summary.awardedValue).toLocaleString()}` : '£0';
    return [
      {
        icon: ClipboardDocumentListIcon,
        label: 'Open opportunities',
        value: summary.totalOpenJobs ?? 0,
        helper: 'Live briefs accepting bids today.'
      },
      {
        icon: BriefcaseIcon,
        label: 'Managed jobs',
        value: summary.managedJobs ?? 0,
        helper: 'Custom briefs published by your team.'
      },
      {
        icon: ChartBarIcon,
        label: 'Active bids',
        value: summary.activeBids ?? 0,
        helper: `Win rate ${winRate}`,
        tone:
          summary.winRate != null
            ? {
                name: summary.winRate > 0.4 ? 'success' : summary.winRate < 0.15 ? 'warning' : 'info',
                label: winRate
              }
            : undefined
      },
      {
        icon: UserPlusIcon,
        label: 'Pending invites',
        value: summary.pendingInvitations ?? 0,
        helper: `Accepted ${summary.acceptedInvitations ?? 0}`
      },
      {
        icon: DocumentCheckIcon,
        label: 'Awarded value',
        value: awardedValue,
        helper: 'Confirmed custom job revenue to date.'
      },
      {
        icon: EnvelopeOpenIcon,
        label: 'Response rate',
        value: responseRate,
        helper: `Pending value ${pendingValue}`,
        tone:
          summary.responseRate != null
            ? {
                name: summary.responseRate > 0.75 ? 'success' : summary.responseRate < 0.4 ? 'warning' : 'info',
                label: responseRate
              }
            : undefined
      }
    ];
  }, [summary]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <Skeleton key={card.label ?? index} className="h-36 rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">Custom job performance</h2>
        <Button size="sm" variant="secondary" onClick={onRefresh}>
          Refresh workspace
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>
    </div>
  );
}

SummaryCards.propTypes = {
  summary: PropTypes.shape({
    totalOpenJobs: PropTypes.number,
    totalBids: PropTypes.number,
    activeBids: PropTypes.number,
    awardedBids: PropTypes.number,
    pendingValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    awardedValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    responseRate: PropTypes.number,
    winRate: PropTypes.number,
    managedJobs: PropTypes.number,
    pendingInvitations: PropTypes.number,
    acceptedInvitations: PropTypes.number
  }),
  loading: PropTypes.bool,
  onRefresh: PropTypes.func
};

SummaryCards.defaultProps = {
  summary: {},
  loading: false,
  onRefresh: () => {}
};
