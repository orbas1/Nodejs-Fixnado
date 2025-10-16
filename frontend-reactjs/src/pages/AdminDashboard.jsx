import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BanknotesIcon, MapIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx';
import { DASHBOARD_ROLES } from '../constants/dashboardConfig.js';
import { getAdminDashboard, PanelApiError } from '../api/panelClient.js';
import { Button, SegmentedControl, StatusPill } from '../components/ui/index.js';
import { useAdminSession } from '../providers/AdminSessionProvider.jsx';
import { getAdminAffiliateSettings } from '../api/affiliateClient.js';

const currencyFormatter = (currency = 'USD') =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 });
const numberFormatter = new Intl.NumberFormat();

function resolveRecurrence(rule) {
  if (!rule) return 'One time';
  if (rule.recurrenceType === 'infinite') return 'Infinite';
  if (rule.recurrenceType === 'finite') {
    return `${rule.recurrenceLimit ?? 0} conversions`; // fallback text
  }
  return 'One time';
}

function formatCurrency(amount, currency = 'USD') {
  const formatter = currencyFormatter(currency);
  const numeric = Number.parseFloat(amount ?? 0);
  return formatter.format(Number.isNaN(numeric) ? 0 : numeric);
}

function buildAffiliateGovernanceSection(affiliateState) {
  if (!affiliateState) return null;

  if (affiliateState.loading && !affiliateState.data) {
    return {
      id: 'affiliate-governance',
      label: 'Affiliate monetisation',
      description: 'Synchronising unified payout controls for web and mobile affiliates.',
      type: 'settings',
      data: {
        panels: [
          {
            id: 'affiliate-loading',
            title: 'Programme status',
            description: 'Preparing affiliate guardrails…',
            status: 'Loading',
            items: [
              {
                id: 'loading',
                label: 'Affiliate insights',
                helper: 'Live commission tiers and earnings',
                value: 'Loading…'
              }
            ]
          }
        ]
      }
    };
  }

  if (affiliateState.error) {
    return {
      id: 'affiliate-governance',
      label: 'Affiliate monetisation',
      description: 'Monitor affiliate guardrails and payout readiness.',
      type: 'settings',
      data: {
        panels: [
          {
            id: 'affiliate-error',
            title: 'Affiliate controls',
            description: 'We were unable to load the affiliate configuration snapshot.',
            status: 'Attention required',
            items: [
              {
                id: 'error',
                label: 'Status',
                helper: 'Retry from Monetisation controls if the issue persists.',
                value: affiliateState.error.message
              }
            ]
          }
        ]
      }
    };
  }

  if (!affiliateState.data) {
    return null;
  }

  const { settings, rules = [], performance = [] } = affiliateState.data;

  const ruleItems = rules.length
    ? rules.slice(0, 4).map((rule) => ({
        id: rule.id,
        label: `${rule.tierLabel} • ${rule.name}`,
        helper: `${formatCurrency(rule.minTransactionValue)} – ${
          rule.maxTransactionValue != null ? formatCurrency(rule.maxTransactionValue) : '∞'
        } • ${resolveRecurrence(rule)}`,
        value: `${Number.parseFloat(rule.commissionRate ?? 0).toFixed(2)}%`
      }))
    : [
        {
          id: 'no-rules',
          label: 'Commission tiers',
          helper: 'No active tiers configured yet',
          value: 'Create tiers from Monetisation controls'
        }
      ];

  const performerItems = performance.length
    ? performance.slice(0, 4).map((record) => ({
        id: record.id,
        label: record.referralCode ? record.referralCode.toUpperCase() : 'Affiliate partner',
        helper: `${formatCurrency(record.totalCommissionEarned)} earned • ${formatCurrency(record.lifetimeRevenue)} revenue influenced`,
        value: `${numberFormatter.format(record.totalReferred ?? 0)} referrals`
      }))
    : [
        {
          id: 'no-performance',
          label: 'Performance snapshot',
          helper: 'No affiliate activity captured yet',
          value: 'Monitor once partners onboard'
        }
      ];

  return {
    id: 'affiliate-governance',
    label: 'Affiliate monetisation',
    description: 'Guardrails for tiered commissions and payout cadence across Fixnado surfaces.',
    type: 'settings',
    data: {
      panels: [
        {
          id: 'programme-settings',
          title: 'Programme guardrails',
          description: 'Applies to both the enterprise web portal and the mobile command centre.',
          status: settings.autoApproveReferrals ? 'Auto approval enabled' : 'Manual approval',
          items: [
            {
              id: 'payout-cadence',
              label: 'Payout cadence',
              helper: 'Release schedule for approved commission balances',
              value: `Every ${settings.payoutCadenceDays} days`
            },
            {
              id: 'minimum-payout',
              label: 'Minimum payout',
              helper: 'Threshold before settlement is triggered',
              value: formatCurrency(settings.minimumPayoutAmount)
            },
            {
              id: 'referral-window',
              label: 'Attribution window',
              helper: 'Eligible conversion window per referral',
              value: `${settings.referralAttributionWindowDays} days`
            },
            {
              id: 'auto-approve',
              label: 'Auto approval',
              helper: 'Real-time commission approval for trusted partners',
              type: 'toggle',
              enabled: Boolean(settings.autoApproveReferrals)
            },
            settings.disclosureUrl
              ? {
                  id: 'disclosure',
                  label: 'Disclosure policy',
                  helper: 'Affiliate terms accessible to partners',
                  value: settings.disclosureUrl
                }
              : null
          ].filter(Boolean)
        },
        {
          id: 'commission-tiers',
          title: 'Commission tiers',
          description: 'Percentage tiers triggered by transaction value bands.',
          items: ruleItems
        },
        {
          id: 'affiliate-performance',
          title: 'Performance leaders',
          description: 'Top earning partners across the last attribution window.',
          items: performerItems
        }
      ]
    }
  };
}

const DEFAULT_TIMEFRAME = '7d';
const FALLBACK_TIMEFRAME_OPTIONS = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' }
];

const ACCENT_BY_TONE = {
  success: 'from-white via-sky-50 to-emerald-100/60',
  info: 'from-white via-indigo-50 to-sky-100/60',
  warning: 'from-white via-amber-50 to-amber-100/80',
  danger: 'from-white via-rose-50 to-rose-100/80',
  neutral: 'from-white via-slate-50 to-slate-100'
};

function resolveAccent(tone) {
  return ACCENT_BY_TONE[tone] ?? ACCENT_BY_TONE.info;
}

function resolveTrend(delta) {
  if (!delta) return 'up';
  return /^[-−]/.test(delta.trim()) ? 'down' : 'up';
}

function disputeCommentary(escalated, resolved) {
  if (escalated > resolved) {
    return 'Escalations outpacing resolutions — deploy senior reviewers.';
  }
  if (resolved > escalated) {
    return 'Resolution velocity healthy — maintain staffing cadence.';
  }
  return 'Escalations balanced with resolutions.';
}

function complianceStatusLabel(tone) {
  if (tone === 'danger') return 'Escalate immediately';
  if (tone === 'warning') return 'Prioritise this window';
  return 'On track';
}

function automationStatusLabel(tone) {
  if (tone === 'warning') return 'Monitor delivery';
  if (tone === 'success') return 'Operational';
  return 'In progress';
}

function buildAdminNavigation(payload) {
  if (!payload) {
    return [];
  }

  const tiles = payload.metrics?.command?.tiles ?? [];
  const summary = payload.metrics?.command?.summary ?? {};
  const escrowTrend = payload.charts?.escrowTrend?.buckets ?? [];
  const disputeBreakdown = payload.charts?.disputeBreakdown?.buckets ?? [];
  const securitySignals = payload.security?.signals ?? [];
  const automationBacklog = payload.security?.automationBacklog ?? [];
  const queueBoards = payload.queues?.boards ?? [];
  const complianceControls = payload.queues?.complianceControls ?? [];
  const auditTimeline = payload.audit?.timeline ?? [];

  const overview = {
    id: 'overview',
    label: 'Overview',
    description: 'At-a-glance operations, compliance, and automation posture for Fixnado administrators.',
    type: 'overview',
    analytics: {
      metrics: tiles.map((tile) => ({
        label: tile.label,
        value: tile.valueLabel ?? `${tile.value?.amount ?? '—'}`,
        change: tile.delta ? `${tile.delta} vs previous window` : 'No delta reported',
        trend: resolveTrend(tile.delta)
      })),
      charts: [
        escrowTrend.length
          ? {
              id: 'escrow-trend',
              title: 'Escrow trajectory',
              description: `Escrow under management across the ${payload.timeframeLabel?.toLowerCase() ?? 'selected'} window versus baseline targets.`,
              type: 'area',
              dataKey: 'value',
              secondaryKey: 'target',
              data: escrowTrend.map((bucket) => ({
                name: bucket.label,
                value: Number(bucket.value ?? bucket.amount ?? 0),
                target: Number(bucket.target ?? 0)
              }))
            }
          : null,
        disputeBreakdown.length
          ? {
              id: 'dispute-breakdown',
              title: 'Dispute escalations vs resolutions',
              description: 'Track escalated cases against dispute closures for the selected cadence.',
              type: 'bar',
              dataKey: 'resolved',
              secondaryKey: 'escalated',
              data: disputeBreakdown.map((bucket) => ({
                name: bucket.label,
                resolved: Number(bucket.resolved ?? 0),
                escalated: Number(bucket.escalated ?? 0)
              }))
            }
          : null
      ].filter(Boolean),
      upcoming: complianceControls.slice(0, 4).map((control) => ({
        title: control.name,
        when: control.due,
        status: control.owner
      })),
      insights: [
        ...securitySignals.map((signal) => `${signal.label}: ${signal.valueLabel} • ${signal.caption}`),
        automationBacklog.length
          ? `Automation backlog tracking ${automationBacklog.length} initiative${automationBacklog.length === 1 ? '' : 's'}.`
          : null
      ].filter(Boolean)
    }
  };

  const commandMetrics = {
    id: 'command-metrics',
    label: 'Command metrics',
    description: 'Financial oversight, dispute momentum, and SLA adherence for the current operating window.',
    type: 'grid',
    data: {
      cards: [
        {
          title: 'Operating window summary',
          accent: 'from-white via-sky-50 to-indigo-100/70',
          details: [
            `Window: ${payload.timeframeLabel ?? '—'}`,
            `Escrow managed: ${summary.escrowTotalLabel ?? '—'}`,
            `Open disputes: ${summary.openDisputesLabel ?? '—'}`,
            `SLA compliance: ${summary.slaComplianceLabel ?? '—'}`
          ]
        },
        ...tiles.map((tile) => ({
          title: tile.label,
          accent: resolveAccent(tile.status?.tone),
          details: [
            tile.valueLabel ? `Value: ${tile.valueLabel}` : null,
            tile.caption,
            tile.delta ? `Δ ${tile.delta}` : null,
            tile.status?.label ? `Status: ${tile.status.label}` : null
          ].filter(Boolean)
        }))
      ]
    }
  };

  const securitySection = securitySignals.length
    ? {
        id: 'security-posture',
        label: 'Security & telemetry posture',
        description: 'Adoption, alerting, and ingestion health signals from the last 24 hours.',
        type: 'grid',
        data: {
          cards: securitySignals.map((signal) => ({
            title: `${signal.label} — ${signal.valueLabel}`,
            accent: resolveAccent(signal.tone),
            details: [
              signal.caption,
              signal.tone === 'danger'
                ? 'Immediate investigation required.'
                : signal.tone === 'warning'
                  ? 'Monitor closely and prepare contingency.'
                  : 'Tracking to plan.'
            ]
          }))
        }
      }
    : null;

  const operationsSection = queueBoards.length
    ? {
        id: 'operations-queues',
        label: 'Operations queues',
        description: 'Owner updates from provider verification, dispute management, and insurance badge workflows.',
        type: 'grid',
        data: {
          cards: queueBoards.map((board) => ({
            title: board.title,
            accent: 'from-white via-slate-50 to-blue-50/80',
            details: [board.summary, ...board.updates, `Owner: ${board.owner}`].filter(Boolean)
          }))
        }
      }
    : null;

  const disputeSection = disputeBreakdown.length
    ? {
        id: 'dispute-health',
        label: 'Dispute health',
        description: 'Escalated cases versus resolutions for each cadence bucket.',
        type: 'table',
        data: {
          headers: ['Cadence', 'Escalated', 'Resolved', 'Commentary'],
          rows: disputeBreakdown.map((bucket) => {
            const escalated = Number(bucket.escalated ?? 0);
            const resolved = Number(bucket.resolved ?? 0);
            return [
              bucket.label,
              escalated.toLocaleString('en-GB'),
              resolved.toLocaleString('en-GB'),
              disputeCommentary(escalated, resolved)
            ];
          })
        }
      }
    : null;

  const complianceSection = complianceControls.length
    ? {
        id: 'compliance-controls',
        label: 'Compliance controls',
        description: 'Expiring attestations and their current owners over the next 14 days.',
        type: 'list',
        data: {
          items: complianceControls.map((control) => ({
            title: control.name,
            description: `${control.detail} • Owner: ${control.owner}`,
            status: `${control.due} • ${complianceStatusLabel(control.tone)}`
          }))
        }
      }
    : null;

  const automationSection = automationBacklog.length
    ? {
        id: 'automation-backlog',
        label: 'Automation backlog',
        description: 'AI and automation initiatives with their current readiness state.',
        type: 'list',
        data: {
          items: automationBacklog.map((item) => ({
            title: item.name,
            description: item.notes,
            status: `${item.status} • ${automationStatusLabel(item.tone)}`
          }))
        }
      }
    : null;

  const auditSection = auditTimeline.length
    ? {
        id: 'audit-log',
        label: 'Audit timeline',
        description: 'Latest pipeline runs, compliance reviews, and dispute checkpoints.',
        type: 'table',
        data: {
          headers: ['Time', 'Event', 'Owner', 'Status'],
          rows: auditTimeline.map((entry) => [entry.time, entry.event, entry.owner, entry.status])
        }
      }
    : null;

  return [
    overview,
    commandMetrics,
    securitySection,
    operationsSection,
    disputeSection,
    complianceSection,
    automationSection,
    auditSection
  ].filter(Boolean);
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAdminSession();
  const roleMeta = useMemo(() => DASHBOARD_ROLES.find((role) => role.id === 'admin'), []);
  const registeredRoles = useMemo(() => DASHBOARD_ROLES.filter((role) => role.registered), []);
  const [searchParams, setSearchParams] = useSearchParams();
  const timeframeParam = searchParams.get('timeframe') ?? DEFAULT_TIMEFRAME;
  const [timeframe, setTimeframe] = useState(timeframeParam);
  const [state, setState] = useState({ loading: true, data: null, meta: null, error: null });
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [affiliateState, setAffiliateState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    if (timeframeParam !== timeframe) {
      setTimeframe(timeframeParam);
    }
  }, [timeframeParam, timeframe]);

  const loadDashboard = useCallback(
    async ({ signal, timeframe: requestedTimeframe, forceRefresh = false } = {}) => {
      const windowKey = requestedTimeframe ?? timeframe;
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const response = await getAdminDashboard({ timeframe: windowKey, signal, forceRefresh });
        setState({ loading: false, data: response.data, meta: response.meta, error: null });
        setLastRefreshed(response.data?.generatedAt ?? new Date().toISOString());
      } catch (error) {
        if (signal?.aborted || error?.name === 'AbortError') {
          return;
        }
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to load admin dashboard', error?.status ?? 500, { cause: error });
        if (panelError.status === 401 || panelError.status === 403) {
          await logout();
          navigate('/admin', {
            replace: true,
            state: { reason: 'sessionExpired', from: { pathname: '/admin/dashboard' } }
          });
          return;
        }
        setState((current) => ({ ...current, loading: false, error: panelError }));
      }
    },
    [timeframe, logout, navigate]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard({ signal: controller.signal, timeframe });
    return () => controller.abort();
  }, [loadDashboard, timeframe]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const payload = await getAdminAffiliateSettings({ signal: controller.signal });
        setAffiliateState({ loading: false, data: payload, error: null });
      } catch (error) {
        if (controller.signal.aborted) return;
        const err = error instanceof Error ? error : new Error('Unable to load affiliate settings');
        setAffiliateState({ loading: false, data: null, error: err });
      }
    })();
    return () => controller.abort();
  }, []);

  const affiliateSection = useMemo(() => buildAffiliateGovernanceSection(affiliateState), [affiliateState]);

  const navigation = useMemo(() => {
    const sections = state.data ? buildAdminNavigation(state.data) : [];
    sections.push({
      id: 'zone-management-link',
      label: 'Zone management workspace',
      description: 'Launch the geo-zonal governance tools in a dedicated workspace.',
      href: '/admin/zones'
    });
    if (affiliateSection) {
      sections.push(affiliateSection);
    }
    return sections;
  }, [state.data, affiliateSection]);
  const dashboardPayload = state.data ? { navigation } : null;
  const timeframeOptions = state.data?.timeframeOptions ?? FALLBACK_TIMEFRAME_OPTIONS;
  const isFallback = Boolean(state.meta?.fallback);
  const servedFromCache = Boolean(state.meta?.fromCache && !state.meta?.fallback);

  const handleTimeframeChange = useCallback(
    (next) => {
      setTimeframe(next);
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        if (next === DEFAULT_TIMEFRAME) {
          params.delete('timeframe');
        } else {
          params.set('timeframe', next);
        }
        return params;
      });
    },
    [setSearchParams]
  );

  const handleRefresh = useCallback(() => {
    loadDashboard({ timeframe, forceRefresh: true });
  }, [loadDashboard, timeframe]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/admin', { replace: true, state: { reason: 'signedOut' } });
  }, [logout, navigate]);

  if (!roleMeta) {
    return null;
  }

  const personaLabel = state.data?.timeframeLabel
    ? `${roleMeta.persona} • Window: ${state.data.timeframeLabel}`
    : roleMeta.persona;

  const filters = (
    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
      <Button
        to="/admin/monetisation"
        size="sm"
        variant="secondary"
        icon={BanknotesIcon}
        iconPosition="start"
      >
        Monetisation controls
      </Button>
      <Button
        to="/admin/zones"
        size="sm"
        variant="secondary"
        icon={MapIcon}
        iconPosition="start"
      >
        Geo-zonal builder
      </Button>
      <SegmentedControl
        name="Command metrics timeframe"
        value={timeframe}
        options={timeframeOptions}
        onChange={handleTimeframeChange}
        size="sm"
      />
      {isFallback ? <StatusPill tone="warning">Showing cached insights</StatusPill> : null}
      {servedFromCache ? <StatusPill tone="info">Served from cache</StatusPill> : null}
      {state.error ? <StatusPill tone="danger">Refresh failed — {state.error.message}</StatusPill> : null}
    </div>
  );

  return (
    <DashboardLayout
      roleMeta={{ ...roleMeta, persona: personaLabel }}
      registeredRoles={registeredRoles}
      dashboard={dashboardPayload}
      loading={state.loading}
      error={state.error?.message ?? null}
      onRefresh={handleRefresh}
      lastRefreshed={lastRefreshed}
      filters={filters}
      onLogout={handleLogout}
    />
  );
}
