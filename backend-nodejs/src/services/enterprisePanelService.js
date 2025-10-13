import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import config from '../config/index.js';
import {
  AdCampaign,
  Booking,
  CampaignDailyMetric,
  CampaignFlight,
  CampaignInvoice,
  Company,
  ConversationParticipant,
  ServiceZone
} from '../models/index.js';

const DEFAULT_TIMEZONE = config.dashboards?.defaultTimezone || 'Europe/London';
const PANEL_WINDOW_DAYS = Math.max(config.dashboards?.defaultWindowDays ?? 28, 14);
const UPCOMING_LIMIT = Math.max(config.dashboards?.upcomingLimit ?? 8, 3);

function buildFallbackPanel(timezone, company = null) {
  const now = DateTime.now().setZone(timezone);
  const window = {
    start: now.minus({ days: PANEL_WINDOW_DAYS }).toISO(),
    end: now.toISO(),
    timezone
  };

  const enterpriseName = company?.contactName || 'Albion Workspace Group';
  const sector = company?.marketplaceIntent ? startCase(company.marketplaceIntent) : 'Corporate real estate';

  return {
    generatedAt: now.toISO(),
    window,
    enterprise: {
      id: company?.id || 'enterprise-demo',
      name: enterpriseName,
      sector,
      accountManager: 'Danielle Rivers',
      activeSites: Math.max(company?.serviceRegions?.split?.(',').length || company?.siteCount || 0, 32),
      serviceMix: ['Electrical', 'HVAC', 'Smart IoT']
    },
    delivery: {
      slaCompliance: 0.95,
      incidents: 3,
      avgResolutionHours: 4.2,
      nps: 51
    },
    spend: {
      monthToDate: 212_400,
      budgetPacing: 0.74,
      savingsIdentified: 18_600,
      invoicesAwaitingApproval: [
        {
          id: 'invoice-demo-1',
          vendor: 'Metro Power Services',
          amount: 1_240,
          dueDate: now.plus({ days: 5 }).toISO(),
          status: 'issued'
        },
        {
          id: 'invoice-demo-2',
          vendor: 'Citywide Compliance',
          amount: 2_870,
          dueDate: now.plus({ days: 12 }).toISO(),
          status: 'issued'
        }
      ]
    },
    programmes: [
      {
        id: 'programme-demo-1',
        name: 'HVAC retrofit • Canary Wharf',
        status: 'active',
        phase: 'Execution',
        health: 'on-track',
        lastUpdated: now.minus({ days: 2 }).toISO()
      },
      {
        id: 'programme-demo-2',
        name: 'Critical power resilience • Finova',
        status: 'delayed',
        phase: 'Intervention',
        health: 'delayed',
        lastUpdated: now.minus({ days: 4 }).toISO()
      }
    ],
    escalations: [
      {
        id: 'escalation-demo-1',
        title: 'Generator faults at Albion Tower',
        owner: 'Escalations desk',
        openedAt: now.minus({ hours: 36 }).toISO(),
        severity: 'high'
      }
    ]
  };
}

function normaliseUuid(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNumber(value) {
  if (value == null) {
    return 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function average(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  const sum = values.reduce((acc, current) => acc + current, 0);
  return sum / values.length;
}

function startCase(value) {
  if (!value) return null;
  return value
    .toString()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(\w)|\s(\w)/g, (match) => match.toUpperCase());
}

function deriveServiceMix(bookings, campaigns) {
  const mix = new Set();

  bookings.forEach((booking) => {
    const meta = booking.meta ?? {};
    const explicit = meta.serviceCategory || meta.discipline;
    if (explicit) {
      mix.add(startCase(explicit));
      return;
    }

    const title = typeof meta.title === 'string' ? meta.title.toLowerCase() : '';
    if (title.includes('hvac') || title.includes('fan') || title.includes('air')) {
      mix.add('HVAC');
    } else if (title.includes('plumb')) {
      mix.add('Plumbing');
    } else if (title.includes('lift') || title.includes('elevator')) {
      mix.add('Vertical transport');
    } else if (title.includes('generator') || title.includes('elect') || title.includes('power')) {
      mix.add('Electrical');
    }
  });

  campaigns.forEach((campaign) => {
    if (campaign.objective) {
      mix.add(startCase(campaign.objective));
    }
  });

  if (mix.size === 0 && bookings.length > 0) {
    mix.add('Facilities support');
  }

  return Array.from(mix).filter(Boolean).slice(0, 8);
}

async function resolveCompany(requestedCompanyId) {
  const candidateId = normaliseUuid(requestedCompanyId);
  if (candidateId) {
    const company = await Company.findByPk(candidateId);
    if (company) {
      return company;
    }
  }

  const defaultId = normaliseUuid(config.dashboards?.defaults?.enterprise?.companyId);
  if (defaultId) {
    const company = await Company.findByPk(defaultId);
    if (company) {
      return company;
    }
  }

  return Company.findOne({ order: [['createdAt', 'ASC']] });
}

function mapStatusToPhase(status) {
  switch (status) {
    case 'draft':
      return 'Planning';
    case 'scheduled':
      return 'Scheduled';
    case 'active':
      return 'Execution';
    case 'paused':
      return 'Intervention';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Execution';
  }
}

function determineProgrammeHealth(flight, metrics) {
  if (!metrics) {
    return 'on-track';
  }

  const budget = toNumber(flight.budget || flight.dailySpendCap || flight.AdCampaign?.totalBudget);
  const pacing = budget > 0 ? metrics.spend / budget : 0;

  if (pacing > 1.1 || metrics.conversions === 0) {
    return 'at-risk';
  }

  if (pacing > 0.9 || metrics.ctr < 0.03) {
    return 'delayed';
  }

  return 'on-track';
}

function buildEscalations(bookings, timezone) {
  return bookings
    .filter((booking) => {
      const status = booking.status;
      const meta = booking.meta ?? {};
      if (status === 'disputed') return true;
      if (status === 'cancelled' && meta.escalated) return true;
      if (typeof meta.severity === 'string') return true;
      return false;
    })
    .sort((a, b) => new Date(b.lastStatusTransitionAt || b.updatedAt || b.createdAt) - new Date(a.lastStatusTransitionAt || a.updatedAt || a.createdAt))
    .slice(0, UPCOMING_LIMIT)
    .map((booking) => {
      const meta = booking.meta ?? {};
      const openedAt = booking.lastStatusTransitionAt || booking.updatedAt || booking.createdAt;
      return {
        id: booking.id,
        title: meta.title || `Service ${booking.id.slice(0, 4).toUpperCase()}`,
        owner: meta.owner || meta.requester || 'Operations',
        openedAt: openedAt ? DateTime.fromJSDate(new Date(openedAt)).setZone(timezone).toISO() : null,
        severity: (meta.severity && String(meta.severity).toLowerCase()) === 'low' ? 'medium' : booking.status === 'disputed' ? 'high' : 'warning'
      };
    });
}

export async function getEnterprisePanelOverview({ companyId, timezone } = {}) {
  const tz = typeof timezone === 'string' && timezone.trim() ? timezone.trim() : DEFAULT_TIMEZONE;
  const windowEnd = DateTime.now().setZone(tz);
  const windowStart = windowEnd.minus({ days: PANEL_WINDOW_DAYS });

  const company = await resolveCompany(companyId);
  if (!company) {
    const fallback = buildFallbackPanel(tz);
    return { ...fallback, meta: { fallback: true, reason: 'enterprise_company_not_found' } };
  }

  const [zones, bookings, campaigns, metrics, flights, participants] = await Promise.all([
    ServiceZone.findAll({ where: { companyId: company.id } }),
    Booking.findAll({
      where: {
        companyId: company.id,
        createdAt: { [Op.between]: [windowStart.toJSDate(), windowEnd.toJSDate()] }
      }
    }),
    AdCampaign.findAll({
      where: { companyId: company.id },
      include: [
        { model: CampaignInvoice, as: 'invoices' }
      ]
    }),
    CampaignDailyMetric.findAll({
      where: {
        metricDate: { [Op.between]: [windowStart.startOf('day').toJSDate(), windowEnd.endOf('day').toJSDate()] }
      },
      include: [
        {
          model: AdCampaign,
          attributes: ['id', 'companyId'],
          where: { companyId: company.id },
          required: true
        },
        {
          model: CampaignFlight,
          attributes: ['id', 'budget', 'dailySpendCap', 'status', 'updatedAt', 'createdAt']
        }
      ]
    }),
    CampaignFlight.findAll({
      include: [
        {
          model: AdCampaign,
          attributes: ['id', 'name', 'companyId', 'totalBudget'],
          where: { companyId: company.id },
          required: true
        }
      ]
    }),
    ConversationParticipant.findAll({
      where: {
        participantType: 'enterprise',
        participantReferenceId: company.id
      }
    })
  ]);

  const metricsByCampaign = new Map();
  const metricsByFlight = new Map();
  let monthToDateSpend = 0;
  const monthStart = windowEnd.startOf('month');

  metrics.forEach((metric) => {
    const campaignId = metric.AdCampaign?.id;
    if (!campaignId) return;
    const entry = metricsByCampaign.get(campaignId) || { spend: 0, revenue: 0, conversions: 0, ctr: 0, cvr: 0, days: 0 };
    entry.spend += toNumber(metric.spend);
    entry.revenue += toNumber(metric.revenue);
    entry.conversions += toNumber(metric.conversions);
    entry.ctr += toNumber(metric.ctr);
    entry.cvr += toNumber(metric.cvr);
    entry.days += 1;
    metricsByCampaign.set(campaignId, entry);

    const flightId = metric.CampaignFlight?.id;
    if (flightId) {
      const flightEntry = metricsByFlight.get(flightId) || { spend: 0, conversions: 0, ctr: 0, days: 0 };
      flightEntry.spend += toNumber(metric.spend);
      flightEntry.conversions += toNumber(metric.conversions);
      flightEntry.ctr += toNumber(metric.ctr);
      flightEntry.days += 1;
      metricsByFlight.set(flightId, flightEntry);
    }

    const metricDate = DateTime.fromJSDate(metric.metricDate).setZone(tz);
    if (metricDate >= monthStart) {
      monthToDateSpend += toNumber(metric.spend);
    }
  });

  const completedBookings = bookings.filter((booking) => booking.status === 'completed');
  const incidentBookings = bookings.filter(
    (booking) => booking.status === 'disputed' || booking.status === 'cancelled' || booking.meta?.escalated
  );

  const slaMet = completedBookings.filter((booking) => {
    if (!booking.lastStatusTransitionAt || !booking.slaExpiresAt) {
      return false;
    }
    return new Date(booking.lastStatusTransitionAt) <= new Date(booking.slaExpiresAt);
  });

  const resolutionDurations = completedBookings
    .map((booking) => {
      if (!booking.scheduledStart || !booking.lastStatusTransitionAt) {
        return null;
      }
      const diffMs = new Date(booking.lastStatusTransitionAt) - new Date(booking.scheduledStart);
      const hours = diffMs / 3_600_000;
      return Number.isFinite(hours) && hours >= 0 ? hours : null;
    })
    .filter((value) => value != null);

  const npsSamples = bookings
    .map((booking) => {
      const meta = booking.meta ?? {};
      const raw = meta.nps ?? meta.npsScore ?? meta.customerSatisfaction ?? meta.csat ?? meta.rating;
      if (raw == null) {
        return null;
      }
      const value = toNumber(raw);
      if (value === 0 && (raw === '0' || raw === 0)) {
        return 0;
      }
      if (!Number.isFinite(value) || value === 0) {
        return null;
      }
      return value > 1 ? value : value * 100;
    })
    .filter((value) => value != null);

  const accountManager =
    participants.find((participant) => /manager/i.test(participant.role ?? ''))?.displayName || company.contactName || null;

  let serviceMix = deriveServiceMix(bookings, campaigns);
  const activeSites = zones.length || new Set(bookings.map((booking) => booking.zoneId)).size;

  const totalBudget = campaigns.reduce((sum, campaign) => sum + toNumber(campaign.totalBudget), 0);
  const savingsIdentified = campaigns.reduce((sum, campaign) => {
    const campaignMetrics = metricsByCampaign.get(campaign.id);
    const spend = campaignMetrics?.spend ?? 0;
    const remaining = toNumber(campaign.totalBudget) - spend;
    return remaining > 0 ? sum + remaining : sum;
  }, 0);

  const invoicesAwaitingApproval = campaigns
    .flatMap((campaign) =>
      (campaign.invoices || [])
        .filter(
          (invoice) =>
            toNumber(invoice.amountPaid) < toNumber(invoice.amountDue) && ['issued', 'overdue'].includes(invoice.status)
        )
        .map((invoice) => ({
          id: invoice.id,
          vendor: invoice.metadata?.vendor || campaign.name || 'Campaign vendor',
          amount: toNumber(invoice.amountDue) - toNumber(invoice.amountPaid),
          dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString() : null,
          status: invoice.status
        }))
    )
    .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));

  const programmes = flights
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 12)
    .map((flight) => {
      const aggregated = metricsByFlight.get(flight.id);
      const normalised = aggregated
        ? {
            spend: aggregated.spend,
            conversions: aggregated.conversions,
            ctr: aggregated.days ? aggregated.ctr / aggregated.days : 0
          }
        : null;

      return {
        id: flight.id,
        name: `${flight.name} • ${flight.AdCampaign?.name ?? 'Campaign'}`,
        status: flight.status,
        phase: mapStatusToPhase(flight.status),
        health: determineProgrammeHealth(flight, normalised),
        lastUpdated: (flight.updatedAt || flight.createdAt) ? new Date(flight.updatedAt || flight.createdAt).toISOString() : null
      };
    });

  const escalations = buildEscalations(incidentBookings, tz);

  const fallback = buildFallbackPanel(tz, company);

  if (bookings.length === 0 && campaigns.length === 0 && metrics.length === 0 && flights.length === 0) {
    return { ...fallback, meta: { fallback: true, reason: 'no_source_data' } };
  }

  const fallbackSections = [];

  if (serviceMix.length === 0 && bookings.length === 0 && campaigns.length === 0) {
    serviceMix = fallback.enterprise.serviceMix;
    fallbackSections.push('serviceMix');
  }

  const hydratedProgrammes = programmes.length ? programmes : flights.length === 0 ? fallback.programmes : [];
  if (!programmes.length && flights.length === 0) {
    fallbackSections.push('programmes');
  }

  const hydratedEscalations = escalations.length
    ? escalations
    : bookings.length === 0
      ? fallback.escalations
      : [];
  if (!escalations.length && bookings.length === 0) {
    fallbackSections.push('escalations');
  }

  const hydratedInvoices = invoicesAwaitingApproval.length
    ? invoicesAwaitingApproval
    : campaigns.length === 0
      ? fallback.spend.invoicesAwaitingApproval
      : [];
  if (!invoicesAwaitingApproval.length && campaigns.length === 0) {
    fallbackSections.push('invoices');
  }

  const deliverySlaCompliance = completedBookings.length
    ? slaMet.length / completedBookings.length
    : bookings.length === 0
      ? fallback.delivery.slaCompliance
      : 1;
  if (!completedBookings.length && bookings.length === 0) {
    fallbackSections.push('delivery');
  }

  const deliveryIncidents = bookings.length === 0 ? fallback.delivery.incidents : incidentBookings.length;
  const avgResolution = resolutionDurations.length
    ? Number(average(resolutionDurations).toFixed(1))
    : bookings.length === 0
      ? fallback.delivery.avgResolutionHours
      : 0;
  const deliveryNps = npsSamples.length
    ? Math.round(average(npsSamples))
    : bookings.length === 0
      ? fallback.delivery.nps
      : Math.max(30, 72 - incidentBookings.length * 5);

  const spendMonthToDate = monthToDateSpend > 0
    ? Math.round(monthToDateSpend)
    : metrics.length === 0
      ? fallback.spend.monthToDate
      : 0;
  if (!(monthToDateSpend > 0) && metrics.length === 0) {
    fallbackSections.push('spend');
  }

  const budgetPacing = totalBudget > 0
    ? monthToDateSpend / totalBudget
    : metrics.length === 0
      ? fallback.spend.budgetPacing
      : 0;
  const savings = Math.max(Math.round(savingsIdentified), 0) || (campaigns.length === 0 ? fallback.spend.savingsIdentified : 0);

  const meta = fallbackSections.length
    ? { fallback: true, sections: Array.from(new Set(fallbackSections)) }
    : undefined;

  return {
    generatedAt: windowEnd.toISO(),
    window: {
      start: windowStart.toISO(),
      end: windowEnd.toISO(),
      timezone: tz
    },
    enterprise: {
      id: company.id,
      name: company.contactName || company.marketplaceIntent || fallback.enterprise.name,
      sector: company.marketplaceIntent ? startCase(company.marketplaceIntent) : fallback.enterprise.sector,
      accountManager: accountManager || fallback.enterprise.accountManager,
      activeSites: activeSites || fallback.enterprise.activeSites,
      serviceMix
    },
    delivery: {
      slaCompliance: deliverySlaCompliance,
      incidents: deliveryIncidents,
      avgResolutionHours: avgResolution,
      nps: deliveryNps
    },
    spend: {
      monthToDate: spendMonthToDate,
      budgetPacing,
      savingsIdentified: savings,
      invoicesAwaitingApproval: hydratedInvoices
    },
    programmes: hydratedProgrammes,
    escalations: hydratedEscalations,
    ...(meta ? { meta } : {})
  };
}
