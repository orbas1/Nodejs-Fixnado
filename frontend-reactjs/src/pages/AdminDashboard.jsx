import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BanknotesIcon,
  MapIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  WalletIcon,
  Cog8ToothIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  SwatchIcon,
  CubeIcon,
  Squares2X2Icon,
  GlobeAltIcon,
  EyeIcon,
  TagIcon,
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx';
import { DASHBOARD_ROLES } from '../constants/dashboardConfig.js';
import {
  getAdminDashboard,
  PanelApiError,
  getAdminProviderDirectory,
  getAdminProviderDetail,
  createAdminProvider,
  updateAdminProvider,
  archiveAdminProvider,
  updateAdminProviderTaxProfile,
  createAdminProviderTaxFiling,
  updateAdminProviderTaxFiling,
  deleteAdminProviderTaxFiling,
  upsertAdminProviderContact,
  deleteAdminProviderContact,
  upsertAdminProviderCoverage,
  deleteAdminProviderCoverage
} from '../api/panelClient.js';
import {
  getProviderComplianceSummary,
  submitProviderComplianceDocument,
  reviewProviderComplianceDocument,
  evaluateProviderCompliance,
  toggleProviderBadge,
  suspendProviderCompliance
} from '../api/providerComplianceClient.js';
import { listEnterpriseAccounts, DEFAULT_SUMMARY } from '../api/enterpriseAdminClient.js';
import {
  archiveAdminServiceCategory,
  archiveAdminServiceListing,
  createAdminServiceCategory,
  createAdminServiceListing,
  getAdminServiceSummary,
  updateAdminServiceCategory,
  updateAdminServiceListing,
  updateAdminServiceListingStatus
} from '../api/adminServiceClient.js';
import {
  Button,
  SegmentedControl,
  StatusPill,
  TextInput,
  Spinner,
  FormField
} from '../components/ui/index.js';
import {
  fetchComplianceControls,
  createComplianceControl as createComplianceControlRequest,
  updateComplianceControl as updateComplianceControlRequest,
  deleteComplianceControl as deleteComplianceControlRequest,
  updateComplianceAutomation
} from '../api/adminComplianceClient.js';
import { useAdminSession } from '../providers/AdminSessionProvider.jsx';
import { getAdminAffiliateSettings } from '../api/affiliateClient.js';
import AdminProfileSettingsPanel from '../components/admin/profile/AdminProfileSettingsPanel.jsx';
import {
  getAdminProfileSettings,
  updateAdminProfileSettings,
  createAdminDelegate,
  updateAdminDelegate,
  deleteAdminDelegate
} from '../api/adminProfileClient.js';
import { CommandMetricsConfigurator } from '../modules/commandMetrics/index.js';
import { buildLegalAdminNavigation } from '../features/legal/adminDashboardNavigation.js';
import {
  fetchAdminDashboardOverviewSettings,
  persistAdminDashboardOverviewSettings
} from '../api/adminDashboardSettingsClient.js';
import SecurityTelemetryWorkspace from '../components/security/telemetry/index.js';

const currencyFormatter = (currency = 'USD') =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 });
const numberFormatter = new Intl.NumberFormat();
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short'
});

function formatDateLabel(value) {
  if (!value) {
    return 'Not scheduled';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatRelativeMoment(value) {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  const diffMs = Date.now() - parsed.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'moments ago';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

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
          title: settings.programmeName || 'Affiliate programme',
          description:
            settings.programmeTagline || 'Applies to both the enterprise web portal and the mobile command centre.',
          status: settings.autoApproveReferrals ? 'Auto approval enabled' : 'Manual approval',
          items: [
            settings.contactEmail
              ? {
                  id: 'contact-email',
                  label: 'Partner desk email',
                  helper: 'Primary contact for affiliate operations',
                  value: settings.contactEmail
                }
              : null,
            settings.partnerPortalUrl
              ? {
                  id: 'partner-portal',
                  label: 'Partner portal',
                  helper: 'Opens in a new window',
                  value: settings.partnerPortalUrl
                }
              : null,
            settings.onboardingGuideUrl
              ? {
                  id: 'guide',
                  label: 'Onboarding guide',
                  helper: 'Shareable setup playbook for new partners',
                  value: settings.onboardingGuideUrl
                }
              : null,
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

function buildEnterpriseLaunchpad(snapshot) {
  if (!snapshot) return null;

  if (snapshot.loading) {
    return {
      id: 'enterprise-management',
      label: 'Enterprise management',
      description: 'Provision programmes, coverage maps, and escalation ladders for enterprise clients.',
      type: 'settings',
      data: {
        panels: [
          {
            id: 'enterprise-loading',
            title: 'Enterprise readiness',
            description: 'Synchronising enterprise programmes from the admin API.',
            status: 'Syncing accounts…',
            items: [
              {
                id: 'enterprise-launch-loading',
                label: 'Open control centre',
                helper: 'Manage programmes, coverage, and runbooks',
                type: 'action',
                cta: 'Open workspace',
                href: '/admin/enterprise'
              }
            ]
          }
        ]
      }
    };
  }

  if (snapshot.error) {
    return {
      id: 'enterprise-management',
      label: 'Enterprise management',
      description: 'Provision programmes, coverage maps, and escalation ladders for enterprise clients.',
      type: 'settings',
      data: {
        panels: [
          {
            id: 'enterprise-error',
            title: 'Enterprise readiness',
            description: 'We were unable to load the enterprise snapshot.',
            status: 'Attention required',
            items: [
              {
                id: 'enterprise-error-message',
                label: 'Status',
                helper: 'Retry once the admin API is reachable.',
                value: snapshot.error
              },
              {
                id: 'enterprise-launch-error',
                label: 'Open control centre',
                helper: 'Manage programmes, coverage, and runbooks',
                type: 'action',
                cta: 'Open workspace',
                href: '/admin/enterprise'
              }
            ]
          }
        ]
      }
    };
  }

  const { summary } = snapshot;
  const format = (value) => Number(value ?? 0).toLocaleString();
  return {
    id: 'enterprise-management',
    label: 'Enterprise management',
    description: 'Provision programmes, coverage maps, and escalation ladders for enterprise clients.',
    type: 'settings',
    data: {
      panels: [
        {
          id: 'enterprise-summary',
          title: 'Enterprise readiness',
          description: 'Snapshot of enterprise programmes managed by Fixnado operations.',
          status: `${format(summary.sites)} sites • ${format(summary.stakeholders)} stakeholders`,
          items: [
            {
              id: 'enterprise-programmes',
              label: 'Enterprise programmes',
              helper: 'Accounts tracked across Fixnado',
              value: format(summary.total)
            },
            {
              id: 'enterprise-active',
              label: 'Active programmes',
              helper: 'Live operational workspaces',
              value: format(summary.active)
            },
            {
              id: 'enterprise-archived',
              label: 'Archived programmes',
              helper: 'Locked historical records',
              value: format(summary.archived)
            },
            {
              id: 'enterprise-playbooks',
              label: 'Playbooks catalogued',
              helper: 'Runbooks managed across accounts',
              value: format(summary.playbooks)
            },
            {
              id: 'enterprise-launch',
              label: 'Open control centre',
              helper: 'Manage programmes, coverage, and runbooks',
              type: 'action',
              cta: 'Open workspace',
              href: '/admin/enterprise'
            }
          ]
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

const DEFAULT_PROFILE_PAYLOAD = {
  profile: {
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    department: '',
    phoneNumber: '',
    avatarUrl: '',
    timezone: 'UTC'
  },
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  },
  notifications: {
    email: true,
    sms: false,
    push: false,
    slack: false,
    pagerDuty: false,
    weeklyDigest: true
  },
  notificationEmails: [],
  delegates: [],
  audit: {
    updatedAt: null
  }
};
const OVERVIEW_METRICS_CONFIG = [
  {
    key: 'escrow',
    title: 'Escrow under management',
    description: 'Controls the liquidity tile copy and multiplier thresholds for escrow value reporting.',
    inputs: [
      {
        field: 'label',
        label: 'Metric name',
        type: 'text',
        hint: 'Heading presented in the overview metrics grid.'
      },
      {
        field: 'caption',
        label: 'Short caption',
        type: 'text',
        optionalLabel: 'Optional',
        hint: 'Supporting description beneath the metric.'
      },
      {
        field: 'targetHighMultiplier',
        label: 'Stretch multiplier',
        type: 'number',
        step: '0.01',
        hint: 'Multiplier for the target (green) band shown in charts.'
      },
      {
        field: 'targetMediumMultiplier',
        label: 'Baseline multiplier',
        type: 'number',
        step: '0.01',
        hint: 'Multiplier for the baseline performance band.'
      }
    ]
  },
  {
    key: 'disputes',
    title: 'Dispute load',
    description: 'Tune thresholds for dispute escalation monitoring in the overview tiles.',
    inputs: [
      {
        field: 'label',
        label: 'Metric name',
        type: 'text',
        hint: 'Heading presented in the overview metrics grid.'
      },
      {
        field: 'caption',
        label: 'Short caption',
        type: 'text',
        optionalLabel: 'Optional',
        hint: 'Supporting description beneath the metric.'
      },
      {
        field: 'thresholdLowMultiplier',
        label: 'Healthy multiplier',
        type: 'number',
        step: '0.01',
        hint: 'Threshold multiplier for green status messaging.'
      },
      {
        field: 'thresholdMediumMultiplier',
        label: 'Caution multiplier',
        type: 'number',
        step: '0.01',
        hint: 'Multiplier at which the dashboard flags amber status.'
      }
    ]
  },
  {
    key: 'jobs',
    title: 'Live jobs',
    description: 'Adjust the live jobs tile copy and multiplier thresholds.',
    inputs: [
      {
        field: 'label',
        label: 'Metric name',
        type: 'text',
        hint: 'Heading presented in the overview metrics grid.'
      },
      {
        field: 'caption',
        label: 'Short caption',
        type: 'text',
        optionalLabel: 'Optional',
        hint: 'Supporting description beneath the metric.'
      },
      {
        field: 'targetHighMultiplier',
        label: 'Stretch multiplier',
        type: 'number',
        step: '0.01',
        hint: 'Multiplier for maximum jobs target messaging.'
      },
      {
        field: 'targetMediumMultiplier',
        label: 'Baseline multiplier',
        type: 'number',
        step: '0.01',
        hint: 'Multiplier for baseline jobs target messaging.'
      }
    ]
  },
  {
    key: 'sla',
    title: 'SLA compliance',
    description: 'Set the SLA target and warning thresholds for the overview.',
    inputs: [
      {
        field: 'label',
        label: 'Metric name',
        type: 'text',
        hint: 'Heading presented in the overview metrics grid.'
      },
      {
        field: 'caption',
        label: 'Short caption',
        type: 'text',
        optionalLabel: 'Optional',
        hint: 'Supporting description beneath the metric.'
      },
      {
        field: 'goal',
        label: 'Target %',
        type: 'number',
        step: '0.1',
        hint: 'Target compliance percentage shown as the goal.'
      },
      {
        field: 'warningThreshold',
        label: 'Warning %',
        type: 'number',
        step: '0.1',
        hint: 'Threshold for warning badge messaging.'
      }
    ]
  }
];

const OVERVIEW_CHART_CONFIG = [
  {
    key: 'escrow',
    title: 'Escrow chart target',
    description: 'Update the comparison target applied to the escrow trend visual.',
    inputs: [
      {
        field: 'targetLabel',
        label: 'Target label',
        type: 'text',
        hint: 'Visible legend label for the target band.'
      },
      {
        field: 'targetDivisor',
        label: 'Target divisor',
        type: 'number',
        step: '1',
        hint: 'Used to scale large escrow numbers (e.g. 1000000 for millions).'
      }
    ]
  }
];

const MAX_OVERVIEW_INSIGHTS = 12;
const MAX_OVERVIEW_TIMELINE = 12;
const MAX_SECURITY_SIGNALS = 6;
const MAX_AUTOMATION_BACKLOG = 8;
const MAX_OPERATIONS_BOARDS = 6;
const MAX_OPERATIONS_BOARD_UPDATES = 5;
const MAX_COMPLIANCE_CONTROLS = 8;
const MAX_AUDIT_TIMELINE = 10;

const TONE_OPTIONS = [
  { value: 'success', label: 'Success' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'danger', label: 'Alert' }
];

function buildFormState(settings) {
  if (!settings) {
    return null;
  }

  const metricState = (metric = {}) => ({
    label: metric.label ?? '',
    caption: metric.caption ?? '',
    targetHighMultiplier:
      metric.targetHighMultiplier != null ? String(metric.targetHighMultiplier) : '',
    targetMediumMultiplier:
      metric.targetMediumMultiplier != null ? String(metric.targetMediumMultiplier) : '',
    thresholdLowMultiplier:
      metric.thresholdLowMultiplier != null ? String(metric.thresholdLowMultiplier) : '',
    thresholdMediumMultiplier:
      metric.thresholdMediumMultiplier != null ? String(metric.thresholdMediumMultiplier) : '',
    goal: metric.goal != null ? String(metric.goal) : '',
    warningThreshold: metric.warningThreshold != null ? String(metric.warningThreshold) : ''
  });

  const manualInsights = Array.isArray(settings.insights?.manual)
    ? [...settings.insights.manual]
    : [];

  const manualTimeline = Array.isArray(settings.timeline?.manual)
    ? settings.timeline.manual.map((entry) => ({
        title: entry?.title ?? '',
        when: entry?.when ?? '',
        status: entry?.status ?? ''
      }))
    : [];

  const manualSignals = Array.isArray(settings.security?.manualSignals)
    ? settings.security.manualSignals.map((signal) => ({
        label: signal?.label ?? '',
        caption: signal?.caption ?? '',
        valueLabel: signal?.valueLabel ?? '',
        tone: signal?.tone ?? 'info'
      }))
    : [];

  const manualBacklog = Array.isArray(settings.automation?.manualBacklog)
    ? settings.automation.manualBacklog.map((item) => ({
        name: item?.name ?? '',
        status: item?.status ?? '',
        notes: item?.notes ?? '',
        tone: item?.tone ?? 'info'
      }))
    : [];

  const manualBoards = Array.isArray(settings.queues?.manualBoards)
    ? settings.queues.manualBoards.map((board) => ({
        title: board?.title ?? '',
        summary: board?.summary ?? '',
        owner: board?.owner ?? '',
        updates: Array.isArray(board?.updates)
          ? board.updates.map((entry) => entry ?? '').filter((entry) => typeof entry === 'string')
          : []
      }))
    : [];

  const manualControls = Array.isArray(settings.queues?.manualComplianceControls)
    ? settings.queues.manualComplianceControls.map((control) => ({
        name: control?.name ?? '',
        detail: control?.detail ?? '',
        due: control?.due ?? '',
        owner: control?.owner ?? '',
        tone: control?.tone ?? 'info'
      }))
    : [];

  const manualAuditTimeline = Array.isArray(settings.audit?.manualTimeline)
    ? settings.audit.manualTimeline.map((entry) => ({
        time: entry?.time ?? '',
        event: entry?.event ?? '',
        owner: entry?.owner ?? '',
        status: entry?.status ?? ''
      }))
    : [];

  return {
    metrics: {
      escrow: metricState(settings.metrics?.escrow),
      disputes: metricState(settings.metrics?.disputes),
      jobs: metricState(settings.metrics?.jobs),
      sla: metricState(settings.metrics?.sla)
    },
    charts: {
      escrow: {
        targetDivisor:
          settings.charts?.escrow?.targetDivisor != null
            ? String(settings.charts.escrow.targetDivisor)
            : '',
        targetLabel: settings.charts?.escrow?.targetLabel ?? ''
      }
    },
    insights: { manual: manualInsights },
    timeline: { manual: manualTimeline },
    security: { manualSignals },
    automation: { manualBacklog },
    operations: { manualBoards },
    compliance: { manualControls },
    audit: { manualTimeline: manualAuditTimeline }
  };
}

function prepareSettingsPayload(form) {
  const parseNumber = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const metrics = {
    escrow: {
      label: form.metrics.escrow.label.trim(),
      caption: form.metrics.escrow.caption.trim()
    },
    disputes: {
      label: form.metrics.disputes.label.trim(),
      caption: form.metrics.disputes.caption.trim()
    },
    jobs: {
      label: form.metrics.jobs.label.trim(),
      caption: form.metrics.jobs.caption.trim()
    },
    sla: {
      label: form.metrics.sla.label.trim(),
      caption: form.metrics.sla.caption.trim()
    }
  };

  const maybeAssign = (target, key, value) => {
    if (value !== undefined) {
      target[key] = value;
    }
  };

  maybeAssign(metrics.escrow, 'targetHighMultiplier', parseNumber(form.metrics.escrow.targetHighMultiplier));
  maybeAssign(metrics.escrow, 'targetMediumMultiplier', parseNumber(form.metrics.escrow.targetMediumMultiplier));
  maybeAssign(metrics.disputes, 'thresholdLowMultiplier', parseNumber(form.metrics.disputes.thresholdLowMultiplier));
  maybeAssign(
    metrics.disputes,
    'thresholdMediumMultiplier',
    parseNumber(form.metrics.disputes.thresholdMediumMultiplier)
  );
  maybeAssign(metrics.jobs, 'targetHighMultiplier', parseNumber(form.metrics.jobs.targetHighMultiplier));
  maybeAssign(metrics.jobs, 'targetMediumMultiplier', parseNumber(form.metrics.jobs.targetMediumMultiplier));
  maybeAssign(metrics.sla, 'goal', parseNumber(form.metrics.sla.goal));
  maybeAssign(metrics.sla, 'warningThreshold', parseNumber(form.metrics.sla.warningThreshold));

  const chartDivisor = parseNumber(form.charts.escrow.targetDivisor);
  const charts = {
    escrow: {
      targetLabel: form.charts.escrow.targetLabel.trim()
    }
  };
  if (chartDivisor !== undefined) {
    charts.escrow.targetDivisor = chartDivisor;
  }

  const manualInsights = form.insights.manual
    .map((entry) => entry.trim())
    .filter((entry, index, arr) => entry && arr.indexOf(entry) === index);

  const manualTimeline = form.timeline.manual
    .map((entry) => ({
      title: entry.title.trim(),
      when: entry.when.trim(),
      status: entry.status.trim()
    }))
    .filter((entry) => entry.title && entry.when);

  const manualSignals = form.security.manualSignals
    .map((entry) => ({
      label: entry.label.trim(),
      caption: entry.caption.trim(),
      valueLabel: entry.valueLabel.trim(),
      tone: entry.tone || 'info'
    }))
    .filter((entry) => entry.label && entry.valueLabel);

  const manualBacklog = form.automation.manualBacklog
    .map((entry) => ({
      name: entry.name.trim(),
      status: entry.status.trim(),
      notes: entry.notes.trim(),
      tone: entry.tone || 'info'
    }))
    .filter((entry) => entry.name && entry.status);

  const manualBoards = form.operations.manualBoards
    .map((entry) => ({
      title: entry.title.trim(),
      summary: entry.summary.trim(),
      owner: entry.owner.trim(),
      updates: entry.updates.map((update) => update.trim()).filter(Boolean)
    }))
    .filter((entry) => entry.title && entry.summary);

  const manualControls = form.compliance.manualControls
    .map((entry) => ({
      name: entry.name.trim(),
      detail: entry.detail.trim(),
      due: entry.due.trim(),
      owner: entry.owner.trim(),
      tone: entry.tone || 'info'
    }))
    .filter((entry) => entry.name && entry.detail && entry.due);

  const manualAudit = form.audit.manualTimeline
    .map((entry) => ({
      time: entry.time.trim(),
      event: entry.event.trim(),
      owner: entry.owner.trim(),
      status: entry.status.trim()
    }))
    .filter((entry) => entry.time && entry.event);

  return {
    metrics,
    charts,
    insights: { manual: manualInsights },
    timeline: { manual: manualTimeline },
    security: { manualSignals },
    automation: { manualBacklog },
    queues: {
      manualBoards,
      manualComplianceControls: manualControls
    },
    audit: { manualTimeline: manualAudit }
  };
}

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

function resolveDisputeSnapshotStatus(escalated, resolved) {
  if (escalated === 0 && resolved === 0) {
    return 'monitor';
  }
  if (resolved >= escalated) {
    return 'on_track';
  }
  const delta = escalated - resolved;
  if (delta >= 5) {
    return 'at_risk';
  }
  return 'monitor';
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

function formatJobStatus(status) {
  if (!status) return '—';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatJobTimestamp(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return dateTimeFormatter.format(date);
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return null;
  const last = new Date(timestamp);
  if (Number.isNaN(last.getTime())) return null;
  const diffMs = Date.now() - last.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return 'moments ago';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  const diffWeeks = Math.round(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  const diffMonths = Math.round(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  const diffYears = Math.round(diffDays / 365);
  return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
}

function buildAdminNavigation(payload, complianceContext = null) {
  if (!payload) {
    return { sections: [], sidebarLinks: [] };
  }

  const tiles = payload.metrics?.command?.tiles ?? [];
  const summary = payload.metrics?.command?.summary ?? {};
  const escrowTrend = payload.charts?.escrowTrend?.buckets ?? [];
  const escrowTargetLabel = payload.charts?.escrowTrend?.targetLabel ?? 'baseline targets';
  const disputeBreakdown = payload.charts?.disputeBreakdown?.buckets ?? [];
  const securitySignals = payload.security?.signals ?? [];
  const automationBacklog = payload.security?.automationBacklog ?? [];
  const legalSummary = payload.legal ?? null;
  const queueBoards = payload.queues?.boards ?? [];
  const complianceControls = payload.queues?.complianceControls ?? [];
  const inboxSummary = payload.inbox ?? null;
  const complianceRegistry = Array.isArray(complianceContext?.payload?.controls)
    ? complianceContext.payload.controls
    : [];
  const auditTimeline = payload.audit?.timeline ?? [];
  const customJobSummary = payload.customJobs?.summary ?? {};
  const buildCommandMetricsLink =
    typeof options.commandMetricsLink === 'function'
      ? options.commandMetricsLink
      : (view) => {
          const params = new URLSearchParams();
          params.set('panel', 'command-metrics');
          if (view) {
            params.set('view', view);
          }
          return `/admin/dashboard?${params.toString()}`;
        };
  const configRelative = summary.configUpdatedAt ? formatRelativeTime(summary.configUpdatedAt) : null;
  const manualInsights = Array.isArray(payload.overview?.manualInsights)
    ? payload.overview.manualInsights.filter((item) => typeof item === 'string' && item.trim().length > 0)
    : [];
  const manualUpcoming = Array.isArray(payload.overview?.manualUpcoming)
    ? payload.overview.manualUpcoming.filter(
        (entry) => entry && typeof entry.title === 'string' && typeof entry.when === 'string'
      )
    : [];

  const upcomingCompliance = (complianceRegistry.length
    ? complianceRegistry.map((control) => ({
        title: control.title,
        when: control.dueLabel ||
          (control.nextReviewAt ? new Date(control.nextReviewAt).toLocaleDateString() : 'Scheduled'),
        status: control.ownerTeam || control.owner?.name || 'Compliance Ops'
      }))
    : complianceControls.map((control) => ({
        title: control.name,
        when: control.due,
        status: control.owner
      })))
    .slice(0, 4);

  const { section: legalSection, sidebarLinks } = buildLegalAdminNavigation(legalSummary, helpers);

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
              description: `Escrow under management across the ${
                payload.timeframeLabel?.toLowerCase() ?? 'selected'
              } window versus ${escrowTargetLabel.toLowerCase()}.`,
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
      upcoming: upcomingCompliance,
      insights: [
        ...securitySignals.map((signal) => `${signal.label}: ${signal.valueLabel} • ${signal.caption}`),
        automationBacklog.length
          ? `Automation backlog tracking ${automationBacklog.length} initiative${automationBacklog.length === 1 ? '' : 's'}.`
          : null,
        ...manualInsights
      ].filter(Boolean)
    }
  };

  const commandMetrics = {
    id: 'command-metrics',
    label: 'Command metrics',
    description: 'Financial oversight, dispute momentum, and SLA adherence for the current operating window.',
    type: 'grid',
    data: {
      cards: (() => {
        const summaryNotes = Array.isArray(summary.notes) ? summary.notes : [];
        const baseDetails = [
          `Window: ${payload.timeframeLabel ?? '—'}`,
          `Escrow managed: ${summary.escrowTotalLabel ?? '—'}`,
          `Open disputes: ${summary.openDisputesLabel ?? '—'}`,
          `SLA compliance: ${summary.slaComplianceLabel ?? '—'}`,
          ...summaryNotes
        ];
        if (configRelative) {
          baseDetails.push(`Configuration saved ${configRelative}`);
        }

        const primaryCards = [
          {
            title: 'Operating window summary',
            accent: 'from-white via-sky-50 to-indigo-100/70',
            details: baseDetails
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
        ];

        const customCards = Array.isArray(payload.metrics?.command?.customCards)
          ? payload.metrics.command.customCards
          : [];

        const extended = customCards.map((card) => ({
          title: card.title,
          accent: resolveAccent(card.tone ?? 'info'),
          details: Array.isArray(card.details) ? card.details : [],
          mediaUrl: card.mediaUrl ?? null,
          mediaAlt: card.mediaAlt ?? card.title,
          cta: card.cta ?? null
        }));

        return [...primaryCards, ...extended];
      })()
    }
  };

  const commandMetricsAdmin = {
    id: 'command-metrics-admin',
    label: 'Command metrics configuration',
    description: 'Manage highlight notes, thresholds, and custom dashboard callouts for the command centre.',
    type: 'settings',
    data: {
      panels: [
        {
          id: 'command-metrics-config',
          title: 'Command metrics workspace',
          description: 'Everything required to keep the command centre insights accurate and actionable.',
          status: configRelative ? `Last saved ${configRelative}` : 'Awaiting first save',
          items: [
            {
              id: 'command-metrics-highlights',
              label: 'Operating window highlights',
              helper: 'Edit the guidance chips that appear above the operating window summary.',
              type: 'action',
              href: buildCommandMetricsLink('summary'),
              cta: 'Edit highlights'
            },
            {
              id: 'command-metrics-thresholds',
              label: 'Metric thresholds',
              helper: 'Adjust the targets that power the traffic-light states.',
              type: 'action',
              href: buildCommandMetricsLink('thresholds'),
              cta: 'Tune thresholds'
            },
            {
              id: 'command-metrics-cards',
              label: 'Custom dashboard cards',
              helper: 'Add contextual callouts and deep links for operators.',
              type: 'action',
              href: buildCommandMetricsLink('cards'),
              cta: 'Manage cards'
            }
          ]
        }
      ]
    }
  };

  const customJobsSection = {
    id: 'custom-job-operations',
    label: 'Custom jobs',
    icon: 'pipeline',
    description: 'Oversee bespoke briefs, bids, and provider negotiations.',
    type: 'settings',
    data: {
      panels: [
        {
          id: 'custom-job-console',
          title: 'Custom job console',
          description: 'Launch the dedicated workspace for bespoke work orders, bids, and awards.',
          items: [
            {
              id: 'open-briefs',
              label: 'Open briefs',
              helper: 'Live custom jobs awaiting fulfilment',
              value: `${(customJobSummary.openCount ?? 0).toLocaleString()} open`
            },
            {
              id: 'created-window',
              label: 'Briefs created',
              helper: `Within ${payload.timeframeLabel ?? 'current window'}`,
              value: `${(customJobSummary.createdInWindow ?? 0).toLocaleString()} new`
            },
            {
              id: 'active-bids',
              label: 'Active bids',
              helper: 'Negotiations in progress across briefs',
              value: `${(customJobSummary.activeBidCount ?? 0).toLocaleString()} active`
            },
            customJobSummary.latestUpdate
              ? {
                  id: 'latest-activity',
                  label: 'Latest activity',
                  helper: `Status: ${formatJobStatus(customJobSummary.latestUpdate.status)}`,
                  value: formatJobTimestamp(customJobSummary.latestUpdate.updatedAt)
                }
              : null,
            {
              id: 'launch-console',
              label: 'Management workspace',
              helper: 'Create briefs, review bids, exchange attachments, and award providers.',
              type: 'action',
              href: '/admin/custom-jobs',
              cta: 'Open console'
            }
          ].filter(Boolean)
        }
      ]
    }
  };

  const securitySection = {
    id: 'security-posture',
    label: 'Security & telemetry posture',
    description: 'Adoption, alerting, and ingestion health signals from the last 24 hours.',
    type: 'component',
    component: SecurityTelemetryWorkspace,
    data: {
      initialData: {
        timezone: 'Europe/London',
        updatedAt: payload.generatedAt,
        signals: securitySignals,
        automationTasks: payload.security?.automationBacklog ?? [],
        connectors: payload.security?.connectors ?? [],
        summary: payload.security?.summary ?? {},
        capabilities: payload.security?.capabilities ?? {}
      }
    }
  };

  const operationsBoards = queueBoards.map((board) => ({
    ...board,
    updates: (board.updates || []).map((update, index) =>
      typeof update === 'string'
        ? {
            id: `${board.id}-update-${index}`,
            headline: update,
            body: '',
            tone: 'info',
            recordedAt: null,
            attachments: []
          }
        : update
    )
  }));

  const operationsSection = {
    id: 'operations-queues',
    label: 'Operations queues',
    description: 'Owner updates from provider verification, dispute management, and insurance badge workflows.',
    type: 'operations-queues',
    icon: 'operations',
    data: {
      boards: operationsBoards,
      capabilities: payload.queues?.capabilities ?? null
    }
  };

  const disputeSnapshot = disputeBreakdown.map((bucket) => {
    const escalated = Number(bucket.escalated ?? 0);
    const resolved = Number(bucket.resolved ?? 0);
    return {
      id: bucket.id || bucket.label,
      label: bucket.label,
      escalated,
      resolved,
      commentary: disputeCommentary(escalated, resolved),
      status: resolveDisputeSnapshotStatus(escalated, resolved)
    };
  });

  const disputeSection = {
    id: 'dispute-health',
    label: 'Dispute health',
    description: 'Manage dispute cadence buckets, playbooks, and live resolution targets.',
    type: 'dispute-workspace',
    data: {
      snapshot: disputeSnapshot,
      defaultBucketId: options.defaultDisputeBucketId || undefined
    }
  };

  const complianceSection = complianceContext
    ? {
        id: 'compliance-controls',
        label: 'Compliance controls',
        description:
          'Control registry, evidence trail, and automation guardrails keeping Fixnado audit-ready across regions.',
        type: 'compliance-controls',
        icon: 'compliance',
        data: {
          loading: Boolean(complianceContext.loading),
          error: complianceContext.error,
          ...(complianceContext.payload || {})
        },
        actions: complianceContext.actions
      }
    : complianceControls.length
      ? {
          id: 'compliance-controls',
          label: 'Compliance controls',
          description: 'Expiring attestations and their current owners over the next 14 days.',
          type: 'list',
          icon: 'compliance',
          data: {
            items: complianceControls.map((control) => ({
              title: control.name,
              description: `${control.detail} • Owner: ${control.owner}`,
              status: `${control.due} • ${complianceStatusLabel(control.tone)}`
            }))
          }
        }
      : null;

  const automationSection = {
    id: 'automation-backlog',
    label: 'Automation backlog',
    description: 'AI and automation initiatives with their current readiness state.',
    type: 'automation',
    data: {
      items: automationBacklog,
      summary:
        automationBacklog.length > 0
          ? `Tracking ${automationBacklog.length} initiative${automationBacklog.length === 1 ? '' : 's'}`
          : 'No automation initiatives yet'
    }
  };

  const zoneGovernanceSection = {
    id: 'zone-governance',
    label: 'Zone governance',
    description: 'Launch the dedicated zone workspace to edit polygons, metadata, and service coverage.',
    type: 'settings',
    data: {
      panels: [
        {
          id: 'zone-governance-panel',
          title: 'Zone design & coverage',
          description: 'Draw polygons, manage dispatch guardrails, and attach services to live zones.',
          items: [
            {
              id: 'open-zone-workspace',
              label: 'Zone builder workspace',
              helper: 'Create, edit, and audit production-ready service zones.',
              type: 'action',
              cta: 'Open workspace',
              href: '/admin/zones'
            },
            {
              id: 'bulk-zone-import',
              label: 'Bulk GeoJSON ingestion',
              helper: 'Upload FeatureCollections with RBAC tags and automation policies.',
              type: 'action',
              cta: 'Launch importer',
              href: '/admin/zones#zone-bulk-import'
            }
          ]
        }
      ]
    }
  };
  const auditEvents = Array.isArray(payload.audit?.timeline?.events)
    ? payload.audit.timeline.events
    : [];
  const auditSummary = payload.audit?.timeline?.summary ?? {};

  const auditSection = {
    id: 'audit-log',
    label: 'Audit timeline',
    description: 'Manage manual audit checkpoints alongside system-generated controls.',
    icon: 'documents',
    type: 'audit-timeline',
    data: {
      events: auditEvents,
      summary: auditSummary,
      initialTimeframe: auditSummary.timeframe ?? payload.timeframe ?? DEFAULT_TIMEFRAME
    }
  };
  const monetisation = payload.platform?.monetisation;
  const monetisationSection = monetisation
    ? {
        id: 'monetisation-governance',
        label: 'Monetisation governance',
        description: 'Launch the monetisation control centre to govern commissions, subscriptions, and finance integrations.',
        type: 'settings',
        data: {
          panels: [
            {
              id: 'monetisation-console',
              title: 'Monetisation control centre',
              description: 'Keep commission structures, subscription packages, and Stripe/Escrow credentials aligned.',
              status: monetisation.commissionsEnabled ? 'Commissions active' : 'Commissions disabled',
              items: [
                {
                  id: 'launch-console',
                  label: 'Monetisation console',
                  helper: 'Adjust commission structures, subscription packages, and finance credentials.',
                  type: 'action',
                  href: '/admin/monetisation',
                  cta: 'Open console'
                },
                {
                  id: 'base-rate',
                  label: 'Default commission rate',
                  helper: 'Fallback platform share applied when no bespoke rule matches.',
                  value: monetisation.baseRateLabel
                },
                {
                  id: 'subscription-state',
                  label: 'Subscription state',
                  helper: monetisation.subscriptionEnabled ? 'Subscription gating enforced' : 'Subscriptions disabled',
                  value: `${monetisation.subscriptionCount ?? 0} packages`
                },
                {
                  id: 'integration-health',
                  label: 'Integration readiness',
                  helper: [
                    monetisation.stripeConnected ? 'Stripe linked' : 'Stripe pending',
                    monetisation.escrowConnected ? 'Escrow ready' : 'Escrow not configured',
                    monetisation.smtpReady ? 'SMTP ready' : 'SMTP pending',
                    monetisation.storageConfigured ? 'R2 storage connected' : 'Storage pending'
                  ].join(' • ')
                }
              ]
            }
          ]
        }
      }
    : null;

  const inboxSection = inboxSummary
    ? {
        id: 'inbox',
        label: 'Unified inbox',
        description: 'Queue health, SLA posture, and automation guardrails for communications.',
        type: 'settings',
        data: {
          panels: [
            {
              id: 'inbox-health',
              title: 'Inbox health',
              description: 'Monitor backlog, SLA breaches, and response times.',
              items: [
                {
                  id: 'inbox-backlog',
                  label: 'Backlog',
                  helper: 'Open conversations across queues',
                  type: 'value',
                  value: numberFormatter.format(inboxSummary.metrics?.backlog ?? 0)
                },
                {
                  id: 'inbox-awaiting',
                  label: 'Awaiting response',
                  helper: 'Threads where the last reply is from a participant',
                  type: 'value',
                  value: numberFormatter.format(inboxSummary.metrics?.awaitingResponse ?? 0)
                },
                {
                  id: 'inbox-breaches',
                  label: 'SLA breaches',
                  helper: 'Conversations exceeding queue SLA targets',
                  type: 'value',
                  value: numberFormatter.format(inboxSummary.metrics?.breachRisk ?? 0)
                },
                {
                  id: 'inbox-templates',
                  label: 'Active templates',
                  helper: 'Ready-to-send responses',
                  type: 'value',
                  value: numberFormatter.format(inboxSummary.metrics?.templatesActive ?? 0)
                },
                {
                  id: 'inbox-first-response',
                  label: 'Avg first response',
                  helper: 'Minutes to first agent reply',
                  type: 'value',
                  value:
                    inboxSummary.metrics?.averageFirstResponseMinutes != null
                      ? `${Number(inboxSummary.metrics.averageFirstResponseMinutes).toFixed(1)} min`
                      : 'Not enough data'
                }
              ]
            },
            {
              id: 'inbox-queues',
              title: 'Queue spotlight',
              description: 'Top queues by backlog and attention required.',
              items: (inboxSummary.queues ?? []).slice(0, 3).map((queue) => ({
                id: queue.id,
                label: queue.name,
                helper: `${numberFormatter.format(queue.awaitingResponse ?? 0)} awaiting • ${numberFormatter.format(queue.breachRisk ?? 0)} breaches`,
                value: `${numberFormatter.format(queue.backlog ?? 0)} open`
              }))
            },
            {
              id: 'inbox-automation',
              title: 'Automation & guardrails',
              description: 'Current routing and attachment guardrails.',
              items: [
                {
                  id: 'inbox-auto-assign',
                  label: 'Auto-assign',
                  helper: 'Automatically distribute new conversations',
                  type: 'toggle',
                  enabled: Boolean(inboxSummary.configuration?.autoAssignEnabled)
                },
                {
                  id: 'inbox-attachments',
                  label: 'Attachments',
                  helper: `${inboxSummary.configuration?.maxAttachmentMb ?? 0}MB • ${(inboxSummary.configuration?.allowedFileTypes ?? ['jpg', 'png', 'pdf']).join(', ')}`,
                  type: 'toggle',
                  enabled: Boolean(inboxSummary.configuration?.attachmentsEnabled)
                },
                {
                  id: 'inbox-ai-assist',
                  label: 'AI assist',
                  helper:
                    inboxSummary.configuration?.aiAssistEnabled
                      ? `Provider: ${inboxSummary.configuration?.aiAssistProvider || 'configured'}`
                      : 'Disabled',
                  type: 'toggle',
                  enabled: Boolean(inboxSummary.configuration?.aiAssistEnabled)
                },
                {
                  id: 'inbox-quiet-hours',
                  label: 'Quiet hours',
                  helper: inboxSummary.configuration?.quietHours || 'Not configured',
                  type: 'value',
                  value: inboxSummary.configuration?.quietHours || 'Not configured'
                },
                {
                  id: 'inbox-manage',
                  label: 'Inbox administration',
                  helper: 'Open the inbox control workspace to edit queues and templates',
                  type: 'action',
                  cta: 'Manage inbox',
                  href: '/admin/inbox'
                }
              ]
            }
          ]
        }
      }
    : null;

  const upcomingManualEntries = manualUpcoming.slice(0, 4).map((entry) => ({
    title: entry.title,
    when: entry.when,
    status: entry.status || 'Manual'
  }));

  if (upcomingManualEntries.length) {
    overview.analytics.upcoming = [...overview.analytics.upcoming, ...upcomingManualEntries];
  }

  const sections = [
    overview,
    commandMetrics,
    commandMetricsAdmin,
    securitySection,
    operationsSection,
    disputeSection,
    complianceSection,
    inboxSection,
    legalSection,
    automationSection,
    zoneGovernanceSection,
    monetisationSection,
    auditSection
  ].filter(Boolean);

  sections.push({
    id: 'blog-management',
    label: 'Blog management',
    description: 'Create, schedule, and audit Fixnado editorial content from a dedicated workspace.',
    icon: 'documents',
    type: 'settings',
    data: {
      panels: [
        {
          id: 'blog-console-entry',
          title: 'Editorial workspace',
          description: 'Launch the production blog console to compose posts, manage taxonomy, and review revisions.',
          items: [
            {
              id: 'open-blog-console',
              label: 'Blog workspace',
              helper: 'Full CRUD tooling for posts, categories, tags, and revision history.',
              type: 'action',
              href: '/admin/blog',
              cta: 'Open workspace'
            }
          ]
        }
      ]
    }
  });

  const extraSidebarLinks = [
    {
      id: 'escrow-console-link',
      label: 'Escrow management',
      description: 'Manual overrides, release approvals, and dispute controls.',
      type: 'link',
      icon: 'finance',
      href: '/admin/escrows'
    },
    {
      id: 'settings-preferences-link',
      label: 'Settings & preferences',
      description: 'Configure admin workspace defaults and escalation controls.',
      type: 'link',
      icon: 'settings',
      href: '/admin/preferences'
    },
    {
      id: 'appearance-management-link',
      label: 'Appearance management',
      description: 'Govern admin look & feel, brand assets, and marketing variants.',
      type: 'link',
      icon: 'assets',
      href: '/admin/appearance'
    },
    {
      id: 'admin-rentals-link',
      label: 'Rental management',
      description: 'Open the dedicated rental operations workspace.',
      type: 'link',
      icon: 'assets',
      href: '/admin/rentals'
    },
    {
      id: 'system-settings-link',
      label: 'System settings',
      description: 'Configure email, storage, and integration credentials.',
      type: 'link',
      icon: 'settings',
      href: '/admin/system-settings'
    }
  ];

  return {
    sections,
    sidebarLinks: [...sidebarLinks, ...extraSidebarLinks]
  };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAdminSession();
  const roleMeta = useMemo(() => DASHBOARD_ROLES.find((role) => role.id === 'admin'), []);
  const registeredRoles = useMemo(() => DASHBOARD_ROLES.filter((role) => role.registered), []);
  const [searchParams, setSearchParams] = useSearchParams();
  const timeframeParam = searchParams.get('timeframe') ?? DEFAULT_TIMEFRAME;
  const focusSectionId = searchParams.get('focus');
  const disputeBucketIdParam = searchParams.get('bucket');
  const panelParam = searchParams.get('panel');
  const viewParam = searchParams.get('view') ?? 'summary';
  const focusParam = searchParams.get('focus');
  const [timeframe, setTimeframe] = useState(timeframeParam);
  const [state, setState] = useState({ loading: true, data: null, meta: null, error: null });
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [affiliateState, setAffiliateState] = useState({ loading: true, data: null, error: null });
  const [providerState, setProviderState] = useState({
    loading: false,
    error: null,
    list: [],
    summary: null,
    enums: {},
    pagination: null,
    detailLoading: false,
    detailError: null,
    selectedId: null,
    selected: null
  });
  const [profileState, setProfileState] = useState({
    loading: true,
    saving: false,
    data: null,
    error: null,
    success: null
  });
  const configuratorOpen = panelParam === 'command-metrics';
  const [enterpriseSnapshot, setEnterpriseSnapshot] = useState({
    loading: true,
    summary: DEFAULT_SUMMARY,
    error: null
  });
  const [serviceState, setServiceState] = useState({ loading: true, data: null, error: null });
  const [complianceState, setComplianceState] = useState({ loading: true, error: null, payload: null });
  const [overviewSettings, setOverviewSettings] = useState(null);
  const [overviewSettingsForm, setOverviewSettingsForm] = useState(null);
  const [overviewSettingsLoading, setOverviewSettingsLoading] = useState(true);
  const [overviewSettingsLoadError, setOverviewSettingsLoadError] = useState(null);
  const [overviewSettingsSaving, setOverviewSettingsSaving] = useState(false);
  const [overviewSettingsFormError, setOverviewSettingsFormError] = useState(null);
  const [overviewSettingsSuccess, setOverviewSettingsSuccess] = useState(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  useEffect(() => {
    setTimeframe(timeframeParam);
  }, [timeframeParam]);

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

  const handleProviderAuthError = useCallback(
    async (error) => {
      if (error instanceof PanelApiError && (error.status === 401 || error.status === 403)) {
        await logout();
        navigate('/admin', {
          replace: true,
          state: { reason: 'sessionExpired', from: { pathname: '/admin/dashboard' } }
        });
        return true;
      }
      return false;
    },
    [logout, navigate]
  );

  const loadProviderDirectory = useCallback(
    async ({ signal, forceRefresh = false } = {}) => {
      setProviderState((current) => ({ ...current, loading: true, error: null }));
      try {
        const directory = await getAdminProviderDirectory({ signal, forceRefresh });
        setProviderState((current) => ({
          ...current,
          loading: false,
          error: null,
          list: directory.providers ?? [],
          summary: directory.summary ?? null,
          enums: directory.enums ?? {},
          pagination: directory.pagination ?? null
        }));
        return directory;
      } catch (error) {
        if (signal?.aborted || error?.name === 'AbortError') {
          setProviderState((current) => ({ ...current, loading: false }));
          return null;
        }
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to load providers', error?.status ?? 500, { cause: error });
        await handleProviderAuthError(panelError);
        setProviderState((current) => ({ ...current, loading: false, error: panelError }));
        return null;
      }
    },
    [handleProviderAuthError]
  );

  const loadProviderDetail = useCallback(
    async (companyId, { signal, forceRefresh = false } = {}) => {
      if (!companyId) {
        return null;
      }
      setProviderState((current) => ({ ...current, detailLoading: true, detailError: null, selectedId: companyId }));
      try {
        const detail = await getAdminProviderDetail({ companyId, signal, forceRefresh });
        setProviderState((current) => ({
          ...current,
          detailLoading: false,
          detailError: null,
          selectedId: companyId,
          selected: detail
        }));
        return detail;
      } catch (error) {
        if (signal?.aborted || error?.name === 'AbortError') {
          setProviderState((current) => ({ ...current, detailLoading: false }));
          return null;
        }
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to load provider detail', error?.status ?? 500, { cause: error });
        await handleProviderAuthError(panelError);
        setProviderState((current) => ({
          ...current,
          detailLoading: false,
          detailError: panelError,
          selectedId: companyId
        }));
        return null;
      }
    },
    [handleProviderAuthError]
  );

  const loadServiceManagement = useCallback(
    async ({ signal, silent = false } = {}) => {
      setServiceState((current) => ({
        ...current,
        loading: true,
        error: silent ? current.error : null
      }));

      try {
        const snapshot = await getAdminServiceSummary({ signal });
        setServiceState({ loading: false, data: snapshot, error: null });
        return snapshot;
      } catch (error) {
        if (signal?.aborted || error?.name === 'AbortError') {
          return null;
        }

        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to load service management', error?.status ?? 500, {
                cause: error
              });

        setServiceState((current) => ({ ...current, loading: false, error: panelError }));
        throw panelError;
      }
    },
    []
  );

  const loadComplianceControls = useCallback(
    async ({ signal } = {}) => {
      setComplianceState((current) => ({ ...current, loading: true, error: null }));
      try {
        const payload = await fetchComplianceControls({ signal });
        setComplianceState({ loading: false, error: null, payload });
      } catch (error) {
        if (signal?.aborted || error?.name === 'AbortError') {
          return;
        }
        setComplianceState((current) => ({ ...current, loading: false, error, payload: current.payload }));
      }
    },
    []
  );

  const handleCreateControl = useCallback(
    async (payload) => {
      await createComplianceControlRequest(payload);
      await loadComplianceControls();
    },
    [loadComplianceControls]
  );

  const handleUpdateControl = useCallback(
    async (controlId, payload) => {
      await updateComplianceControlRequest(controlId, payload);
      await loadComplianceControls();
    },
    [loadComplianceControls]
  );

  const handleDeleteControl = useCallback(
    async (controlId) => {
      await deleteComplianceControlRequest(controlId);
      await loadComplianceControls();
    },
    [loadComplianceControls]
  );

  const handleUpdateAutomation = useCallback(async (settings) => {
    const updated = await updateComplianceAutomation(settings);
    setComplianceState((current) => ({
      ...current,
      payload: current.payload
        ? { ...current.payload, automation: updated }
        : {
            controls: [],
            summary: { total: 0, overdue: 0, dueSoon: 0, monitoring: 0 },
            filters: { statuses: [], categories: [], reviewFrequencies: [], controlTypes: [], ownerTeams: [] },
            evidence: [],
            exceptions: [],
            automation: updated
          }
    }));
    return updated;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard({ signal: controller.signal, timeframe });
    return () => controller.abort();
  }, [loadDashboard, timeframe]);

  useEffect(() => {
    const controller = new AbortController();
    loadServiceManagement({ signal: controller.signal }).catch(() => {});
    return () => controller.abort();
  }, [loadServiceManagement]);

  useEffect(() => {
    if (!state.data?.serviceManagement) {
      return;
    }

    setServiceState((current) => {
      if (current.data && !current.loading) {
        return current;
      }
      return { loading: false, data: state.data.serviceManagement, error: null };
    });
  }, [state.data]);

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

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const directory = await loadProviderDirectory({ signal: controller.signal });
      if (!directory?.providers?.length) {
        return;
      }
      const firstId = directory.providers[0]?.id;
      if (!firstId) {
        return;
      }
      let shouldFetchDetail = false;
      setProviderState((current) => {
        if (current.selectedId) {
          return current;
        }
        shouldFetchDetail = true;
        return { ...current, selectedId: firstId };
      });
      if (shouldFetchDetail) {
        await loadProviderDetail(firstId, { signal: controller.signal });
      }
    })();
    return () => controller.abort();
  }, [loadProviderDirectory, loadProviderDetail]);
  const loadProfileSettings = useCallback(async () => {
    setProfileState((current) => ({ ...current, loading: true, error: null, success: null }));
    try {
      const payload = await getAdminProfileSettings();
      setProfileState({ loading: false, saving: false, data: payload, error: null, success: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load profile settings';
      setProfileState((current) => ({ ...current, loading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    loadProfileSettings();
  }, [loadProfileSettings]);

  const handleProfileSave = useCallback(
    async (payload) => {
      setProfileState((current) => ({ ...current, saving: true, error: null, success: null }));
      try {
        const updated = await updateAdminProfileSettings(payload);
        setProfileState({ loading: false, saving: false, data: updated, error: null, success: 'Profile settings saved' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save profile settings';
        setProfileState((current) => ({ ...current, saving: false, error: message }));
        throw (error instanceof Error ? error : new Error(message));
      }
    },
    []
  );

  const handleDelegateCreate = useCallback(
    async (payload) => {
      setProfileState((current) => ({ ...current, saving: true, error: null, success: null }));
      try {
        const delegate = await createAdminDelegate(payload);
        setProfileState((current) => {
          const now = new Date().toISOString();
          const base = current.data
            ? {
                profile: { ...current.data.profile },
                address: { ...current.data.address },
                notifications: {
                  ...DEFAULT_PROFILE_PAYLOAD.notifications,
                  ...(current.data.notifications ?? {})
                },
                notificationEmails: Array.isArray(current.data.notificationEmails)
                  ? current.data.notificationEmails.slice()
                  : [],
                delegates: Array.isArray(current.data.delegates)
                  ? current.data.delegates.slice()
                  : [],
                audit: { ...(current.data.audit ?? {}) }
              }
            : JSON.parse(JSON.stringify(DEFAULT_PROFILE_PAYLOAD));
          const existingDelegates = Array.isArray(base.delegates) ? base.delegates : [];
          const nextDelegates = existingDelegates.some((item) => item.id === delegate.id)
            ? existingDelegates.map((item) => (item.id === delegate.id ? delegate : item))
            : [...existingDelegates, delegate];
          return {
            ...current,
            saving: false,
            loading: false,
            data: {
              ...base,
              delegates: nextDelegates,
              audit: { ...(base.audit ?? {}), updatedAt: now }
            },
            error: null,
            success: 'Delegate added'
          };
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add delegate';
        setProfileState((current) => ({ ...current, saving: false, error: message }));
        throw (error instanceof Error ? error : new Error(message));
      }
    },
    []
  );

  const handleDelegateUpdate = useCallback(
    async (delegateId, payload) => {
      setProfileState((current) => ({ ...current, saving: true, error: null, success: null }));
      try {
        const delegate = await updateAdminDelegate(delegateId, payload);
        setProfileState((current) => {
          const now = new Date().toISOString();
          if (!current.data) {
            return {
              ...current,
              saving: false,
              loading: false,
              data: {
                ...JSON.parse(JSON.stringify(DEFAULT_PROFILE_PAYLOAD)),
                delegates: [delegate],
                audit: { updatedAt: now }
              },
              error: null,
              success: 'Delegate updated'
            };
          }
          const nextDelegates = (current.data.delegates ?? []).map((item) =>
            item.id === delegate.id ? delegate : item
          );
          return {
            ...current,
            saving: false,
            loading: false,
            data: {
              ...current.data,
              delegates: nextDelegates,
              audit: { ...(current.data.audit ?? {}), updatedAt: now }
            },
            error: null,
            success: 'Delegate updated'
          };
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update delegate';
        setProfileState((current) => ({ ...current, saving: false, error: message }));
        throw (error instanceof Error ? error : new Error(message));
      }
    },
    []
  );

  const handleDelegateDelete = useCallback(
    async (delegateId) => {
      setProfileState((current) => ({ ...current, saving: true, error: null, success: null }));
      try {
        await deleteAdminDelegate(delegateId);
        setProfileState((current) => {
          if (!current.data) {
            return { ...current, saving: false, loading: false, error: null, success: 'Delegate removed' };
          }
          const now = new Date().toISOString();
          const nextDelegates = (current.data.delegates ?? []).filter((item) => item.id !== delegateId);
          return {
            ...current,
            saving: false,
            loading: false,
            data: {
              ...current.data,
              delegates: nextDelegates,
              audit: { ...(current.data.audit ?? {}), updatedAt: now }
            },
            error: null,
            success: 'Delegate removed'
          };
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove delegate';
        setProfileState((current) => ({ ...current, saving: false, error: message }));
        throw (error instanceof Error ? error : new Error(message));
      }
    },
    []
  );

  const affiliateSection = useMemo(() => buildAffiliateGovernanceSection(affiliateState), [affiliateState]);
  const profileSettingsSection = useMemo(
    () => ({
      id: 'profile-settings-control',
      label: 'Profile settings',
      description: 'Identity, addresses, notifications, and delegate controls.',
      icon: 'profile',
      type: 'custom',
      render: () => (
        <AdminProfileSettingsPanel
          data={profileState.data}
          loading={profileState.loading}
          saving={profileState.saving}
          error={profileState.error}
          success={profileState.success}
          onRefresh={loadProfileSettings}
          onSubmit={handleProfileSave}
          onCreateDelegate={handleDelegateCreate}
          onUpdateDelegate={handleDelegateUpdate}
          onDeleteDelegate={handleDelegateDelete}
        />
      )
    }),
    [
      profileState,
      loadProfileSettings,
      handleProfileSave,
      handleDelegateCreate,
      handleDelegateUpdate,
      handleDelegateDelete
    ]
  );
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const payload = await listEnterpriseAccounts({ includeArchived: true, signal: controller.signal });
        setEnterpriseSnapshot({
          loading: false,
          summary: { ...DEFAULT_SUMMARY, ...payload.summary },
          error: null
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'Unable to load enterprise snapshot';
        setEnterpriseSnapshot({ loading: false, summary: DEFAULT_SUMMARY, error: message });
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadComplianceControls({ signal: controller.signal });
    return () => controller.abort();
  }, [loadComplianceControls]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    (async () => {
      setOverviewSettingsLoading(true);
      setOverviewSettingsLoadError(null);
      try {
        const settings = await fetchAdminDashboardOverviewSettings({ signal: controller.signal });
        if (!isMounted) return;
        setOverviewSettings(settings);
      } catch (error) {
        if (controller.signal.aborted || !isMounted) return;
        const message = error instanceof Error ? error.message : 'Failed to load overview settings';
        setOverviewSettingsLoadError(message);
      } finally {
        if (!isMounted) return;
        setOverviewSettingsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!overviewSettings || settingsModalOpen) {
      return;
    }
    setOverviewSettingsForm(buildFormState(overviewSettings));
  }, [overviewSettings, settingsModalOpen]);
  const userManagementSection = useMemo(
    () => ({
      id: 'user-management',
      label: 'User management',
      description: 'Provision, audit, and secure Fixnado accounts across roles.',
      type: 'user-management',
      icon: 'users'
    }),
    []
  );

  const handleSelectProvider = useCallback(
    async (companyId) => {
      if (!companyId) {
        return;
      }
      let shouldFetch = true;
      setProviderState((current) => {
        if (current.selectedId === companyId && current.selected && !current.detailError) {
          shouldFetch = false;
          return current;
        }
        return { ...current, selectedId: companyId };
      });
      if (shouldFetch) {
        await loadProviderDetail(companyId);
      }
    },
    [loadProviderDetail]
  );

  const handleRefreshProviderDirectory = useCallback(
    async () => {
      const directory = await loadProviderDirectory({ forceRefresh: true });
      if (!directory) {
        return;
      }
      let nextSelectedId = null;
      setProviderState((current) => {
        const providerIds = new Set((directory.providers ?? []).map((provider) => provider.id));
        const fallbackId = directory.providers?.[0]?.id ?? null;
        nextSelectedId = current.selectedId && providerIds.has(current.selectedId) ? current.selectedId : fallbackId;
        if (!nextSelectedId) {
          return { ...current, selectedId: null, selected: null, detailError: null };
        }
        return { ...current, selectedId: nextSelectedId };
      });
      if (nextSelectedId) {
        await loadProviderDetail(nextSelectedId, { forceRefresh: true });
      }
    },
    [loadProviderDirectory, loadProviderDetail]
  );

  const handleCreateProvider = useCallback(
    async (payload) => {
      try {
        const detail = await createAdminProvider(payload);
        const companyId = detail?.company?.id ?? null;
        if (companyId) {
          setProviderState((current) => ({ ...current, selectedId: companyId, selected: detail, detailError: null }));
        }
        await loadProviderDirectory({ forceRefresh: true });
        if (companyId) {
          await loadProviderDetail(companyId, { forceRefresh: true });
        }
        return detail;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to create provider', error?.status ?? 500, { cause: error });
        await handleProviderAuthError(panelError);
        throw panelError;
      }
    },
    [loadProviderDirectory, loadProviderDetail, handleProviderAuthError]
  );

  const handleUpdateProvider = useCallback(
    async (companyId, payload) => {
      try {
        const detail = await updateAdminProvider(companyId, payload);
        setProviderState((current) => {
          if (current.selectedId !== companyId) {
            return current;
          }
          return { ...current, selected: detail, detailError: null };
        });
        await loadProviderDirectory({ forceRefresh: true });
        return detail;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to update provider', error?.status ?? 500, { cause: error });
        await handleProviderAuthError(panelError);
        throw panelError;
      }
    },
    [loadProviderDirectory, handleProviderAuthError]
  );

  const handleUpsertProviderContact = useCallback(
    async (companyId, contactId, payload) => {
      try {
        const result = await upsertAdminProviderContact(companyId, contactId, payload);
        await loadProviderDetail(companyId, { forceRefresh: true });
        await loadProviderDirectory({ forceRefresh: true });
        return result;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to save contact', error?.status ?? 500, { cause: error });
        await handleProviderAuthError(panelError);
        throw panelError;
      }
    },
    [loadProviderDetail, loadProviderDirectory, handleProviderAuthError]
  );

  const handleDeleteProviderContact = useCallback(
    async (companyId, contactId) => {
      try {
        await deleteAdminProviderContact(companyId, contactId);
        await loadProviderDetail(companyId, { forceRefresh: true });
        await loadProviderDirectory({ forceRefresh: true });
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to delete contact', error?.status ?? 500, { cause: error });
        await handleProviderAuthError(panelError);
        throw panelError;
      }
    },
    [loadProviderDetail, loadProviderDirectory, handleProviderAuthError]
  );

  const handleUpsertProviderCoverage = useCallback(
    async (companyId, coverageId, payload) => {
      try {
        const result = await upsertAdminProviderCoverage(companyId, coverageId, payload);
        await loadProviderDetail(companyId, { forceRefresh: true });
        await loadProviderDirectory({ forceRefresh: true });
        return result;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to save coverage', error?.status ?? 500, { cause: error });
        await handleProviderAuthError(panelError);
        throw panelError;
      }
    },
    [loadProviderDetail, loadProviderDirectory, handleProviderAuthError]
  );

  const handleDeleteProviderCoverage = useCallback(
    async (companyId, coverageId) => {
      try {
        await deleteAdminProviderCoverage(companyId, coverageId);
        await loadProviderDetail(companyId, { forceRefresh: true });
        await loadProviderDirectory({ forceRefresh: true });
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to delete coverage', error?.status ?? 500, { cause: error });
        await handleProviderAuthError(panelError);
        throw panelError;
      }
    },
    [loadProviderDetail, loadProviderDirectory, handleProviderAuthError]
  );

  const handleArchiveProvider = useCallback(
    async (companyId, payload) => {
      try {
        const result = await archiveAdminProvider(companyId, payload);
        await loadProviderDirectory({ forceRefresh: true });
        setProviderState((current) => ({
          ...current,
          selectedId: companyId,
          selected: result,
          detailError: null,
          detailLoading: false
        }));
        return result;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to archive provider', error?.status ?? 500, { cause: error });
        await handleProviderAuthError(panelError);
        throw panelError;
      }
    },
    [loadProviderDirectory, handleProviderAuthError]
  );

  const handleUpdateProviderTaxProfile = useCallback(
    async (companyId, payload) => {
      try {
        const result = await updateAdminProviderTaxProfile(companyId, payload);
        await loadProviderDetail(companyId, { forceRefresh: true });
        return result;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to update tax profile', error?.status ?? 500, { cause: error });
        await handleProviderAuthError(panelError);
        throw panelError;
      }
    },
    [loadProviderDetail, handleProviderAuthError]
  );

  const handleFetchComplianceSummary = useCallback(
    async (companyId, options = {}) => {
      try {
        return await getProviderComplianceSummary(companyId, options);
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to load compliance summary', error?.status ?? 500, { cause: error });
        await handleProviderAuthError(panelError);
        throw panelError;
      }
    },
    [handleProviderAuthError]
  );

  const handleCreateProviderTaxFiling = useCallback(
    async (companyId, payload) => {
      try {
        const result = await createAdminProviderTaxFiling(companyId, payload);
        await loadProviderDetail(companyId, { forceRefresh: true });
        return result;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to create tax filing', error?.status ?? 500, { cause: error });
        await handleProviderAuthError(panelError);
        throw panelError;
      }
    },
    [loadProviderDetail, handleProviderAuthError]
  );

  const handleSubmitComplianceDocument = useCallback(
    async (companyId, payload) => {
      try {
        const document = await submitProviderComplianceDocument({ ...payload, companyId });
        await Promise.all([
          loadProviderDetail(companyId, { forceRefresh: true }),
          loadProviderDirectory({ forceRefresh: true })
        ]);
        return document;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to upload document', error?.status ?? 500, { cause: error });
        await handleProviderAuthError(panelError);
        throw panelError;
      }
    },
    [loadProviderDetail, loadProviderDirectory, handleProviderAuthError]
  );

  const handleReviewComplianceDocument = useCallback(
    async (companyId, documentId, payload) => {
      try {
        const document = await reviewProviderComplianceDocument(documentId, payload);
        await Promise.all([
          loadProviderDetail(companyId, { forceRefresh: true }),
          loadProviderDirectory({ forceRefresh: true })
        ]);
        return document;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to review document', error?.status ?? 500, { cause: error });
        await handleProviderAuthError(panelError);
        throw panelError;
      }
    },
    [loadProviderDetail, loadProviderDirectory, handleProviderAuthError]
  );

  const handleUpdateProviderTaxFiling = useCallback(
    async (companyId, filingId, payload) => {
      try {
        const result = await updateAdminProviderTaxFiling(companyId, filingId, payload);
        await loadProviderDetail(companyId, { forceRefresh: true });
        return result;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to update tax filing', error?.status ?? 500, { cause: error });
        await handleProviderAuthError(panelError);
        throw panelError;
      }
    },
    [loadProviderDetail, handleProviderAuthError]
  );

  const handleEvaluateCompliance = useCallback(
    async (companyId, payload = {}) => {
      try {
        const application = await evaluateProviderCompliance(companyId, payload);
        await Promise.all([
          loadProviderDetail(companyId, { forceRefresh: true }),
          loadProviderDirectory({ forceRefresh: true })
        ]);
        return application;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to evaluate compliance', error?.status ?? 500, { cause: error });
        await handleProviderAuthError(panelError);
        throw panelError;
      }
    },
    [loadProviderDetail, loadProviderDirectory, handleProviderAuthError]
  );

  const handleDeleteProviderTaxFiling = useCallback(
    async (companyId, filingId) => {
      try {
        await deleteAdminProviderTaxFiling(companyId, filingId);
        await loadProviderDetail(companyId, { forceRefresh: true });
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to delete tax filing', error?.status ?? 500, { cause: error });
        await handleProviderAuthError(panelError);
        throw panelError;
      }
    },
    [loadProviderDetail, handleProviderAuthError]
  );

  const handleToggleBadgeVisibility = useCallback(
    async (companyId, visible, actorId = null) => {
      try {
        const application = await toggleProviderBadge(companyId, { visible, actorId });
        await Promise.all([
          loadProviderDetail(companyId, { forceRefresh: true }),
          loadProviderDirectory({ forceRefresh: true })
        ]);
        return application;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to update badge visibility', error?.status ?? 500, { cause: error });
        await handleProviderAuthError(panelError);
        throw panelError;
      }
    },
    [loadProviderDetail, loadProviderDirectory, handleProviderAuthError]
  );

  const handleSuspendProviderCompliance = useCallback(
    async (companyId, payload) => {
      try {
        const application = await suspendProviderCompliance(companyId, payload);
        await Promise.all([
          loadProviderDetail(companyId, { forceRefresh: true }),
          loadProviderDirectory({ forceRefresh: true })
        ]);
        return application;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to suspend provider compliance', error?.status ?? 500, { cause: error });
        await handleProviderAuthError(panelError);
        throw panelError;
      }
    },
    [loadProviderDetail, loadProviderDirectory, handleProviderAuthError]
  );

  const providerHandlers = useMemo(
    () => ({
      onRefreshDirectory: handleRefreshProviderDirectory,
      onSelectProvider: handleSelectProvider,
      onCreateProvider: handleCreateProvider,
      onUpdateProvider: handleUpdateProvider,
      onUpsertContact: handleUpsertProviderContact,
      onDeleteContact: handleDeleteProviderContact,
      onUpsertCoverage: handleUpsertProviderCoverage,
      onDeleteCoverage: handleDeleteProviderCoverage,
      onArchiveProvider: handleArchiveProvider,
      onUpdateTaxProfile: handleUpdateProviderTaxProfile,
      onCreateTaxFiling: handleCreateProviderTaxFiling,
      onUpdateTaxFiling: handleUpdateProviderTaxFiling,
      onDeleteTaxFiling: handleDeleteProviderTaxFiling,
      onFetchComplianceSummary: handleFetchComplianceSummary,
      onSubmitComplianceDocument: handleSubmitComplianceDocument,
      onReviewComplianceDocument: handleReviewComplianceDocument,
      onEvaluateCompliance: handleEvaluateCompliance,
      onToggleComplianceBadge: handleToggleBadgeVisibility,
      onSuspendCompliance: handleSuspendProviderCompliance
    }),
    [
      handleRefreshProviderDirectory,
      handleSelectProvider,
      handleCreateProvider,
      handleUpdateProvider,
      handleUpsertProviderContact,
      handleDeleteProviderContact,
      handleUpsertProviderCoverage,
      handleDeleteProviderCoverage,
      handleArchiveProvider,
      handleUpdateProviderTaxProfile,
      handleCreateProviderTaxFiling,
      handleUpdateProviderTaxFiling,
      handleDeleteProviderTaxFiling,
      handleFetchComplianceSummary,
      handleSubmitComplianceDocument,
      handleReviewComplianceDocument,
      handleEvaluateCompliance,
      handleToggleBadgeVisibility,
      handleSuspendProviderCompliance
    ]
  );

  const providerSection = useMemo(() => {
    const directoryEnums = providerState.enums ?? {};
    const detailEnums = providerState.selected?.enums ?? {};
    const mergedEnums = {
      ...directoryEnums,
      ...detailEnums,
      statuses: detailEnums.statuses ?? directoryEnums.statuses ?? [],
      onboardingStages: detailEnums.onboardingStages ?? directoryEnums.onboardingStages ?? [],
      tiers: detailEnums.tiers ?? directoryEnums.tiers ?? [],
      riskLevels: detailEnums.riskLevels ?? directoryEnums.riskLevels ?? [],
      coverageTypes: detailEnums.coverageTypes ?? directoryEnums.coverageTypes ?? [],
      insuredStatuses: detailEnums.insuredStatuses ?? directoryEnums.insuredStatuses ?? [],
      regions: directoryEnums.regions ?? [],
      zones: detailEnums.zones ?? []
    };

    return {
      id: 'provider-management',
      label: 'SME / provider management',
      description:
        'Onboard, update, and monitor Fixnado SMEs with live coverage, contact ownership, and compliance records.',
      icon: 'provider',
      type: 'provider-management',
      data: {
        loading: providerState.loading,
        list: providerState.list,
        summary: providerState.summary,
        enums: mergedEnums,
        error: providerState.error,
        detailLoading: providerState.detailLoading,
        detailError: providerState.detailError,
        selected: providerState.selected,
        selectedId: providerState.selectedId,
        handlers: providerHandlers
      }
    };
  }, [providerState, providerHandlers]);

  const enterpriseSection = useMemo(() => buildEnterpriseLaunchpad(enterpriseSnapshot), [enterpriseSnapshot]);

  const handleServiceRefresh = useCallback(() => {
    loadServiceManagement().catch((error) => {
      console.error('[AdminDashboard] Service management refresh failed', error);
    });
  }, [loadServiceManagement]);

  const handleCreateCategory = useCallback(
    async (input) => {
      try {
        const category = await createAdminServiceCategory(input);
        await loadServiceManagement({ silent: true }).catch((error) => {
          console.error('[AdminDashboard] Failed to refresh after creating category', error);
        });
        return category;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to create service category', error?.status ?? 500, { cause: error });
        throw panelError;
      }
    },
    [loadServiceManagement]
  );

  const handleUpdateCategory = useCallback(
    async (categoryId, updates) => {
      try {
        const category = await updateAdminServiceCategory(categoryId, updates);
        await loadServiceManagement({ silent: true }).catch((error) => {
          console.error('[AdminDashboard] Failed to refresh after updating category', error);
        });
        return category;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to update service category', error?.status ?? 500, { cause: error });
        throw panelError;
      }
    },
    [loadServiceManagement]
  );

  const handleArchiveCategory = useCallback(
    async (categoryId) => {
      try {
        const category = await archiveAdminServiceCategory(categoryId);
        await loadServiceManagement({ silent: true }).catch((error) => {
          console.error('[AdminDashboard] Failed to refresh after archiving category', error);
        });
        return category;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to archive service category', error?.status ?? 500, { cause: error });
        throw panelError;
      }
    },
    [loadServiceManagement]
  );

  const handleCreateListing = useCallback(
    async (input) => {
      try {
        const listing = await createAdminServiceListing(input);
        await loadServiceManagement({ silent: true }).catch((error) => {
          console.error('[AdminDashboard] Failed to refresh after creating listing', error);
        });
        return listing;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to create service listing', error?.status ?? 500, { cause: error });
        throw panelError;
      }
    },
    [loadServiceManagement]
  );

  const handleUpdateListing = useCallback(
    async (serviceId, updates) => {
      try {
        const listing = await updateAdminServiceListing(serviceId, updates);
        await loadServiceManagement({ silent: true }).catch((error) => {
          console.error('[AdminDashboard] Failed to refresh after updating listing', error);
        });
        return listing;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to update service listing', error?.status ?? 500, { cause: error });
        throw panelError;
      }
    },
    [loadServiceManagement]
  );

  const handleUpdateListingStatus = useCallback(
    async (serviceId, status) => {
      try {
        const listing = await updateAdminServiceListingStatus(serviceId, status);
        await loadServiceManagement({ silent: true }).catch((error) => {
          console.error('[AdminDashboard] Failed to refresh after updating listing status', error);
        });
        return listing;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to update listing status', error?.status ?? 500, { cause: error });
        throw panelError;
      }
    },
    [loadServiceManagement]
  );

  const handleArchiveListing = useCallback(
    async (serviceId) => {
      try {
        const listing = await archiveAdminServiceListing(serviceId);
        await loadServiceManagement({ silent: true }).catch((error) => {
          console.error('[AdminDashboard] Failed to refresh after archiving listing', error);
        });
        return listing;
      } catch (error) {
        const panelError =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to archive service listing', error?.status ?? 500, { cause: error });
        throw panelError;
      }
    },
    [loadServiceManagement]
  );

  const serviceSection = useMemo(() => {
    if (!serviceState.loading && !serviceState.error && !serviceState.data) {
      return null;
    }

    const snapshot = serviceState.data ?? {};

    return {
      id: 'service-management',
      label: 'Service listing management',
      description: 'Publish, review, and govern the Fixnado service catalogue across regions.',
      type: 'service-management',
      icon: 'support',
      data: {
        ...snapshot,
        loading: serviceState.loading,
        error: serviceState.error,
        onRefresh: handleServiceRefresh,
        onCreateCategory: handleCreateCategory,
        onUpdateCategory: handleUpdateCategory,
        onArchiveCategory: handleArchiveCategory,
        onCreateListing: handleCreateListing,
        onUpdateListing: handleUpdateListing,
        onUpdateListingStatus: handleUpdateListingStatus,
        onArchiveListing: handleArchiveListing
      }
    };
  }, [
    serviceState,
    handleServiceRefresh,
    handleCreateCategory,
    handleUpdateCategory,
    handleArchiveCategory,
    handleCreateListing,
    handleUpdateListing,
    handleUpdateListingStatus,
    handleArchiveListing
  ]);

  const complianceSectionContext = useMemo(() => {
    const payload =
      complianceState.payload ?? {
        controls: [],
        summary: { total: 0, overdue: 0, dueSoon: 0, monitoring: 0 },
        filters: { statuses: [], categories: [], reviewFrequencies: [], controlTypes: [], ownerTeams: [] },
        automation: {},
        evidence: [],
        exceptions: []
      };
    return {
      loading: complianceState.loading,
      error: complianceState.error,
      payload,
      actions: {
        refresh: () => loadComplianceControls(),
        createControl: handleCreateControl,
        updateControl: handleUpdateControl,
        deleteControl: handleDeleteControl,
        updateAutomation: handleUpdateAutomation
      }
    };
  }, [
    complianceState.loading,
    complianceState.error,
    complianceState.payload,
    loadComplianceControls,
    handleCreateControl,
    handleUpdateControl,
    handleDeleteControl,
    handleUpdateAutomation
  ]);

  const navigationModel = useMemo(() => {
    if (!state.data) {
      return { sections: [], sidebarLinks: [] };
    }
    return buildAdminNavigation(state.data, complianceSectionContext);
  }, [state.data, complianceSectionContext]);

  const navigation = useMemo(() => {
    if (!navigationModel.sections.length) {
      return [];
    }

    const extendedSections = [
      ...navigationModel.sections,
      providerSection,
      enterpriseSection,
      serviceSection,
      affiliateSection,
      profileSettingsSection,
      {
        id: 'zone-management-link',
        label: 'Zone management workspace',
        description: 'Launch the geo-zonal governance tools in a dedicated workspace.',
        type: 'link',
        href: '/admin/zones'
      },
      {
        id: 'role-management-link',
        label: 'Role management',
        description: 'Manage roles, permissions, and member assignments.',
        type: 'link',
        href: '/admin/roles'
      },
      {
        id: 'purchases-link',
        label: 'Purchase management',
        description: 'Create purchase orders, manage suppliers, and align budgets.',
        type: 'link',
        icon: 'documents',
        href: '/admin/purchases'
      },
      {
        id: 'admin-monetisation-link',
        label: 'Monetisation workspace',
        description: 'Open the revenue and affiliate control centre.',
        type: 'link',
        icon: 'finance',
        href: '/admin/monetisation'
      }
    ].filter(Boolean);

    return extendedSections;
  }, [
    navigationModel.sections,
    providerSection,
    enterpriseSection,
    serviceSection,
    affiliateSection,
    profileSettingsSection
  ]);

  const dashboardPayload = useMemo(() => {
    if (!state.data) {
      return null;
    }
    return {
      navigation,
      sidebarLinks: navigationModel.sidebarLinks
    };
  }, [navigation, navigationModel.sidebarLinks, state.data]);

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

  const openConfigurator = useCallback(
    (view = 'summary') => {
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        params.set('panel', 'command-metrics');
        if (view) {
          params.set('view', view);
        } else {
          params.delete('view');
        }
        if (timeframe === DEFAULT_TIMEFRAME) {
          params.delete('timeframe');
        } else {
          params.set('timeframe', timeframe);
        }
        return params;
      });
    },
    [setSearchParams, timeframe]
  );

  const closeConfigurator = useCallback(() => {
    setSearchParams((current) => {
      const params = new URLSearchParams(current);
      params.delete('panel');
      params.delete('view');
      if (timeframe === DEFAULT_TIMEFRAME) {
        params.delete('timeframe');
      } else {
        params.set('timeframe', timeframe);
      }
      return params;
    });
  }, [setSearchParams, timeframe]);

  const handleConfiguratorViewChange = useCallback(
    (view) => {
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        params.set('panel', 'command-metrics');
        if (view) {
          params.set('view', view);
        } else {
          params.delete('view');
        }
        if (timeframe === DEFAULT_TIMEFRAME) {
          params.delete('timeframe');
        } else {
          params.set('timeframe', timeframe);
        }
        return params;
      });
    },
    [setSearchParams, timeframe]
  );

  const handleSectionChange = useCallback(
    (sectionId) => {
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        const currentFocus = params.get('focus');
        if (sectionId && sectionId !== 'overview') {
          if (currentFocus === sectionId) {
            return current;
          }
          params.set('focus', sectionId);
          return params;
        }
        if (!currentFocus) {
          return current;
        }
        params.delete('focus');
        return params;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const handleRefresh = useCallback(() => {
    loadDashboard({ timeframe, forceRefresh: true });
    loadServiceManagement({ silent: true }).catch((error) => {
      console.error('[AdminDashboard] Service management refresh failed during dashboard refresh', error);
    });
  }, [loadDashboard, timeframe, loadServiceManagement]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/admin', { replace: true, state: { reason: 'signedOut' } });
  }, [logout, navigate]);

  const handleOpenSettings = useCallback(() => {
    if (!overviewSettings) return;
    setOverviewSettingsSuccess(null);
    setOverviewSettingsForm(buildFormState(overviewSettings));
    setOverviewSettingsFormError(null);
    setSettingsModalOpen(true);
  }, [overviewSettings]);

  const handleCloseSettings = useCallback(() => {
    setSettingsModalOpen(false);
    setOverviewSettingsFormError(null);
    if (overviewSettings) {
      setOverviewSettingsForm(buildFormState(overviewSettings));
    }
  }, [overviewSettings]);

  const handleSaveOverviewSettings = useCallback(
    async (payload) => {
      setOverviewSettingsSaving(true);
      setOverviewSettingsFormError(null);
      try {
        const saved = await persistAdminDashboardOverviewSettings(payload);
        setOverviewSettings(saved);
        setOverviewSettingsSuccess('Overview settings updated');
        await loadDashboard({ timeframe, forceRefresh: true });
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to save overview settings';
        setOverviewSettingsFormError(message);
        return false;
      } finally {
        setOverviewSettingsSaving(false);
      }
    },
    [loadDashboard, timeframe]
  );

  const handleMetricFieldChange = useCallback((metricKey, field, value) => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      return {
        ...current,
        metrics: {
          ...current.metrics,
          [metricKey]: {
            ...current.metrics[metricKey],
            [field]: value
          }
        }
      };
    });
  }, []);

  const handleChartFieldChange = useCallback((chartKey, field, value) => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      return {
        ...current,
        charts: {
          ...current.charts,
          [chartKey]: {
            ...current.charts[chartKey],
            [field]: value
          }
        }
      };
    });
  }, []);

  const handleAddManualInsight = useCallback(() => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      if (current.insights.manual.length >= MAX_OVERVIEW_INSIGHTS) {
        return current;
      }
      return {
        ...current,
        insights: {
          ...current.insights,
          manual: [...current.insights.manual, '']
        }
      };
    });
  }, []);

  const handleManualInsightChange = useCallback((index, value) => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      const manual = current.insights.manual.map((entry, entryIndex) =>
        entryIndex === index ? value : entry
      );
      return {
        ...current,
        insights: {
          ...current.insights,
          manual
        }
      };
    });
  }, []);

  const handleRemoveManualInsight = useCallback((index) => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      const manual = current.insights.manual.filter((_, entryIndex) => entryIndex !== index);
      return {
        ...current,
        insights: {
          ...current.insights,
          manual
        }
      };
    });
  }, []);

  const handleAddTimelineEntry = useCallback(() => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      if (current.timeline.manual.length >= MAX_OVERVIEW_TIMELINE) {
        return current;
      }
      return {
        ...current,
        timeline: {
          ...current.timeline,
          manual: [...current.timeline.manual, { title: '', when: '', status: '' }]
        }
      };
    });
  }, []);

  const handleTimelineEntryChange = useCallback((index, field, value) => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      const manual = current.timeline.manual.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      );
      return {
        ...current,
        timeline: {
          ...current.timeline,
          manual
        }
      };
    });
  }, []);

  const handleRemoveTimelineEntry = useCallback((index) => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      const manual = current.timeline.manual.filter((_, entryIndex) => entryIndex !== index);
      return {
        ...current,
        timeline: {
          ...current.timeline,
          manual
        }
      };
    });
  }, []);

  const handleAddManualSignal = useCallback(() => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      if (current.security.manualSignals.length >= MAX_SECURITY_SIGNALS) {
        return current;
      }
      return {
        ...current,
        security: {
          ...current.security,
          manualSignals: [...current.security.manualSignals, { label: '', caption: '', valueLabel: '', tone: 'info' }]
        }
      };
    });
  }, []);

  const handleManualSignalChange = useCallback((index, field, value) => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      const manualSignals = current.security.manualSignals.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      );
      return {
        ...current,
        security: {
          ...current.security,
          manualSignals
        }
      };
    });
  }, []);

  const handleRemoveManualSignal = useCallback((index) => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      const manualSignals = current.security.manualSignals.filter((_, entryIndex) => entryIndex !== index);
      return {
        ...current,
        security: {
          ...current.security,
          manualSignals
        }
      };
    });
  }, []);

  const handleAddAutomationEntry = useCallback(() => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      if (current.automation.manualBacklog.length >= MAX_AUTOMATION_BACKLOG) {
        return current;
      }
      return {
        ...current,
        automation: {
          ...current.automation,
          manualBacklog: [...current.automation.manualBacklog, { name: '', status: '', notes: '', tone: 'info' }]
        }
      };
    });
  }, []);

  const handleAutomationEntryChange = useCallback((index, field, value) => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      const manualBacklog = current.automation.manualBacklog.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      );
      return {
        ...current,
        automation: {
          ...current.automation,
          manualBacklog
        }
      };
    });
  }, []);

  const handleRemoveAutomationEntry = useCallback((index) => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      const manualBacklog = current.automation.manualBacklog.filter((_, entryIndex) => entryIndex !== index);
      return {
        ...current,
        automation: {
          ...current.automation,
          manualBacklog
        }
      };
    });
  }, []);

  const handleAddOperationsBoard = useCallback(() => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      if (current.operations.manualBoards.length >= MAX_OPERATIONS_BOARDS) {
        return current;
      }
      return {
        ...current,
        operations: {
          ...current.operations,
          manualBoards: [
            ...current.operations.manualBoards,
            { title: '', summary: '', owner: '', updates: [''] }
          ]
        }
      };
    });
  }, []);

  const handleOperationsBoardChange = useCallback((index, field, value) => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      const manualBoards = current.operations.manualBoards.map((board, boardIndex) =>
        boardIndex === index ? { ...board, [field]: value } : board
      );
      return {
        ...current,
        operations: {
          ...current.operations,
          manualBoards
        }
      };
    });
  }, []);

  const handleRemoveOperationsBoard = useCallback((index) => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      const manualBoards = current.operations.manualBoards.filter((_, boardIndex) => boardIndex !== index);
      return {
        ...current,
        operations: {
          ...current.operations,
          manualBoards
        }
      };
    });
  }, []);

  const handleAddOperationsBoardUpdate = useCallback((boardIndex) => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      const manualBoards = current.operations.manualBoards.map((board, index) => {
        if (index !== boardIndex) {
          return board;
        }
        if (board.updates.length >= MAX_OPERATIONS_BOARD_UPDATES) {
          return board;
        }
        return { ...board, updates: [...board.updates, ''] };
      });
      return {
        ...current,
        operations: {
          ...current.operations,
          manualBoards
        }
      };
    });
  }, []);

  const handleOperationsBoardUpdateChange = useCallback((boardIndex, updateIndex, value) => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      const manualBoards = current.operations.manualBoards.map((board, index) => {
        if (index !== boardIndex) {
          return board;
        }
        const updates = board.updates.map((entry, entryIndex) =>
          entryIndex === updateIndex ? value : entry
        );
        return { ...board, updates };
      });
      return {
        ...current,
        operations: {
          ...current.operations,
          manualBoards
        }
      };
    });
  }, []);

  const handleRemoveOperationsBoardUpdate = useCallback((boardIndex, updateIndex) => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      const manualBoards = current.operations.manualBoards.map((board, index) => {
        if (index !== boardIndex) {
          return board;
        }
        const updates = board.updates.filter((_, entryIndex) => entryIndex !== updateIndex);
        return { ...board, updates: updates.length ? updates : [''] };
      });
      return {
        ...current,
        operations: {
          ...current.operations,
          manualBoards
        }
      };
    });
  }, []);

  const handleAddComplianceControl = useCallback(() => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      if (current.compliance.manualControls.length >= MAX_COMPLIANCE_CONTROLS) {
        return current;
      }
      return {
        ...current,
        compliance: {
          ...current.compliance,
          manualControls: [
            ...current.compliance.manualControls,
            { name: '', detail: '', due: '', owner: '', tone: 'info' }
          ]
        }
      };
    });
  }, []);

  const handleComplianceControlChange = useCallback((index, field, value) => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      const manualControls = current.compliance.manualControls.map((control, controlIndex) =>
        controlIndex === index ? { ...control, [field]: value } : control
      );
      return {
        ...current,
        compliance: {
          ...current.compliance,
          manualControls
        }
      };
    });
  }, []);

  const handleRemoveComplianceControl = useCallback((index) => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      const manualControls = current.compliance.manualControls.filter((_, controlIndex) => controlIndex !== index);
      return {
        ...current,
        compliance: {
          ...current.compliance,
          manualControls
        }
      };
    });
  }, []);

  const handleAddAuditEntry = useCallback(() => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      if (current.audit.manualTimeline.length >= MAX_AUDIT_TIMELINE) {
        return current;
      }
      return {
        ...current,
        audit: {
          ...current.audit,
          manualTimeline: [...current.audit.manualTimeline, { time: '', event: '', owner: '', status: '' }]
        }
      };
    });
  }, []);

  const handleAuditEntryChange = useCallback((index, field, value) => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      const manualTimeline = current.audit.manualTimeline.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      );
      return {
        ...current,
        audit: {
          ...current.audit,
          manualTimeline
        }
      };
    });
  }, []);

  const handleRemoveAuditEntry = useCallback((index) => {
    setOverviewSettingsForm((current) => {
      if (!current) return current;
      const manualTimeline = current.audit.manualTimeline.filter((_, entryIndex) => entryIndex !== index);
      return {
        ...current,
        audit: {
          ...current.audit,
          manualTimeline
        }
      };
    });
  }, []);

  const handleSubmitOverviewSettings = useCallback(
    async (event) => {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      if (!overviewSettingsForm) return;
      const payload = prepareSettingsPayload(overviewSettingsForm);
      const saved = await handleSaveOverviewSettings(payload);
      if (saved) {
        setSettingsModalOpen(false);
      }
    },
    [handleSaveOverviewSettings, overviewSettingsForm]
  );

  if (!roleMeta) {
    return null;
  }

  const personaLabel = state.data?.timeframeLabel
    ? `${roleMeta.persona} • Window: ${state.data.timeframeLabel}`
    : roleMeta.persona;

  const adminShortcutLinks = useMemo(
    () => [
      { id: 'home-builder', to: '/admin/home-builder', label: 'Home builder', icon: Squares2X2Icon },
      { id: 'monetisation', to: '/admin/monetisation', label: 'Monetisation controls', icon: BanknotesIcon },
      { id: 'bookings', to: '/admin/bookings', label: 'Booking management', icon: ClipboardDocumentListIcon },
      { id: 'custom-jobs', to: '/admin/custom-jobs', label: 'Custom job management', icon: ClipboardDocumentListIcon },
      { id: 'roles', to: '/admin/roles', label: 'Role management', icon: ShieldCheckIcon },
      { id: 'preferences', to: '/admin/preferences', label: 'Settings preferences', icon: Cog8ToothIcon },
      { id: 'appearance', to: '/admin/appearance', label: 'Appearance management', icon: SwatchIcon },
      { id: 'zones', to: '/admin/zones', label: 'Geo-zonal builder', icon: MapIcon },
      { id: 'escrows', to: '/admin/escrows', label: 'Escrow management', icon: ShieldCheckIcon },
      { id: 'wallets', to: '/admin/wallets', label: 'Wallet management', icon: WalletIcon },
      { id: 'enterprise', to: '/admin/enterprise', label: 'Enterprise management', icon: BuildingOfficeIcon },
      { id: 'marketplace', to: '/admin/marketplace', label: 'Marketplace workspace', icon: WrenchScrewdriverIcon },
      { id: 'website-management', to: '/admin/website-management', label: 'Website management', icon: GlobeAltIcon },
      { id: 'system-settings', to: '/admin/system-settings', label: 'System settings', icon: Cog8ToothIcon }
    ],
    []
  );

  const filters = (
    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
      {adminShortcutLinks.map((shortcut) => (
        <Button
          key={shortcut.id}
          to={shortcut.to}
          size="sm"
          variant="secondary"
          icon={shortcut.icon}
          iconPosition="start"
        >
          {shortcut.label}
        </Button>
      ))}
      <Button type="button" size="sm" variant="primary" icon={Cog8ToothIcon} iconPosition="start" onClick={openConfigurator}>
        Configure metrics
      </Button>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        icon={Cog6ToothIcon}
        iconPosition="start"
        onClick={handleOpenSettings}
        disabled={overviewSettingsLoading || !overviewSettings}
      >
        Configure overview
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
      {overviewSettingsLoadError ? (
        <StatusPill tone="danger">{overviewSettingsLoadError}</StatusPill>
      ) : null}
      {overviewSettingsSuccess && !settingsModalOpen ? (
        <StatusPill tone="success">{overviewSettingsSuccess}</StatusPill>
      ) : null}
    </div>
  );

  return (
    <>
      <DashboardLayout
        roleMeta={{ ...roleMeta, persona: personaLabel }}
        registeredRoles={registeredRoles}
        dashboard={dashboardPayload}
        loading={state.loading}
        error={state.error?.message ?? null}
        onRefresh={handleRefresh}
        lastRefreshed={lastRefreshed}
        filters={filters}
        initialSectionId={focusSectionId || undefined}
        onSectionChange={handleSectionChange}
        onLogout={handleLogout}
      />
      <CommandMetricsConfigurator
        open={configuratorOpen}
        initialView={viewParam}
        onClose={closeConfigurator}
        onUpdated={() => loadDashboard({ timeframe, forceRefresh: true })}
        onViewChange={handleConfiguratorViewChange}
      />
      <OverviewSettingsModal
        open={settingsModalOpen}
        loading={overviewSettingsLoading}
        saving={overviewSettingsSaving}
        error={overviewSettingsFormError}
        form={overviewSettingsForm}
        onClose={handleCloseSettings}
        onSubmit={handleSubmitOverviewSettings}
        onMetricChange={handleMetricFieldChange}
        onChartChange={handleChartFieldChange}
        onAddInsight={handleAddManualInsight}
        onInsightChange={handleManualInsightChange}
        onRemoveInsight={handleRemoveManualInsight}
        onAddTimelineEntry={handleAddTimelineEntry}
        onTimelineEntryChange={handleTimelineEntryChange}
        onRemoveTimelineEntry={handleRemoveTimelineEntry}
        onAddManualSignal={handleAddManualSignal}
        onManualSignalChange={handleManualSignalChange}
        onRemoveManualSignal={handleRemoveManualSignal}
        onAddAutomationEntry={handleAddAutomationEntry}
        onAutomationEntryChange={handleAutomationEntryChange}
        onRemoveAutomationEntry={handleRemoveAutomationEntry}
        onAddOperationsBoard={handleAddOperationsBoard}
        onOperationsBoardChange={handleOperationsBoardChange}
        onRemoveOperationsBoard={handleRemoveOperationsBoard}
        onAddOperationsBoardUpdate={handleAddOperationsBoardUpdate}
        onOperationsBoardUpdateChange={handleOperationsBoardUpdateChange}
        onRemoveOperationsBoardUpdate={handleRemoveOperationsBoardUpdate}
        onAddComplianceControl={handleAddComplianceControl}
        onComplianceControlChange={handleComplianceControlChange}
        onRemoveComplianceControl={handleRemoveComplianceControl}
        onAddAuditEntry={handleAddAuditEntry}
        onAuditEntryChange={handleAuditEntryChange}
        onRemoveAuditEntry={handleRemoveAuditEntry}
      />
    </>
  );
}

function OverviewSettingsModal({
  open,
  loading,
  saving,
  error,
  form,
  onClose,
  onSubmit,
  onMetricChange,
  onChartChange,
  onAddInsight,
  onInsightChange,
  onRemoveInsight,
  onAddTimelineEntry,
  onTimelineEntryChange,
  onRemoveTimelineEntry,
  onAddManualSignal,
  onManualSignalChange,
  onRemoveManualSignal,
  onAddAutomationEntry,
  onAutomationEntryChange,
  onRemoveAutomationEntry,
  onAddOperationsBoard,
  onOperationsBoardChange,
  onRemoveOperationsBoard,
  onAddOperationsBoardUpdate,
  onOperationsBoardUpdateChange,
  onRemoveOperationsBoardUpdate,
  onAddComplianceControl,
  onComplianceControlChange,
  onRemoveComplianceControl,
  onAddAuditEntry,
  onAuditEntryChange,
  onRemoveAuditEntry
}) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={saving ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 sm:p-6 lg:p-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                <form onSubmit={onSubmit} className="flex h-full max-h-[90vh] flex-col">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4 sm:px-8 sm:py-5">
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-slate-900">
                        Configure overview experience
                      </Dialog.Title>
                      <p className="mt-1 max-w-3xl text-sm text-slate-600">
                        Manage the copy, thresholds, curated insights, and upcoming milestones that power the admin overview. Changes apply instantly to all administrators with dashboard access.
                      </p>
                      {error ? (
                        <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
                      ) : null}
                    </div>
                    <Button type="button" variant="tertiary" size="sm" onClick={onClose} disabled={saving}>
                      Close
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
                    {loading && !form ? (
                      <div className="flex min-h-[240px] items-center justify-center">
                        <Spinner aria-label="Loading overview settings" />
                      </div>
                    ) : (
                      <div className="space-y-8 pb-6">
                        <section>
                          <h3 className="text-base font-semibold text-slate-900">Metric tiles</h3>
                          <p className="mt-1 text-sm text-slate-600">
                            Update the labels and performance thresholds that appear across the command metrics tiles.
                          </p>
                          <div className="mt-4 space-y-6">
                            {OVERVIEW_METRICS_CONFIG.map((config) => {
                              const metric = form?.metrics?.[config.key] ?? {};
                              return (
                                <div
                                  key={config.key}
                                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-transparent transition hover:ring-accent/20"
                                >
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <h4 className="text-sm font-semibold text-slate-900">{config.title}</h4>
                                      <p className="mt-1 text-sm text-slate-600">{config.description}</p>
                                    </div>
                                  </div>
                                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                    {config.inputs.map((input) => (
                                      <TextInput
                                        key={input.field}
                                        label={input.label}
                                        optionalLabel={input.optionalLabel}
                                        type={input.type}
                                        inputMode={input.type === 'number' ? 'decimal' : undefined}
                                        step={input.step}
                                        value={metric?.[input.field] ?? ''}
                                        onChange={(event) =>
                                          onMetricChange(config.key, input.field, event.target.value)
                                        }
                                        hint={input.hint}
                                      />
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </section>

                        <section>
                          <h3 className="text-base font-semibold text-slate-900">Charts</h3>
                          <p className="mt-1 text-sm text-slate-600">
                            Control the targets and scaling applied to overview visualisations.
                          </p>
                          <div className="mt-4 space-y-6">
                            {OVERVIEW_CHART_CONFIG.map((config) => {
                              const chart = form?.charts?.[config.key] ?? {};
                              return (
                                <div
                                  key={config.key}
                                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-transparent transition hover:ring-accent/20"
                                >
                                  <div>
                                    <h4 className="text-sm font-semibold text-slate-900">{config.title}</h4>
                                    <p className="mt-1 text-sm text-slate-600">{config.description}</p>
                                  </div>
                                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                    {config.inputs.map((input) => (
                                      <TextInput
                                        key={input.field}
                                        label={input.label}
                                        type={input.type}
                                        inputMode={input.type === 'number' ? 'decimal' : undefined}
                                        step={input.step}
                                        value={chart?.[input.field] ?? ''}
                                        onChange={(event) =>
                                          onChartChange(config.key, input.field, event.target.value)
                                        }
                                        hint={input.hint}
                                      />
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </section>

                        <section>
                          <h3 className="text-base font-semibold text-slate-900">Manual insights</h3>
                          <p className="mt-1 text-sm text-slate-600">
                            Pin curated observations alongside automated signals. Insights appear in the overview insights rail.
                          </p>
                          <div className="mt-4 space-y-4">
                            {form?.insights?.manual?.length ? null : (
                              <p className="text-sm text-slate-500">No manual insights yet. Add one to get started.</p>
                            )}
                            {form?.insights?.manual?.map((entry, index) => (
                              <div
                                key={`insight-${index}`}
                                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start"
                              >
                                <TextInput
                                  className="flex-1"
                                  label={`Insight ${index + 1}`}
                                  value={entry}
                                  onChange={(event) => onInsightChange(index, event.target.value)}
                                  hint="Visible text shown in the overview insights list."
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  icon={TrashIcon}
                                  iconPosition="start"
                                  onClick={() => onRemoveInsight(index)}
                                  disabled={saving}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              icon={PlusIcon}
                              iconPosition="start"
                              onClick={onAddInsight}
                              disabled={saving || (form?.insights?.manual?.length ?? 0) >= MAX_OVERVIEW_INSIGHTS}
                            >
                              Add insight
                            </Button>
                            {form?.insights?.manual?.length >= MAX_OVERVIEW_INSIGHTS ? (
                              <p className="text-xs font-medium text-slate-500">
                                Maximum of {MAX_OVERVIEW_INSIGHTS} insights reached.
                              </p>
                            ) : null}
                          </div>
                        </section>

                        <section>
                          <h3 className="text-base font-semibold text-slate-900">Upcoming milestones</h3>
                          <p className="mt-1 text-sm text-slate-600">
                            Curate manual milestones that appear in the upcoming compliance and automation timeline.
                          </p>
                          <div className="mt-4 space-y-4">
                            {form?.timeline?.manual?.length ? null : (
                              <p className="text-sm text-slate-500">No custom milestones yet. Add important updates for your operators.</p>
                            )}
                            {form?.timeline?.manual?.map((entry, index) => (
                              <div
                                key={`timeline-${index}`}
                                className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                              >
                                <div className="grid gap-4 md:grid-cols-2">
                                  <TextInput
                                    label="Milestone title"
                                    value={entry.title}
                                    onChange={(event) =>
                                      onTimelineEntryChange(index, 'title', event.target.value)
                                    }
                                    hint="Appears as the title in the overview timeline."
                                  />
                                  <TextInput
                                    label="Due date / window"
                                    value={entry.when}
                                    onChange={(event) =>
                                      onTimelineEntryChange(index, 'when', event.target.value)
                                    }
                                    hint="Shown as the schedule indicator (e.g. 'Next week')."
                                  />
                                  <TextInput
                                    label="Owner or status"
                                    optionalLabel="Optional"
                                    value={entry.status}
                                    onChange={(event) =>
                                      onTimelineEntryChange(index, 'status', event.target.value)
                                    }
                                    hint="Displayed as supporting context under the milestone."
                                  />
                                </div>
                                <div className="flex justify-end">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    icon={TrashIcon}
                                    iconPosition="start"
                                    onClick={() => onRemoveTimelineEntry(index)}
                                    disabled={saving}
                                  >
                                    Remove milestone
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              icon={PlusIcon}
                              iconPosition="start"
                              onClick={onAddTimelineEntry}
                              disabled={
                                saving || (form?.timeline?.manual?.length ?? 0) >= MAX_OVERVIEW_TIMELINE
                              }
                            >
                              Add milestone
                            </Button>
                          {form?.timeline?.manual?.length >= MAX_OVERVIEW_TIMELINE ? (
                            <p className="text-xs font-medium text-slate-500">
                              Maximum of {MAX_OVERVIEW_TIMELINE} milestones reached.
                            </p>
                          ) : null}
                        </div>
                      </section>

                      <section>
                        <h3 className="text-base font-semibold text-slate-900">Security posture signals</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Add manual signals that appear alongside automated MFA, alerting, and ingestion telemetry.
                        </p>
                        <div className="mt-4 space-y-4">
                          {form?.security?.manualSignals?.length ? null : (
                            <p className="text-sm text-slate-500">
                              No manual security signals configured yet.
                            </p>
                          )}
                          {form?.security?.manualSignals?.map((signal, index) => (
                            <div
                              key={`security-signal-${index}`}
                              className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                            >
                              <div className="grid gap-4 md:grid-cols-2">
                                <TextInput
                                  label="Signal title"
                                  value={signal.label}
                                  onChange={(event) => onManualSignalChange(index, 'label', event.target.value)}
                                  hint="Appears as the heading for the manual signal."
                                />
                                <TextInput
                                  label="Value label"
                                  value={signal.valueLabel}
                                  onChange={(event) => onManualSignalChange(index, 'valueLabel', event.target.value)}
                                  hint="Displayed numeric or percentage indicator."
                                />
                                <TextInput
                                  label="Caption"
                                  optionalLabel="Optional"
                                  value={signal.caption}
                                  onChange={(event) => onManualSignalChange(index, 'caption', event.target.value)}
                                  hint="Supplemental context shown under the signal."
                                  className="md:col-span-2"
                                />
                                <div className="md:col-span-2">
                                  <span className="block text-sm font-medium text-slate-700">Tone</span>
                                  <SegmentedControl
                                    className="mt-2"
                                    name={`Manual security tone ${index + 1}`}
                                    value={signal.tone || 'info'}
                                    onChange={(value) => onManualSignalChange(index, 'tone', value)}
                                    options={TONE_OPTIONS}
                                    size="sm"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  icon={TrashIcon}
                                  iconPosition="start"
                                  onClick={() => onRemoveManualSignal(index)}
                                  disabled={saving}
                                >
                                  Remove signal
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={PlusIcon}
                            iconPosition="start"
                            onClick={onAddManualSignal}
                            disabled={saving || (form?.security?.manualSignals?.length ?? 0) >= MAX_SECURITY_SIGNALS}
                          >
                            Add security signal
                          </Button>
                          {form?.security?.manualSignals?.length >= MAX_SECURITY_SIGNALS ? (
                            <p className="text-xs font-medium text-slate-500">Maximum of {MAX_SECURITY_SIGNALS} signals reached.</p>
                          ) : null}
                        </div>
                      </section>

                      <section>
                        <h3 className="text-base font-semibold text-slate-900">Automation backlog</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Curate manual automation initiatives that enrich the security &amp; telemetry backlog view.
                        </p>
                        <div className="mt-4 space-y-4">
                          {form?.automation?.manualBacklog?.length ? null : (
                            <p className="text-sm text-slate-500">No manual automation initiatives captured yet.</p>
                          )}
                          {form?.automation?.manualBacklog?.map((item, index) => (
                            <div
                              key={`automation-${index}`}
                              className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                            >
                              <div className="grid gap-4 md:grid-cols-2">
                                <TextInput
                                  label="Initiative name"
                                  value={item.name}
                                  onChange={(event) => onAutomationEntryChange(index, 'name', event.target.value)}
                                  hint="Name displayed in the automation backlog list."
                                />
                                <TextInput
                                  label="Status"
                                  value={item.status}
                                  onChange={(event) => onAutomationEntryChange(index, 'status', event.target.value)}
                                  hint="Headline state such as Pilot, Operational, or Monitoring."
                                />
                                <div className="md:col-span-2 space-y-2">
                                  <span className="block text-sm font-medium text-slate-700">Tone</span>
                                  <SegmentedControl
                                    name={`Automation tone ${index + 1}`}
                                    value={item.tone || 'info'}
                                    onChange={(value) => onAutomationEntryChange(index, 'tone', value)}
                                    options={TONE_OPTIONS}
                                    size="sm"
                                  />
                                </div>
                              </div>
                              <FormField
                                id={`automation-notes-${index}`}
                                label="Notes"
                                optionalLabel="Optional"
                                hint="Provide additional context surfaced under the initiative."
                              >
                                <textarea
                                  id={`automation-notes-${index}`}
                                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                                  rows={3}
                                  value={item.notes}
                                  onChange={(event) => onAutomationEntryChange(index, 'notes', event.target.value)}
                                />
                              </FormField>
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  icon={TrashIcon}
                                  iconPosition="start"
                                  onClick={() => onRemoveAutomationEntry(index)}
                                  disabled={saving}
                                >
                                  Remove initiative
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={PlusIcon}
                            iconPosition="start"
                            onClick={onAddAutomationEntry}
                            disabled={saving || (form?.automation?.manualBacklog?.length ?? 0) >= MAX_AUTOMATION_BACKLOG}
                          >
                            Add automation initiative
                          </Button>
                          {form?.automation?.manualBacklog?.length >= MAX_AUTOMATION_BACKLOG ? (
                            <p className="text-xs font-medium text-slate-500">
                              Maximum of {MAX_AUTOMATION_BACKLOG} initiatives reached.
                            </p>
                          ) : null}
                        </div>
                      </section>

                      <section>
                        <h3 className="text-base font-semibold text-slate-900">Operations boards</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Draft manual queue summaries that appear with the provider verification, disputes, and insurance boards.
                        </p>
                        <div className="mt-4 space-y-4">
                          {form?.operations?.manualBoards?.length ? null : (
                            <p className="text-sm text-slate-500">No manual boards configured yet.</p>
                          )}
                          {form?.operations?.manualBoards?.map((board, index) => (
                            <div
                              key={`operations-board-${index}`}
                              className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                            >
                              <div className="grid gap-4 md:grid-cols-2">
                                <TextInput
                                  label="Board title"
                                  value={board.title}
                                  onChange={(event) => onOperationsBoardChange(index, 'title', event.target.value)}
                                  hint="Headline shown for the manual queue board."
                                />
                                <TextInput
                                  label="Owner"
                                  optionalLabel="Optional"
                                  value={board.owner}
                                  onChange={(event) => onOperationsBoardChange(index, 'owner', event.target.value)}
                                  hint="Owner string appended to the board summary."
                                />
                                <FormField
                                  id={`operations-summary-${index}`}
                                  label="Summary"
                                  hint="Short description surfaced as the primary board detail."
                                  className="md:col-span-2"
                                >
                                  <textarea
                                    id={`operations-summary-${index}`}
                                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                                    rows={3}
                                    value={board.summary}
                                    onChange={(event) => onOperationsBoardChange(index, 'summary', event.target.value)}
                                  />
                                </FormField>
                              </div>
                              <div className="space-y-3">
                                <p className="text-sm font-medium text-slate-700">Updates</p>
                                {board.updates.map((update, updateIndex) => (
                                  <div key={`operations-update-${index}-${updateIndex}`} className="flex flex-col gap-3 sm:flex-row sm:items-start">
                                    <TextInput
                                      className="flex-1"
                                      label={`Update ${updateIndex + 1}`}
                                      value={update}
                                      onChange={(event) =>
                                        onOperationsBoardUpdateChange(index, updateIndex, event.target.value)
                                      }
                                      hint="Appears as a bullet point in the operations board."
                                    />
                                    {board.updates.length > 1 ? (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        icon={TrashIcon}
                                        iconPosition="start"
                                        onClick={() => onRemoveOperationsBoardUpdate(index, updateIndex)}
                                        disabled={saving}
                                      >
                                        Remove update
                                      </Button>
                                    ) : null}
                                  </div>
                                ))}
                                <div className="flex flex-wrap items-center gap-3">
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    icon={PlusIcon}
                                    iconPosition="start"
                                    onClick={() => onAddOperationsBoardUpdate(index)}
                                    disabled={
                                      saving || board.updates.length >= MAX_OPERATIONS_BOARD_UPDATES
                                    }
                                  >
                                    Add update
                                  </Button>
                                  {board.updates.length >= MAX_OPERATIONS_BOARD_UPDATES ? (
                                    <p className="text-xs font-medium text-slate-500">
                                      Maximum of {MAX_OPERATIONS_BOARD_UPDATES} updates per board.
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  icon={TrashIcon}
                                  iconPosition="start"
                                  onClick={() => onRemoveOperationsBoard(index)}
                                  disabled={saving}
                                >
                                  Remove board
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={PlusIcon}
                            iconPosition="start"
                            onClick={onAddOperationsBoard}
                            disabled={saving || (form?.operations?.manualBoards?.length ?? 0) >= MAX_OPERATIONS_BOARDS}
                          >
                            Add board
                          </Button>
                          {form?.operations?.manualBoards?.length >= MAX_OPERATIONS_BOARDS ? (
                            <p className="text-xs font-medium text-slate-500">
                              Maximum of {MAX_OPERATIONS_BOARDS} boards reached.
                            </p>
                          ) : null}
                        </div>
                      </section>

                      <section>
                        <h3 className="text-base font-semibold text-slate-900">Compliance controls</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Define manual compliance entries surfaced alongside expiring attestations.
                        </p>
                        <div className="mt-4 space-y-4">
                          {form?.compliance?.manualControls?.length ? null : (
                            <p className="text-sm text-slate-500">No manual compliance controls defined yet.</p>
                          )}
                          {form?.compliance?.manualControls?.map((control, index) => (
                            <div
                              key={`compliance-control-${index}`}
                              className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                            >
                              <div className="grid gap-4 md:grid-cols-2">
                                <TextInput
                                  label="Control name"
                                  value={control.name}
                                  onChange={(event) => onComplianceControlChange(index, 'name', event.target.value)}
                                  hint="Headline shown in the compliance list."
                                />
                                <TextInput
                                  label="Due date / window"
                                  value={control.due}
                                  onChange={(event) => onComplianceControlChange(index, 'due', event.target.value)}
                                  hint="Displayed schedule indicator (e.g. Due tomorrow)."
                                />
                                <FormField
                                  id={`compliance-detail-${index}`}
                                  label="Detail"
                                  hint="Supporting text displayed beneath the control."
                                  className="md:col-span-2"
                                >
                                  <textarea
                                    id={`compliance-detail-${index}`}
                                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                                    rows={3}
                                    value={control.detail}
                                    onChange={(event) => onComplianceControlChange(index, 'detail', event.target.value)}
                                  />
                                </FormField>
                                <TextInput
                                  label="Owner"
                                  optionalLabel="Optional"
                                  value={control.owner}
                                  onChange={(event) => onComplianceControlChange(index, 'owner', event.target.value)}
                                  hint="Owner or team responsible for the control."
                                />
                                <div>
                                  <span className="block text-sm font-medium text-slate-700">Tone</span>
                                  <SegmentedControl
                                    className="mt-2"
                                    name={`Compliance tone ${index + 1}`}
                                    value={control.tone || 'info'}
                                    onChange={(value) => onComplianceControlChange(index, 'tone', value)}
                                    options={TONE_OPTIONS}
                                    size="sm"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  icon={TrashIcon}
                                  iconPosition="start"
                                  onClick={() => onRemoveComplianceControl(index)}
                                  disabled={saving}
                                >
                                  Remove control
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={PlusIcon}
                            iconPosition="start"
                            onClick={onAddComplianceControl}
                            disabled={saving || (form?.compliance?.manualControls?.length ?? 0) >= MAX_COMPLIANCE_CONTROLS}
                          >
                            Add compliance control
                          </Button>
                          {form?.compliance?.manualControls?.length >= MAX_COMPLIANCE_CONTROLS ? (
                            <p className="text-xs font-medium text-slate-500">
                              Maximum of {MAX_COMPLIANCE_CONTROLS} controls reached.
                            </p>
                          ) : null}
                        </div>
                      </section>

                      <section>
                        <h3 className="text-base font-semibold text-slate-900">Audit timeline</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Append manual audit checkpoints that surface within the audit timeline table.
                        </p>
                        <div className="mt-4 space-y-4">
                          {form?.audit?.manualTimeline?.length ? null : (
                            <p className="text-sm text-slate-500">No manual audit events recorded yet.</p>
                          )}
                          {form?.audit?.manualTimeline?.map((entry, index) => (
                            <div
                              key={`audit-entry-${index}`}
                              className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                            >
                              <div className="grid gap-4 md:grid-cols-2">
                                <TextInput
                                  label="Time"
                                  value={entry.time}
                                  onChange={(event) => onAuditEntryChange(index, 'time', event.target.value)}
                                  hint="Displayed timestamp or window (e.g. 08:30 or Last run)."
                                />
                                <TextInput
                                  label="Status"
                                  optionalLabel="Optional"
                                  value={entry.status}
                                  onChange={(event) => onAuditEntryChange(index, 'status', event.target.value)}
                                  hint="Status text shown in the timeline table."
                                />
                                <TextInput
                                  label="Event"
                                  className="md:col-span-2"
                                  value={entry.event}
                                  onChange={(event) => onAuditEntryChange(index, 'event', event.target.value)}
                                  hint="Headline displayed for the audit entry."
                                />
                                <TextInput
                                  label="Owner"
                                  optionalLabel="Optional"
                                  value={entry.owner}
                                  onChange={(event) => onAuditEntryChange(index, 'owner', event.target.value)}
                                  hint="Owner string shown alongside the event."
                                />
                              </div>
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  icon={TrashIcon}
                                  iconPosition="start"
                                  onClick={() => onRemoveAuditEntry(index)}
                                  disabled={saving}
                                >
                                  Remove audit entry
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={PlusIcon}
                            iconPosition="start"
                            onClick={onAddAuditEntry}
                            disabled={saving || (form?.audit?.manualTimeline?.length ?? 0) >= MAX_AUDIT_TIMELINE}
                          >
                            Add audit entry
                          </Button>
                          {form?.audit?.manualTimeline?.length >= MAX_AUDIT_TIMELINE ? (
                            <p className="text-xs font-medium text-slate-500">
                              Maximum of {MAX_AUDIT_TIMELINE} audit entries reached.
                            </p>
                          ) : null}
                        </div>
                      </section>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-8">
                    <div className="text-xs text-slate-500">
                      Settings are scoped to administrators with dashboard access. Saved changes sync immediately.
                    </div>
                    <div className="flex items-center gap-3">
                      <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" loading={saving}>
                        Save overview
                      </Button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
