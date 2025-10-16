import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import CommunicationsWorkspace from '../../../features/communications/CommunicationsWorkspace.jsx';

const CARD_CONFIG = [
  { id: 'activeThreads', label: 'Active threads', helper: 'Open conversations' },
  { id: 'awaitingResponse', label: 'Awaiting reply', helper: 'Messages needing attention' },
  { id: 'entryPoints', label: 'Entry points', helper: 'Live widgets & touchpoints' },
  { id: 'quickReplies', label: 'Quick replies', helper: 'Reusable responses' },
  { id: 'escalationRules', label: 'Escalation rules', helper: 'Auto-routing policies' }
];

const ALLOWED_ROLES = ['serviceman', 'provider', 'operations', 'admin'];

function normaliseSummary(summary = {}) {
  return {
    activeThreads: Number.isFinite(summary.activeThreads) ? summary.activeThreads : 0,
    awaitingResponse: Number.isFinite(summary.awaitingResponse) ? summary.awaitingResponse : 0,
    entryPoints: Number.isFinite(summary.entryPoints) ? summary.entryPoints : 0,
    quickReplies: Number.isFinite(summary.quickReplies) ? summary.quickReplies : 0,
    escalationRules: Number.isFinite(summary.escalationRules) ? summary.escalationRules : 0
  };
}

function formatStat(value) {
  if (Number.isFinite(value)) {
    return value.toLocaleString();
  }
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  return '—';
}

function ServicemanInboxWorkspace({ section, context }) {
  const communicationsContext = context?.communications ?? {};
  const sectionData = section?.data ?? {};

  const initialSummary = useMemo(
    () =>
      normaliseSummary({
        ...communicationsContext.summary,
        ...sectionData.summary
      }),
    [communicationsContext.summary, sectionData.summary]
  );

  const [summarySnapshot, setSummarySnapshot] = useState(initialSummary);

  const participant = useMemo(() => {
    return sectionData.currentParticipant ?? communicationsContext.participant ?? null;
  }, [communicationsContext.participant, sectionData.currentParticipant]);

  const initialParticipantId = useMemo(() => {
    return (
      sectionData.defaultParticipantId ||
      participant?.participantId ||
      communicationsContext.participant?.participantId ||
      ''
    );
  }, [communicationsContext.participant?.participantId, participant?.participantId, sectionData.defaultParticipantId]);

  const conversationHref = useMemo(() => {
    return initialParticipantId
      ? `/communications?participantId=${encodeURIComponent(initialParticipantId)}`
      : '/communications';
  }, [initialParticipantId]);

  const cards = useMemo(() => {
    return CARD_CONFIG.map((card) => ({
      ...card,
      value: summarySnapshot[card.id]
    }));
  }, [summarySnapshot]);

  const handleConversationCreated = useCallback(() => {
    setSummarySnapshot((current) => ({
      ...current,
      activeThreads: (Number.isFinite(current.activeThreads) ? current.activeThreads : 0) + 1,
      awaitingResponse: Number.isFinite(current.awaitingResponse)
        ? current.awaitingResponse + 1
        : current.awaitingResponse
    }));
  }, []);

  const handleWorkspaceMetricsChange = useCallback((metrics = {}) => {
    setSummarySnapshot((current) => {
      const next = { ...current };
      let changed = false;

      const resolvedActiveThreads = Number.isFinite(metrics.activeThreads)
        ? metrics.activeThreads
        : Number.isFinite(metrics.conversations)
          ? metrics.conversations
          : null;

      if (resolvedActiveThreads !== null && next.activeThreads !== resolvedActiveThreads) {
        next.activeThreads = resolvedActiveThreads;
        changed = true;
      }

      if (Number.isFinite(metrics.awaitingResponse) && next.awaitingResponse !== metrics.awaitingResponse) {
        next.awaitingResponse = metrics.awaitingResponse;
        changed = true;
      }

      if (Number.isFinite(metrics.entryPoints) && next.entryPoints !== metrics.entryPoints) {
        next.entryPoints = metrics.entryPoints;
        changed = true;
      }

      if (Number.isFinite(metrics.quickReplies) && next.quickReplies !== metrics.quickReplies) {
        next.quickReplies = metrics.quickReplies;
        changed = true;
      }

      if (Number.isFinite(metrics.escalationRules) && next.escalationRules !== metrics.escalationRules) {
        next.escalationRules = metrics.escalationRules;
        changed = true;
      }

      return changed ? next : current;
    });
  }, []);

  const heroActions = useMemo(
    () => (
      <>
        <Link
          to={conversationHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
        >
          Open full workspace
        </Link>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.open('/communications?panel=settings', '_blank', 'noopener,noreferrer');
            }
          }}
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          Inbox settings
        </button>
      </>
    ),
    [conversationHref]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.id}
            className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/80"
          >
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatStat(card.value)}</p>
            <p className="mt-1 text-xs text-slate-500">{card.helper}</p>
          </div>
        ))}
      </div>

      <CommunicationsWorkspace
        variant="serviceman"
        allowedRoles={ALLOWED_ROLES}
        embedded
        heroActions={<div className="flex flex-wrap gap-2">{heroActions}</div>}
        initialParticipantId={initialParticipantId}
        currentParticipant={participant}
        onConversationCreated={handleConversationCreated}
        onWorkspaceMetricsChange={handleWorkspaceMetricsChange}
      />
    </div>
  );
}

ServicemanInboxWorkspace.propTypes = {
  section: PropTypes.shape({
    data: PropTypes.shape({
      summary: PropTypes.object,
      defaultParticipantId: PropTypes.string,
      currentParticipant: PropTypes.object,
      tenantId: PropTypes.string
    })
  }).isRequired,
  context: PropTypes.shape({
    communications: PropTypes.shape({
      summary: PropTypes.object,
      participant: PropTypes.object
    })
  })
};

ServicemanInboxWorkspace.defaultProps = {
  context: {}
};

export default ServicemanInboxWorkspace;
