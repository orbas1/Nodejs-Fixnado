import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import {
  AdCampaign,
  Booking,
  BookingAssignment,
  CampaignDailyMetric,
  CampaignFraudSignal,
  CampaignInvoice,
  Company,
  ComplianceDocument,
  ConversationParticipant,
  InventoryAlert,
  InventoryItem,
  RentalAgreement,
  Service,
  ServiceZone
} from '../models/index.js';

const ACTIVE_BOOKING_STATUSES = ['scheduled', 'in_progress'];
const SLA_EVALUATION_STATUSES = ['completed', 'disputed'];

function coerceNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function average(values, fallback = 0) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (valid.length === 0) {
    return fallback;
  }
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function toSlug(input, fallback) {
  if (typeof input === 'string' && input.trim()) {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }
  return fallback;
}

async function resolveCompanyId(companyId) {
  if (companyId) {
    const exists = await Company.findByPk(companyId, { attributes: ['id'], raw: true });
    if (exists) {
      return exists.id;
    }
  }

  const firstCompany = await Company.findOne({ attributes: ['id'], order: [['createdAt', 'ASC']], raw: true });
  if (!firstCompany) {
    const error = new Error('company_not_found');
    error.statusCode = 404;
    throw error;
  }
  return firstCompany.id;
}

export async function buildProviderDashboard({ companyId: inputCompanyId } = {}) {
  const companyId = await resolveCompanyId(inputCompanyId);
  const company = await Company.findByPk(companyId, { raw: true });
  const now = DateTime.now();
  const startOfMonth = now.startOf('month');

  const bookings = await Booking.findAll({
    where: { companyId },
    order: [['scheduledStart', 'ASC']]
  });
  const bookingIds = bookings.map((booking) => booking.id);

  const [assignments, complianceDocs, inventoryAlerts, zones] = await Promise.all([
    BookingAssignment.findAll({ where: { bookingId: { [Op.in]: bookingIds } } }),
    ComplianceDocument.findAll({ where: { companyId } }),
    InventoryAlert.findAll({
      include: [
        {
          model: InventoryItem,
          attributes: ['id', 'name', 'companyId'],
          required: true,
          where: { companyId }
        }
      ],
      order: [['triggeredAt', 'DESC']],
      limit: 5
    }),
    ServiceZone.findAll({ where: { companyId }, attributes: ['id', 'name'], raw: true })
  ]);

  const monthBookings = bookings.filter((booking) =>
    booking.scheduledStart ? DateTime.fromJSDate(booking.scheduledStart) >= startOfMonth : false
  );
  const upcomingBookings = bookings.filter(
    (booking) => booking.scheduledStart && DateTime.fromJSDate(booking.scheduledStart) > now
  );
  const activeBookings = bookings.filter((booking) => ACTIVE_BOOKING_STATUSES.includes(booking.status));
  const completedBookings = bookings.filter((booking) => SLA_EVALUATION_STATUSES.includes(booking.status));

  const crews = new Map();
  for (const booking of bookings) {
    const crewName = booking.meta?.primaryCrew || booking.meta?.owner || 'Operations crew';
    const current = crews.get(crewName) ?? { name: crewName, bookings: [], upcoming: 0, csat: [] };
    current.bookings.push(booking);
    if (booking.scheduledStart && DateTime.fromJSDate(booking.scheduledStart) > now) {
      current.upcoming += 1;
    }
    if (Number.isFinite(booking.meta?.csat)) {
      current.csat.push(Number.parseFloat(booking.meta.csat));
    }
    crews.set(crewName, current);
  }

  const slaHits = completedBookings.filter((booking) => {
    if (!booking.lastStatusTransitionAt || !booking.slaExpiresAt) {
      return false;
    }
    const completedAt = DateTime.fromJSDate(booking.lastStatusTransitionAt);
    const sla = DateTime.fromJSDate(booking.slaExpiresAt);
    return completedAt <= sla;
  }).length;
  const slaTotal = completedBookings.filter((booking) => booking.slaExpiresAt).length || 1;
  const slaRate = slaHits / slaTotal;

  const responseDurations = [];
  for (const assignment of assignments) {
    if (assignment.acknowledgedAt) {
      const start = DateTime.fromJSDate(assignment.assignedAt);
      const ack = DateTime.fromJSDate(assignment.acknowledgedAt);
      responseDurations.push(Math.max(ack.diff(start, 'minutes').minutes, 0));
    }
  }
  if (responseDurations.length === 0) {
    for (const booking of bookings) {
      if (booking.scheduledStart && booking.lastStatusTransitionAt) {
        const assigned = DateTime.fromJSDate(booking.scheduledStart);
        const responded = DateTime.fromJSDate(booking.lastStatusTransitionAt);
        responseDurations.push(Math.max(responded.diff(assigned, 'minutes').minutes, 0));
      }
    }
  }

  const avgResponseMinutes = average(responseDurations, 45);
  const crewCount = Math.max(Array.from(crews.values()).length, 1);
  const utilisation = Math.min(activeBookings.length / crewCount, 1);

  const csatValues = bookings
    .map((booking) => (Number.isFinite(booking.meta?.csat) ? Number.parseFloat(booking.meta.csat) : null))
    .filter((value) => value != null);
  const satisfaction = csatValues.length > 0 ? average(csatValues) : (coerceNumber(company.complianceScore, 90) / 100);

  const monthRevenue = monthBookings.reduce((sum, booking) => sum + coerceNumber(booking.totalAmount), 0);
  const upcomingRevenue = upcomingBookings.reduce((sum, booking) => sum + coerceNumber(booking.totalAmount), 0);
  const outstanding = bookings
    .filter((booking) => booking.status !== 'completed')
    .reduce((sum, booking) => sum + coerceNumber(booking.commissionAmount), 0);

  const complianceExpiring = complianceDocs.filter((doc) => {
    if (!doc.expiryAt) return false;
    const expiry = DateTime.fromJSDate(doc.expiryAt);
    return expiry > now && expiry <= now.plus({ days: 30 });
  });

  const alerts = [];
  for (const alert of inventoryAlerts) {
    const itemName = alert.InventoryItem?.name ?? 'Inventory asset';
    alerts.push({
      id: `inventory-${alert.id}`,
      severity: alert.severity ?? 'medium',
      message: `${itemName} has a ${alert.type?.replace(/_/g, ' ') || 'pending alert'}.`,
      actionLabel: 'Review inventory',
      actionHref: `/inventory/items/${alert.InventoryItem?.id ?? ''}`
    });
  }

  if (complianceExpiring.length > 0) {
    alerts.push({
      id: 'compliance-expiry',
      severity: 'high',
      message: `${complianceExpiring.length} compliance artefact${
        complianceExpiring.length === 1 ? '' : 's'
      } expiring within 30 days.`
    });
  }

  const disputed = bookings.filter((booking) => booking.status === 'disputed');
  if (disputed.length > 0) {
    alerts.push({
      id: 'disputes-open',
      severity: 'medium',
      message: `${disputed.length} booking dispute${disputed.length === 1 ? '' : 's'} require attention.`
    });
  }

  const pipelineCompliance = [
    ...complianceExpiring.map((doc) => ({
      id: doc.id,
      name: doc.type,
      expiresOn: doc.expiryAt,
      owner: doc.metadata?.owner || company.contactName || 'Operations'
    })),
    ...complianceDocs
      .filter((doc) => doc.status === 'expired')
      .map((doc) => ({
        id: `${doc.id}-expired`,
        name: doc.type,
        expiresOn: doc.expiryAt,
        owner: doc.metadata?.owner || company.contactName || 'Operations'
      }))
  ].slice(0, 6);

  const providerSlug = toSlug(company.contactName, `company-${companyId.slice(0, 8)}`);

  return {
    data: {
      provider: {
        id: companyId,
        name: company.contactName || 'Provider',
        tradingName: company.contactName || company.marketplaceIntent || 'Provider',
        region: company.serviceRegions || 'United Kingdom',
        slug: providerSlug,
        onboardingStatus: company.verified ? 'active' : 'pending',
        supportEmail: company.contactEmail || null,
        supportPhone: null
      },
      metrics: {
        utilisation,
        slaHitRate: slaRate,
        avgResponseMinutes,
        activeBookings: activeBookings.length,
        satisfaction
      },
      finances: {
        monthToDate: monthRevenue,
        forecast: monthRevenue + upcomingRevenue,
        outstandingBalance: outstanding,
        nextPayoutDate: now.plus({ days: 7 }).toISODate()
      },
      alerts,
      pipeline: {
        upcomingBookings: upcomingBookings.slice(0, 8).map((booking) => ({
          id: booking.id,
          client: booking.meta?.requester || booking.meta?.customerName || 'Client partner',
          service: booking.meta?.title || 'Service request',
          eta: booking.scheduledStart ? DateTime.fromJSDate(booking.scheduledStart).toISO() : null,
          value: coerceNumber(booking.totalAmount, null),
          zone: booking.meta?.zoneName || zones.find((zone) => zone.id === booking.zoneId)?.name || 'Zone'
        })),
        expiringCompliance: pipelineCompliance
      },
      servicemen: Array.from(crews.values()).map((crew, index) => ({
        id: `${providerSlug}-crew-${index}`,
        name: crew.name,
        role: 'Field operations',
        availability: Math.max(0, 1 - crew.upcoming / 4),
        rating: crew.csat.length > 0 ? average(crew.csat, 0.9) : satisfaction
      }))
    },
    meta: {
      companyId,
      generatedAt: now.toISO(),
      hasLiveData: bookings.length > 0
    }
  };
}

export async function buildEnterprisePanel({ companyId: inputCompanyId } = {}) {
  const companyId = await resolveCompanyId(inputCompanyId);
  const company = await Company.findByPk(companyId, { raw: true });
  const now = DateTime.now();
  const startOfMonth = now.startOf('month');

  const [bookings, complianceDocs, serviceZones, services, campaignMetrics, campaignInvoices, fraudSignals, participants, rentals] =
    await Promise.all([
      Booking.findAll({ where: { companyId } }),
      ComplianceDocument.findAll({ where: { companyId } }),
      ServiceZone.findAll({ where: { companyId }, attributes: ['name'], raw: true }),
      Service.findAll({ where: { companyId } }),
      CampaignDailyMetric.findAll({
        include: [
          {
            model: AdCampaign,
            attributes: ['name', 'currency', 'companyId'],
            required: true,
            where: { companyId }
          }
        ],
        order: [['metricDate', 'DESC']],
        limit: 30
      }),
      CampaignInvoice.findAll({
        include: [
          {
            model: AdCampaign,
            attributes: ['name', 'companyId'],
            required: true,
            where: { companyId }
          }
        ],
        where: { status: { [Op.in]: ['issued', 'overdue'] } },
        order: [['dueDate', 'ASC']]
      }),
      CampaignFraudSignal.findAll({
        include: [
          {
            model: AdCampaign,
            attributes: ['name', 'companyId'],
            required: true,
            where: { companyId }
          }
        ],
        order: [['detectedAt', 'DESC']],
        limit: 5
      }),
      ConversationParticipant.findAll({
        where: { participantType: 'enterprise', participantReferenceId: companyId }
      }),
      RentalAgreement.findAll({ where: { companyId } })
    ]);

  const completedBookings = bookings.filter((booking) => SLA_EVALUATION_STATUSES.includes(booking.status));
  const slaHits = completedBookings.filter((booking) => {
    if (!booking.lastStatusTransitionAt || !booking.slaExpiresAt) {
      return false;
    }
    return DateTime.fromJSDate(booking.lastStatusTransitionAt) <= DateTime.fromJSDate(booking.slaExpiresAt);
  }).length;
  const slaTotal = completedBookings.filter((booking) => booking.slaExpiresAt).length || 1;

  const resolutionDurations = completedBookings
    .filter((booking) => booking.scheduledStart && booking.lastStatusTransitionAt)
    .map((booking) =>
      Math.max(
        DateTime.fromJSDate(booking.lastStatusTransitionAt).diff(DateTime.fromJSDate(booking.scheduledStart), 'hours').hours,
        0
      )
    );

  const incidents = bookings.filter((booking) => booking.status === 'disputed').length;

  const monthMetrics = campaignMetrics.filter((metric) => DateTime.fromJSDate(metric.metricDate) >= startOfMonth);
  const spend = monthMetrics.reduce((sum, metric) => sum + coerceNumber(metric.spend), 0);
  const revenue = monthMetrics.reduce((sum, metric) => sum + coerceNumber(metric.revenue), 0);
  const target = monthMetrics.reduce((sum, metric) => sum + coerceNumber(metric.spendTarget ?? metric.spend), 0);
  const savingsIdentified = Math.max(target - spend, 0);

  const enterpriseSlug = toSlug(company.contactName, `enterprise-${companyId.slice(0, 8)}`);

  return {
    data: {
      enterprise: {
        id: companyId,
        name: company.contactName || 'Enterprise account',
        sector: company.marketplaceIntent || 'Multi-site operations',
        accountManager: company.contactName || null,
        activeSites: serviceZones.length,
        serviceMix: Array.from(new Set(services.map((service) => service.category || 'Facilities service')))
      },
      delivery: {
        slaCompliance: slaHits / slaTotal,
        incidents,
        avgResolutionHours: average(resolutionDurations, 4),
        nps: Math.round((coerceNumber(company.complianceScore, 75) / 100) * 60)
      },
      spend: {
        monthToDate: spend,
        budgetPacing: target > 0 ? spend / target : 0,
        savingsIdentified,
        invoicesAwaitingApproval: campaignInvoices.map((invoice) => ({
          id: invoice.id,
          vendor: invoice.AdCampaign?.name || 'Campaign vendor',
          amount: coerceNumber(invoice.amountDue - invoice.amountPaid, invoice.amountDue),
          dueDate: invoice.dueDate,
          status: invoice.status
        }))
      },
      programmes: rentals.slice(0, 6).map((agreement) => ({
        id: agreement.id,
        name: agreement.rentalNumber || 'Programme',
        status: agreement.status,
        phase: agreement.depositStatus === 'held' ? 'Execution' : 'Planning',
        health: agreement.status === 'inspection_pending' ? 'at-risk' : 'on-track',
        lastUpdated: agreement.updatedAt
      })),
      escalations: fraudSignals.map((signal) => ({
        id: signal.id,
        title: `${signal.signalType?.replace(/_/g, ' ') || 'Campaign alert'} • ${signal.AdCampaign?.name ?? 'Campaign'}`,
        owner: signal.metadata?.owner || 'Marketing operations',
        openedAt: signal.detectedAt,
        severity: signal.severity || 'medium'
      })),
      enterpriseMeta: {
        campaignDays: campaignMetrics.length,
        communicationsParticipants: participants.length,
        revenue
      }
    },
    meta: {
      companyId,
      generatedAt: now.toISO(),
      slug: enterpriseSlug,
      hasLiveData: campaignMetrics.length > 0 || bookings.length > 0
    }
  };
}

export async function buildBusinessFront({ slug }) {
  const allCompanies = await Company.findAll();
  if (allCompanies.length === 0) {
    const error = new Error('company_not_found');
    error.statusCode = 404;
    throw error;
  }

  const resolved = slug === 'featured'
    ? allCompanies[0]
    : allCompanies.find((company) => {
        const candidateSlug = toSlug(company.contactName, `company-${company.id.slice(0, 8)}`);
        return candidateSlug === slug || company.id === slug;
      }) || allCompanies[0];

  const [bookings, services, complianceDocs, serviceZones] = await Promise.all([
    Booking.findAll({ where: { companyId: resolved.id }, order: [['createdAt', 'DESC']], limit: 12 }),
    Service.findAll({ where: { companyId: resolved.id }, limit: 6 }),
    ComplianceDocument.findAll({ where: { companyId: resolved.id, status: 'approved' } }),
    ServiceZone.findAll({ where: { companyId: resolved.id }, attributes: ['name'], raw: true })
  ]);

  const slugified = toSlug(resolved.contactName, `company-${resolved.id.slice(0, 8)}`);
  const now = DateTime.now();
  const stats = [
    {
      id: 'completed-bookings',
      label: 'Completed jobs',
      value: bookings.filter((booking) => booking.status === 'completed').length,
      format: 'number',
      caption: 'Delivered with escrow-backed assurance'
    },
    {
      id: 'sla-performance',
      label: 'SLA compliance',
      value: bookings.length === 0
        ? 0.95
        : bookings.filter((booking) => {
            if (!booking.slaExpiresAt || !booking.lastStatusTransitionAt) {
              return false;
            }
            return DateTime.fromJSDate(booking.lastStatusTransitionAt) <= DateTime.fromJSDate(booking.slaExpiresAt);
          }).length / Math.max(bookings.filter((booking) => booking.slaExpiresAt).length, 1),
      format: 'percent',
      caption: 'Measured across live contracts'
    },
    {
      id: 'avg-response',
      label: 'Median response time',
      value: average(
        bookings
          .filter((booking) => booking.scheduledStart && booking.lastStatusTransitionAt)
          .map((booking) =>
            Math.max(
              DateTime.fromJSDate(booking.lastStatusTransitionAt).diff(DateTime.fromJSDate(booking.scheduledStart), 'minutes')
                .minutes,
              0
            )
          ),
        45
      ),
      format: 'minutes',
      caption: 'From dispatch to acknowledgment'
    }
  ];

  const testimonials = bookings
    .filter((booking) => booking.status === 'completed')
    .slice(0, 3)
    .map((booking, index) => ({
      id: booking.id || `testimonial-${index}`,
      quote: booking.meta?.feedback || 'Outstanding communication and quality delivery.',
      client: booking.meta?.requester || 'Operations partner',
      role: booking.meta?.zoneName || 'Facilities Manager'
    }));

  if (testimonials.length === 0) {
    testimonials.push({
      id: 'default-testimonial',
      quote: 'Escrow-backed delivery that keeps our campuses running without disruption.',
      client: resolved.contactName || 'Enterprise client',
      role: resolved.marketplaceIntent || 'Facilities Director'
    });
  }

  const packages = services.map((service, index) => ({
    id: service.id || `package-${index}`,
    name: service.title,
    description: service.description || 'Service package tailored for multi-site operations.',
    price: coerceNumber(service.price, null),
    currency: service.currency || 'GBP',
    highlights: [
      service.category ? `${service.category} specialists` : 'Specialist crew',
      'Escrow-backed milestones',
      'Telemetry dashboard access'
    ]
  }));

  const certifications = complianceDocs.map((doc) => ({
    id: doc.id,
    name: doc.type,
    issuer: doc.metadata?.issuer || 'Accreditation body',
    expiresOn: doc.expiryAt
  }));

  const gallery = serviceZones.slice(0, 4).map((zone, index) => ({
    id: `zone-${index}`,
    title: `${zone.name} operations`,
    description: 'Escrow-backed delivery in this territory.',
    image: `/media/${slugified}/zone-${index + 1}.jpg`
  }));

  return {
    data: {
      slug: slugified,
      hero: {
        name: resolved.contactName || 'Featured provider',
        strapline:
          resolved.marketplaceIntent || 'Escrow-backed field services delivered across the United Kingdom.',
        locations: resolved.serviceRegions ? resolved.serviceRegions.split(',').map((region) => region.trim()) : [],
        media: {
          heroImage: `/media/${slugified}/hero.jpg`
        }
      },
      stats,
      testimonials,
      packages,
      certifications,
      gallery,
      support: {
        email: resolved.contactEmail || null,
        phone: null,
        concierge: `Account managed by ${resolved.contactName || 'Fixnado concierge'}`
      }
    },
    meta: {
      companyId: resolved.id,
      generatedAt: now.toISO(),
      source: 'live'
    }
  };
}

