import PropTypes from 'prop-types';
import { ShieldCheckIcon, WrenchScrewdriverIcon, ServerStackIcon } from '@heroicons/react/24/outline';
import StatusPill from '../../ui/StatusPill.jsx';

function SummaryCard({ title, value, caption, icon: Icon, tone }) {
  return (
    <div className="flex flex-col rounded-2xl border border-accent/10 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-secondary p-2 text-primary/70">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
          <p className="text-xl font-semibold text-primary">{value}</p>
        </div>
      </div>
      {caption ? <p className="mt-3 text-sm text-slate-600">{caption}</p> : null}
      <div className="mt-auto pt-4">
        <StatusPill tone={tone}>
          {tone === 'success' ? 'Healthy' : tone === 'warning' ? 'Attention' : tone === 'danger' ? 'At risk' : 'Monitor'}
        </StatusPill>
      </div>
    </div>
  );
}

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  caption: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  tone: PropTypes.oneOf(['success', 'warning', 'danger', 'info']).isRequired
};

SummaryCard.defaultProps = {
  caption: null
};

export default function SecuritySummaryGrid({ summary }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        title="Healthy connectors"
        value={summary.connectorsHealthy?.toLocaleString?.() ?? '0'}
        caption="Telemetry bridges online"
        icon={ShieldCheckIcon}
        tone={summary.connectorsAttention > 0 ? 'warning' : 'success'}
      />
      <SummaryCard
        title="Connectors needing attention"
        value={summary.connectorsAttention?.toLocaleString?.() ?? '0'}
        caption="Investigate degraded links"
        icon={ServerStackIcon}
        tone={summary.connectorsAttention > 0 ? 'warning' : 'success'}
      />
      <SummaryCard
        title="Open automation initiatives"
        value={summary.automationOpen?.toLocaleString?.() ?? '0'}
        caption="Automation backlog"
        icon={WrenchScrewdriverIcon}
        tone={summary.automationOpen > 0 ? 'info' : 'success'}
      />
      <SummaryCard
        title="Signals with warning"
        value={summary.signalsWarning?.toLocaleString?.() ?? '0'}
        caption="Signals to watch closely"
        icon={ShieldCheckIcon}
        tone={summary.signalsDanger > 0 ? 'danger' : summary.signalsWarning > 0 ? 'warning' : 'success'}
      />
    </div>
  );
}

SecuritySummaryGrid.propTypes = {
  summary: PropTypes.shape({
    connectorsHealthy: PropTypes.number,
    connectorsAttention: PropTypes.number,
    automationOpen: PropTypes.number,
    signalsWarning: PropTypes.number,
    signalsDanger: PropTypes.number
  })
};

SecuritySummaryGrid.defaultProps = {
  summary: {
    connectorsHealthy: 0,
    connectorsAttention: 0,
    automationOpen: 0,
    signalsWarning: 0,
    signalsDanger: 0
  }
};
