import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import {
  Booking,
  Company,
  InventoryAlert,
  InventoryItem,
  MarketplaceItem,
  MarketplaceModerationAction,
  RentalAgreement,
  Service,
  ServiceZone,
  User
} from '../models/index.js';

function buildHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function resolveCompany(companyId) {
  if (!companyId) {
    throw buildHttpError(400, 'company_id_required');
  }

  const company = await Company.findByPk(companyId, {
    include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'type'] }]
  });

  if (!company) {
    throw buildHttpError(404, 'company_not_found');
  }

  return company;
}

export async function resolveCompanyId(companyId) {
  if (companyId) {
    return companyId;
  }

  const fallback = await Company.findOne({ attributes: ['id'], order: [['createdAt', 'ASC']] });
  if (!fallback) {
    throw buildHttpError(404, 'company_not_found');
  }

  return fallback.id;
}

async function resolveActor(actor) {
  if (!actor?.id) {
    throw buildHttpError(401, 'unauthorised');
  }

  const record = await User.findByPk(actor.id, { attributes: ['id', 'type'] });
  if (!record) {
    throw buildHttpError(401, 'unauthorised');
  }

  return record;
}

function ensureActorCanManageCompany(company, actor) {
  if (actor.type === 'admin') {
    return;
  }

  if (actor.type === 'company' && actor.id === company.userId) {
    return;
  }

  throw buildHttpError(403, 'forbidden');
}

function formatBookingForPipeline(booking, timezone) {
  const when = booking.scheduledStart ? DateTime.fromJSDate(booking.scheduledStart).setZone(timezone) : null;
  return {
    id: booking.id,
    status: booking.status,
    service: booking.meta?.title ?? 'Scheduled job',
    scheduledStart: when?.toISO?.({ suppressMilliseconds: true }) ?? null,
    zoneId: booking.zoneId
  };
}

function formatInventorySummary(items = []) {
  const summary = items.reduce(
    (acc, item) => {
      const onHand = Number.parseInt(item.quantityOnHand ?? 0, 10);
      const reserved = Number.parseInt(item.quantityReserved ?? 0, 10);
      const safety = Number.parseInt(item.safetyStock ?? 0, 10);

      return {
        skuCount: acc.skuCount + 1,
        onHand: acc.onHand + (Number.isFinite(onHand) ? onHand : 0),
        reserved: acc.reserved + (Number.isFinite(reserved) ? reserved : 0),
        safety: acc.safety + (Number.isFinite(safety) ? safety : 0)
      };
    },
    { skuCount: 0, onHand: 0, reserved: 0, safety: 0 }
  );

  return {
    ...summary,
    available: Math.max(summary.onHand - summary.reserved, 0)
  };
}

export async function buildProviderDashboard({ companyId, actor } = {}) {
  const company = await resolveCompany(companyId);
  const actorRecord = await resolveActor(actor);
  ensureActorCanManageCompany(company, actorRecord);

  const now = DateTime.now().setZone('UTC');
  const windowStart = now.minus({ days: 30 });

  const [bookings, alerts, inventory, zones, listings] = await Promise.all([
    Booking.findAll({
      where: {
        companyId: company.id,
        createdAt: { [Op.gte]: windowStart.toJSDate() }
      }
    }),
    InventoryAlert.findAll({
      where: {
        status: { [Op.not]: 'resolved' }
      },
      include: [
        {
          model: InventoryItem,
          attributes: ['id', 'name', 'companyId'],
          where: { companyId: company.id },
          required: true
        }
      ]
    }),
    InventoryItem.findAll({ where: { companyId: company.id } }),
    ServiceZone.findAll({ where: { companyId: company.id }, limit: 5 }),
    MarketplaceItem.findAll({ where: { companyId: company.id }, limit: 5 })
  ]);

  const activeBookings = bookings.filter((booking) =>
    ['pending', 'awaiting_assignment', 'scheduled', 'in_progress'].includes(booking.status)
  );
  const completedBookings = bookings.filter((booking) => booking.status === 'completed');

  const upcomingBookings = bookings
    .filter((booking) => booking.scheduledStart && new Date(booking.scheduledStart) > new Date())
    .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart))
    .slice(0, 5)
    .map((booking) => formatBookingForPipeline(booking, 'Europe/London'));

  const alertsOpen = alerts.filter((alert) => alert.status === 'active').length;
  const inventorySummary = formatInventorySummary(inventory);

  const data = {
    provider: {
      tradingName: company.contactName || company.User?.firstName || 'Fixnado Provider',
      serviceRegions: company.serviceRegions ?? '',
      verified: Boolean(company.verified),
      complianceScore: company.complianceScore ?? null
    },
    metrics: {
      activeBookings: activeBookings.length,
      completedBookings: completedBookings.length,
      openAlerts: alertsOpen,
      managedListings: listings.length,
      inventorySkus: inventorySummary.skuCount
    },
    pipeline: {
      upcomingBookings,
      activeZones: zones.map((zone) => ({ id: zone.id, name: zone.name, demand: zone.demandLevel ?? null }))
    },
    inventory: {
      summary: inventorySummary,
      alerts: alerts.slice(0, 5).map((alert) => ({
        id: alert.id,
        itemId: alert.itemId,
        type: alert.type,
        status: alert.status,
        severity: alert.severity,
        triggeredAt: alert.triggeredAt?.toISOString?.() ?? null
      }))
    },
    marketplace: {
      listings: listings.map((listing) => ({
        id: listing.id,
        title: listing.title,
        status: listing.status,
        availability: listing.availability,
        pricePerDay: listing.pricePerDay
      }))
    }
  };

  const meta = {
    companyId: company.id,
    generatedAt: now.toISO({ suppressMilliseconds: true }),
    window: {
      start: windowStart.toISO({ suppressMilliseconds: true }),
      end: now.toISO({ suppressMilliseconds: true })
    }
  };

  return { data, meta };
}

function buildHero(company) {
  return {
    name: company.contactName || company.User?.firstName || 'Featured Provider',
    tagline: company.marketplaceIntent || 'Trusted resilience partner',
    regions: company.serviceRegions?.split(',').map((value) => value.trim()).filter(Boolean) ?? [],
    verified: Boolean(company.verified)
  };
}

function buildPackages(services = []) {
  if (!services.length) {
    return [
      {
        title: 'Rapid response package',
        description: 'Emergency response crews with telemetry-backed tooling.',
        startingFrom: 0,
        category: 'General'
      }
    ];
  }

  return services.slice(0, 4).map((service) => ({
    id: service.id,
    title: service.title,
    description: service.description,
    category: service.category,
    startingFrom: Number.parseFloat(service.price ?? service.pricePerDay ?? 0)
  }));
}

function buildStats(bookings, rentals, company) {
  const totalBookings = bookings.length;
  const activeRentals = rentals.filter((rental) => ['in_use', 'pickup_scheduled'].includes(rental.status)).length;
  const compliance = Math.round(company.complianceScore ?? 0);

  return [
    { label: 'Jobs completed last 30 days', value: totalBookings, helper: 'Completed work orders' },
    { label: 'Assets currently deployed', value: activeRentals, helper: 'Rental agreements in progress' },
    { label: 'Compliance score', value: compliance, helper: 'Verified evidence across programmes' }
  ];
}

function buildTimeline(actions = []) {
  return actions.slice(0, 6).map((action) => ({
    id: action.id,
    listingId: action.entityId,
    listingTitle: action.metadata?.title ?? action.action,
    status: action.metadata?.status ?? action.action,
    occurredAt: action.createdAt?.toISOString?.() ?? null
  }));
}

export async function buildBusinessFront({ slug = 'featured', viewerType } = {}) {
  let company;

  if (slug === 'featured') {
    company = await Company.findOne({
      order: [
        ['verified', 'DESC'],
        ['complianceScore', 'DESC'],
        ['createdAt', 'ASC']
      ],
      include: [{ model: User, attributes: ['firstName', 'lastName'] }]
    });
  } else if (/^[0-9a-fA-F-]{36}$/.test(slug)) {
    company = await Company.findByPk(slug, {
      include: [{ model: User, attributes: ['firstName', 'lastName'] }]
    });
  } else {
    const candidate = slug.replace(/-/g, ' ').trim();
    company = await Company.findOne({
      where: { contactName: { [Op.like]: `%${candidate}%` } },
      include: [{ model: User, attributes: ['firstName', 'lastName'] }]
    });
  }

  if (!company) {
    throw buildHttpError(404, 'company_not_found');
  }

  const windowEnd = DateTime.now().setZone('UTC');
  const windowStart = windowEnd.minus({ days: 90 });

  const [services, bookings, rentals, listings] = await Promise.all([
    Service.findAll({ where: { companyId: company.id }, limit: 6 }),
    Booking.findAll({
      where: {
        companyId: company.id,
        status: 'completed',
        lastStatusTransitionAt: { [Op.gte]: windowStart.toJSDate() }
      }
    }),
    RentalAgreement.findAll({ where: { companyId: company.id } }),
    MarketplaceItem.findAll({ where: { companyId: company.id }, limit: 6 })
  ]);

  const listingIds = listings.map((listing) => listing.id);
  const actions = listingIds.length
    ? await MarketplaceModerationAction.findAll({
        where: { entity_id: { [Op.in]: listingIds } },
        order: [['createdAt', 'DESC']],
        limit: 10
      })
    : [];

  const data = {
    hero: buildHero(company),
    stats: buildStats(bookings, rentals, company),
    packages: buildPackages(services),
    listings: listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      status: listing.status,
      availability: listing.availability,
      pricePerDay: listing.pricePerDay,
      insuredOnly: listing.insuredOnly
    })),
    timeline: buildTimeline(actions),
    viewer: viewerType ?? null
  };

  const meta = {
    slug,
    companyId: company.id,
    generatedAt: windowEnd.toISO({ suppressMilliseconds: true })
  };

  return { data, meta };
}
