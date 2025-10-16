import bcrypt from 'bcrypt';
import slugify from 'slugify';
import { DateTime } from 'luxon';
import { Op, fn, col, where as sequelizeWhere } from 'sequelize';
import {
  sequelize,
  ProviderProfile,
  ProviderContact,
  ProviderCoverage,
  Company,
  Service,
  ServiceZone,
  ComplianceDocument,
  Region,
  Booking,
  Dispute,
  User
} from '../models/index.js';

const SALT_ROUNDS = 10;

const PROVIDER_STATUSES = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' }
];

const ONBOARDING_STAGES = [
  { value: 'intake', label: 'Intake' },
  { value: 'documents', label: 'Document collection' },
  { value: 'compliance', label: 'Compliance review' },
  { value: 'go-live', label: 'Go-live preparation' },
  { value: 'live', label: 'Live' }
];

const PROVIDER_TIERS = [
  { value: 'standard', label: 'Standard' },
  { value: 'preferred', label: 'Preferred' },
  { value: 'strategic', label: 'Strategic' }
];

const RISK_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

const COVERAGE_TYPES = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'standby', label: 'Standby' }
];

const INSURED_STATUSES = [
  { value: 'not_started', label: 'Not started' },
  { value: 'pending_documents', label: 'Pending documents' },
  { value: 'in_review', label: 'In review' },
  { value: 'approved', label: 'Approved' },
  { value: 'suspended', label: 'Suspended' }
];

const STATUS_LABELS = new Map(PROVIDER_STATUSES.map((option) => [option.value, option.label]));
const STAGE_LABELS = new Map(ONBOARDING_STAGES.map((option) => [option.value, option.label]));
const TIER_LABELS = new Map(PROVIDER_TIERS.map((option) => [option.value, option.label]));
const RISK_LABELS = new Map(RISK_LEVELS.map((option) => [option.value, option.label]));
const COVERAGE_LABELS = new Map(COVERAGE_TYPES.map((option) => [option.value, option.label]));
const INSURED_LABELS = new Map(INSURED_STATUSES.map((option) => [option.value, option.label]));

function toPlain(instance) {
  if (!instance) return null;
  return instance.get ? instance.get({ plain: true }) : instance;
}

function generateStorefrontSlug(displayName) {
  if (!displayName) {
    return null;
  }
  const base = slugify(displayName, { lower: true, strict: true }) || 'provider';
  const timestamp = Date.now().toString(36).slice(-4);
  return `${base}-${timestamp}`;
}

function normaliseNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}

function buildSearchFilter(search) {
  if (!search || typeof search !== 'string') {
    return null;
  }
  const trimmed = search.trim();
  if (!trimmed) {
    return null;
  }
  const pattern = `%${trimmed.toLowerCase()}%`;
  return {
    [Op.or]: [
      sequelizeWhere(fn('lower', col('ProviderProfile.display_name')), { [Op.like]: pattern }),
      sequelizeWhere(fn('lower', col('ProviderProfile.trading_name')), { [Op.like]: pattern })
    ]
  };
}

function buildSummary(profiles) {
  const statusCounts = new Map();
  const stageCounts = new Map();
  const tierCounts = new Map();
  const riskCounts = new Map();
  const insuredCounts = new Map();
  let complianceAccumulator = 0;
  let total = 0;
  let lastUpdatedAt = null;

  profiles.forEach((profile) => {
    const company = profile.company ?? {};
    total += 1;
    const status = profile.status ?? 'prospect';
    const stage = profile.onboardingStage ?? 'intake';
    const tier = profile.tier ?? 'standard';
    const risk = profile.riskRating ?? 'medium';
    const insured = company.insuredSellerStatus ?? 'not_started';

    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
    stageCounts.set(stage, (stageCounts.get(stage) ?? 0) + 1);
    tierCounts.set(tier, (tierCounts.get(tier) ?? 0) + 1);
    riskCounts.set(risk, (riskCounts.get(risk) ?? 0) + 1);
    insuredCounts.set(insured, (insuredCounts.get(insured) ?? 0) + 1);

    complianceAccumulator += normaliseNumber(company.complianceScore, 0);

    const updatedAt = profile.updatedAt ?? company.updatedAt;
    if (updatedAt) {
      const timestamp = new Date(updatedAt).getTime();
      if (Number.isFinite(timestamp)) {
        if (!lastUpdatedAt || timestamp > lastUpdatedAt) {
          lastUpdatedAt = timestamp;
        }
      }
    }
  });

  const formatEntries = (entries, labelMap) =>
    Array.from(entries.entries()).map(([value, count]) => ({
      value,
      label: labelMap.get(value) ?? value,
      count
    }));

  return {
    total,
    statusBreakdown: formatEntries(statusCounts, STATUS_LABELS),
    onboardingBreakdown: formatEntries(stageCounts, STAGE_LABELS),
    tierBreakdown: formatEntries(tierCounts, TIER_LABELS),
    riskBreakdown: formatEntries(riskCounts, RISK_LABELS),
    insuredBreakdown: formatEntries(insuredCounts, INSURED_LABELS),
    averageComplianceScore: total > 0 ? complianceAccumulator / total : 0,
    lastUpdatedAt: lastUpdatedAt ? new Date(lastUpdatedAt).toISOString() : null
  };
}

function serialiseProvider(profile, aggregates) {
  const company = profile.company ?? {};
  const provider = toPlain(profile);
  const region = company.region ? toPlain(company.region) : null;
  const coverageCount = aggregates.coverage.get(company.id) ?? 0;
  const contactCount = aggregates.contacts.get(company.id) ?? 0;
  const serviceCount = aggregates.services.get(company.id) ?? 0;

  return {
    id: company.id,
    profileId: provider.id,
    displayName: provider.displayName,
    tradingName: provider.tradingName,
    status: provider.status,
    statusLabel: STATUS_LABELS.get(provider.status) ?? provider.status,
    onboardingStage: provider.onboardingStage,
    onboardingStageLabel: STAGE_LABELS.get(provider.onboardingStage) ?? provider.onboardingStage,
    tier: provider.tier,
    tierLabel: TIER_LABELS.get(provider.tier) ?? provider.tier,
    riskRating: provider.riskRating,
    riskLabel: RISK_LABELS.get(provider.riskRating) ?? provider.riskRating,
    supportEmail: provider.supportEmail ?? company.contactEmail ?? null,
    supportPhone: provider.supportPhone ?? null,
    storefrontSlug: provider.storefrontSlug ?? null,
    coverageCount,
    contactCount,
    servicesCount: serviceCount,
    averageRating: normaliseNumber(provider.averageRating, 0),
    jobsCompleted: normaliseNumber(provider.jobsCompleted, 0),
    complianceScore: normaliseNumber(company.complianceScore, 0),
    verified: Boolean(company.verified),
    insuredStatus: company.insuredSellerStatus ?? 'not_started',
    insuredStatusLabel: INSURED_LABELS.get(company.insuredSellerStatus ?? 'not_started'),
    insuredBadgeVisible: Boolean(company.insuredSellerBadgeVisible),
    lastReviewAt: provider.lastReviewAt ? new Date(provider.lastReviewAt).toISOString() : null,
    updatedAt: provider.updatedAt ? new Date(provider.updatedAt).toISOString() : null,
    createdAt: provider.createdAt ? new Date(provider.createdAt).toISOString() : null,
    region: region
      ? {
          id: region.id,
          name: region.name,
          code: region.code
        }
      : null
  };
}

function mapContact(contact) {
  const payload = toPlain(contact);
  return {
    id: payload.id,
    name: payload.name,
    role: payload.role,
    email: payload.email,
    phone: payload.phone,
    type: payload.type,
    isPrimary: Boolean(payload.isPrimary),
    notes: payload.notes ?? null,
    avatarUrl: payload.avatarUrl ?? null,
    createdAt: payload.createdAt ? new Date(payload.createdAt).toISOString() : null,
    updatedAt: payload.updatedAt ? new Date(payload.updatedAt).toISOString() : null
  };
}

function mapCoverage(coverage) {
  const payload = toPlain(coverage);
  const zone = coverage.zone ? toPlain(coverage.zone) : null;
  return {
    id: payload.id,
    zoneId: payload.zoneId,
    coverageType: payload.coverageType,
    coverageTypeLabel: COVERAGE_LABELS.get(payload.coverageType) ?? payload.coverageType,
    slaMinutes: normaliseNumber(payload.slaMinutes, 0),
    maxCapacity: normaliseNumber(payload.maxCapacity, 0),
    effectiveFrom: payload.effectiveFrom ? new Date(payload.effectiveFrom).toISOString() : null,
    effectiveTo: payload.effectiveTo ? new Date(payload.effectiveTo).toISOString() : null,
    notes: payload.notes ?? null,
    zone: zone
      ? {
          id: zone.id,
          name: zone.name,
          companyId: zone.companyId
        }
      : null,
    createdAt: payload.createdAt ? new Date(payload.createdAt).toISOString() : null,
    updatedAt: payload.updatedAt ? new Date(payload.updatedAt).toISOString() : null
  };
}

function mapDocument(document) {
  const payload = toPlain(document);
  return {
    id: payload.id,
    type: payload.type,
    status: payload.status,
    fileName: payload.fileName,
    fileSizeBytes: payload.fileSizeBytes,
    mimeType: payload.mimeType,
    issuedAt: payload.issuedAt ? new Date(payload.issuedAt).toISOString() : null,
    expiryAt: payload.expiryAt ? new Date(payload.expiryAt).toISOString() : null,
    submittedAt: payload.submittedAt ? new Date(payload.submittedAt).toISOString() : null,
    reviewedAt: payload.reviewedAt ? new Date(payload.reviewedAt).toISOString() : null,
    reviewerId: payload.reviewerId ?? null,
    rejectionReason: payload.rejectionReason ?? null,
    metadata: payload.metadata ?? {},
    downloadUrl: `/api/v1/compliance/documents/${payload.id}/download`
  };
}

function mapService(service) {
  const payload = toPlain(service);
  return {
    id: payload.id,
    title: payload.title,
    category: payload.category ?? null,
    price: payload.price != null ? Number(payload.price) : null,
    currency: payload.currency ?? 'GBP',
    createdAt: payload.createdAt ? new Date(payload.createdAt).toISOString() : null,
    updatedAt: payload.updatedAt ? new Date(payload.updatedAt).toISOString() : null
  };
}

export async function listProviders({ limit = 50, offset = 0, status, search } = {}) {
  const where = {};
  if (status) {
    where.status = status;
  }
  const searchFilter = buildSearchFilter(search);
  if (searchFilter) {
    Object.assign(where, searchFilter);
  }

  const [total, profiles, coverageCounts, contactCounts, serviceCounts, regions] = await Promise.all([
    ProviderProfile.count({ where }),
    ProviderProfile.findAll({
      where,
      include: [
        {
          model: Company,
          as: 'company',
          attributes: [
            'id',
            'contactName',
            'contactEmail',
            'verified',
            'insuredSellerStatus',
            'insuredSellerBadgeVisible',
            'complianceScore',
            'regionId',
            'updatedAt',
            'createdAt'
          ],
          include: [
            {
              model: Region,
              as: 'region',
              attributes: ['id', 'name', 'code'],
              required: false
            }
          ]
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit,
      offset
    }),
    ProviderCoverage.findAll({
      attributes: ['companyId', [fn('COUNT', col('id')), 'count']],
      group: ['company_id']
    }),
    ProviderContact.findAll({
      attributes: ['companyId', [fn('COUNT', col('id')), 'count']],
      group: ['company_id']
    }),
    Service.findAll({
      attributes: ['companyId', [fn('COUNT', col('id')), 'count']],
      group: ['company_id']
    }),
    Region.findAll({ attributes: ['id', 'name', 'code'], order: [['name', 'ASC']] })
  ]);

  const aggregates = {
    coverage: new Map(),
    contacts: new Map(),
    services: new Map()
  };

  coverageCounts.forEach((entry) => {
    aggregates.coverage.set(entry.companyId, Number(entry.get('count')));
  });
  contactCounts.forEach((entry) => {
    aggregates.contacts.set(entry.companyId, Number(entry.get('count')));
  });
  serviceCounts.forEach((entry) => {
    aggregates.services.set(entry.companyId, Number(entry.get('count')));
  });

  const summary = buildSummary(profiles);
  summary.total = total;

  return {
    summary,
    providers: profiles.map((profile) => serialiseProvider(profile, aggregates)),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + profiles.length < total
    },
    enums: {
      statuses: PROVIDER_STATUSES,
      onboardingStages: ONBOARDING_STAGES,
      tiers: PROVIDER_TIERS,
      riskLevels: RISK_LEVELS,
      coverageTypes: COVERAGE_TYPES,
      insuredStatuses: INSURED_STATUSES,
      regions: regions.map((region) => ({
        id: region.id,
        name: region.name,
        code: region.code
      }))
    }
  };
}

export async function createProvider({ owner, company = {}, profile = {}, contacts = [], coverage = [] }) {
  if (!owner?.firstName || !owner?.lastName || !owner?.email || !owner?.temporaryPassword) {
    throw new Error('Owner details incomplete');
  }

  return sequelize.transaction(async (transaction) => {
    const existingUser = await User.findOne({ where: { email: owner.email }, transaction, lock: transaction.LOCK.UPDATE });
    if (existingUser) {
      throw new Error('Email already in use');
    }

    const passwordHash = await bcrypt.hash(owner.temporaryPassword, SALT_ROUNDS);
    const user = await User.create(
      {
        firstName: owner.firstName,
        lastName: owner.lastName,
        email: owner.email,
        passwordHash,
        type: 'provider_admin',
        address: owner.address ?? null,
        age: owner.age ?? null,
        regionId: owner.regionId ?? null
      },
      { transaction }
    );

    const createdCompany = await Company.create(
      {
        userId: user.id,
        legalStructure: company.legalStructure ?? 'company',
        contactName: company.contactName ?? `${owner.firstName} ${owner.lastName}`.trim(),
        contactEmail: company.contactEmail ?? owner.email,
        serviceRegions: company.serviceRegions ?? '',
        marketplaceIntent: company.marketplaceIntent ?? '',
        verified: Boolean(company.verified),
        insuredSellerStatus: company.insuredSellerStatus ?? 'not_started',
        insuredSellerBadgeVisible: Boolean(company.insuredSellerBadgeVisible),
        complianceScore: company.complianceScore ?? 0,
        regionId: company.regionId ?? null
      },
      { transaction }
    );

    const storefrontSlug = profile.storefrontSlug ?? generateStorefrontSlug(profile.displayName ?? company.contactName);

    await ProviderProfile.create(
      {
        companyId: createdCompany.id,
        displayName: profile.displayName ?? createdCompany.contactName ?? 'Provider',
        tradingName: profile.tradingName ?? profile.displayName ?? createdCompany.contactName,
        status: profile.status ?? 'onboarding',
        onboardingStage: profile.onboardingStage ?? 'intake',
        tier: profile.tier ?? 'standard',
        riskRating: profile.riskRating ?? 'medium',
        supportEmail: profile.supportEmail ?? createdCompany.contactEmail,
        supportPhone: profile.supportPhone ?? null,
        websiteUrl: profile.websiteUrl ?? null,
        logoUrl: profile.logoUrl ?? null,
        heroImageUrl: profile.heroImageUrl ?? null,
        storefrontSlug,
        operationsNotes: profile.operationsNotes ?? null,
        coverageNotes: profile.coverageNotes ?? null,
        averageRating: profile.averageRating ?? 0,
        jobsCompleted: profile.jobsCompleted ?? 0,
        lastReviewAt: profile.lastReviewAt ?? null,
        tags: Array.isArray(profile.tags) ? profile.tags : []
      },
      { transaction }
    );

    const contactSeed = Array.isArray(contacts) && contacts.length
      ? contacts
      : [
          {
            name: `${owner.firstName} ${owner.lastName}`.trim(),
            email: owner.email,
            phone: owner.phone ?? null,
            role: 'Primary contact',
            type: 'owner',
            isPrimary: true
          }
        ];

    await Promise.all(
      contactSeed.map((contact) =>
        ProviderContact.create(
          {
            companyId: createdCompany.id,
            name: contact.name,
            email: contact.email ?? null,
            phone: contact.phone ?? null,
            role: contact.role ?? 'Contact',
            type: contact.type ?? 'operations',
            isPrimary: Boolean(contact.isPrimary),
            notes: contact.notes ?? null,
            avatarUrl: contact.avatarUrl ?? null
          },
          { transaction }
        )
      )
    );

    await Promise.all(
      (coverage ?? []).map((item) =>
        ProviderCoverage.create(
          {
            companyId: createdCompany.id,
            zoneId: item.zoneId,
            coverageType: item.coverageType ?? 'primary',
            slaMinutes: item.slaMinutes ?? 240,
            maxCapacity: item.maxCapacity ?? 0,
            effectiveFrom: item.effectiveFrom ?? null,
            effectiveTo: item.effectiveTo ?? null,
            notes: item.notes ?? null,
            metadata: item.metadata ?? {}
          },
          { transaction }
        )
      )
    );

    return getProvider(createdCompany.id, { transaction });
  });
}

export async function getProvider(companyId, { transaction } = {}) {
  const profile = await ProviderProfile.findOne({
    where: { companyId },
    include: [
      {
        model: Company,
        as: 'company',
        include: [
          {
            model: Region,
            as: 'region',
            attributes: ['id', 'name', 'code'],
            required: false
          }
        ]
      }
    ],
    transaction
  });

  if (!profile) {
    throw new Error('Provider not found');
  }

  const company = profile.company;

  const [contacts, coverageEntries, documents, services, activeBookings, completed30d, openDisputes, zones] = await Promise.all([
    ProviderContact.findAll({
      where: { companyId },
      order: [
        ['isPrimary', 'DESC'],
        ['name', 'ASC']
      ],
      transaction
    }),
    ProviderCoverage.findAll({
      where: { companyId },
      include: [
        {
          model: ServiceZone,
          as: 'zone',
          attributes: ['id', 'name', 'companyId']
        }
      ],
      order: [
        ['coverageType', 'ASC'],
        ['createdAt', 'DESC']
      ],
      transaction
    }),
    ComplianceDocument.findAll({
      where: { companyId },
      order: [['submittedAt', 'DESC']],
      limit: 25,
      transaction
    }),
    Service.findAll({
      where: { companyId },
      limit: 12,
      order: [['createdAt', 'DESC']],
      transaction
    }),
    Booking.count({
      where: {
        companyId,
        status: { [Op.in]: ['scheduled', 'in_progress'] }
      },
      transaction
    }),
    Booking.count({
      where: {
        companyId,
        status: 'completed',
        lastStatusTransitionAt: { [Op.gte]: DateTime.now().minus({ days: 30 }).toJSDate() }
      },
      transaction
    }),
    Dispute.count({
      where: {
        status: { [Op.notIn]: ['resolved', 'closed'] }
      },
      include: [
        {
          association: 'Escrow',
          required: true,
          include: [
            {
              association: 'Order',
              attributes: [],
              required: true,
              include: [
                {
                  association: 'Service',
                  attributes: [],
                  required: true,
                  where: { companyId }
                }
              ]
            }
          ]
        }
      ],
      transaction
    }),
    ServiceZone.findAll({
      attributes: ['id', 'name', 'companyId'],
      order: [['name', 'ASC']],
      limit: 200,
      transaction
    })
  ]);

  const aggregates = {
    activeBookings,
    completedBookings30d: completed30d,
    openDisputes
  };

  const provider = toPlain(profile);
  const companyPlain = toPlain(company);
  const region = companyPlain.region ? toPlain(companyPlain.region) : null;

  return {
    company: {
      id: companyPlain.id,
      legalStructure: companyPlain.legalStructure,
      contactName: companyPlain.contactName,
      contactEmail: companyPlain.contactEmail,
      serviceRegions: companyPlain.serviceRegions,
      marketplaceIntent: companyPlain.marketplaceIntent,
      verified: Boolean(companyPlain.verified),
      insuredSellerStatus: companyPlain.insuredSellerStatus,
      insuredSellerBadgeVisible: Boolean(companyPlain.insuredSellerBadgeVisible),
      complianceScore: normaliseNumber(companyPlain.complianceScore, 0),
      regionId: companyPlain.regionId ?? null,
      region: region
        ? {
            id: region.id,
            name: region.name,
            code: region.code
          }
        : null
    },
    profile: {
      id: provider.id,
      displayName: provider.displayName,
      tradingName: provider.tradingName,
      status: provider.status,
      onboardingStage: provider.onboardingStage,
      tier: provider.tier,
      riskRating: provider.riskRating,
      supportEmail: provider.supportEmail,
      supportPhone: provider.supportPhone,
      websiteUrl: provider.websiteUrl,
      logoUrl: provider.logoUrl,
      heroImageUrl: provider.heroImageUrl,
      storefrontSlug: provider.storefrontSlug,
      operationsNotes: provider.operationsNotes,
      coverageNotes: provider.coverageNotes,
      averageRating: normaliseNumber(provider.averageRating, 0),
      jobsCompleted: normaliseNumber(provider.jobsCompleted, 0),
      lastReviewAt: provider.lastReviewAt ? new Date(provider.lastReviewAt).toISOString() : null,
      tags: Array.isArray(provider.tags) ? provider.tags : []
    },
    contacts: contacts.map(mapContact),
    coverage: coverageEntries.map(mapCoverage),
    documents: documents.map(mapDocument),
    services: services.map(mapService),
    stats: {
      activeBookings: aggregates.activeBookings,
      completedBookings30d: aggregates.completedBookings30d,
      openDisputes: aggregates.openDisputes
    },
    links: {
      storefront: provider.storefrontSlug
        ? `/providers/${provider.storefrontSlug}`
        : `/provider/storefront?companyId=${companyPlain.id}`,
      dashboard: `/provider/dashboard?companyId=${companyPlain.id}`,
      compliance: `/admin/compliance?companyId=${companyPlain.id}`
    },
    enums: {
      statuses: PROVIDER_STATUSES,
      onboardingStages: ONBOARDING_STAGES,
      tiers: PROVIDER_TIERS,
      riskLevels: RISK_LEVELS,
      coverageTypes: COVERAGE_TYPES,
      insuredStatuses: INSURED_STATUSES,
      zones: zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        companyId: zone.companyId
      }))
    }
  };
}

export async function updateProvider(companyId, { company = {}, profile = {} } = {}) {
  return sequelize.transaction(async (transaction) => {
    const record = await ProviderProfile.findOne({
      where: { companyId },
      include: [{ model: Company, as: 'company' }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!record) {
      throw new Error('Provider not found');
    }

    if (company) {
      Object.assign(record.company, {
        contactName: company.contactName ?? record.company.contactName,
        contactEmail: company.contactEmail ?? record.company.contactEmail,
        serviceRegions: company.serviceRegions ?? record.company.serviceRegions,
        marketplaceIntent: company.marketplaceIntent ?? record.company.marketplaceIntent,
        verified:
          company.verified !== undefined ? Boolean(company.verified) : Boolean(record.company.verified),
        insuredSellerStatus: company.insuredSellerStatus ?? record.company.insuredSellerStatus,
        insuredSellerBadgeVisible:
          company.insuredSellerBadgeVisible !== undefined
            ? Boolean(company.insuredSellerBadgeVisible)
            : Boolean(record.company.insuredSellerBadgeVisible),
        complianceScore:
          company.complianceScore !== undefined
            ? company.complianceScore
            : record.company.complianceScore,
        regionId: company.regionId ?? record.company.regionId
      });
      await record.company.save({ transaction });
    }

    if (profile) {
      Object.assign(record, {
        displayName: profile.displayName ?? record.displayName,
        tradingName: profile.tradingName ?? record.tradingName,
        status: profile.status ?? record.status,
        onboardingStage: profile.onboardingStage ?? record.onboardingStage,
        tier: profile.tier ?? record.tier,
        riskRating: profile.riskRating ?? record.riskRating,
        supportEmail: profile.supportEmail ?? record.supportEmail,
        supportPhone: profile.supportPhone ?? record.supportPhone,
        websiteUrl: profile.websiteUrl ?? record.websiteUrl,
        logoUrl: profile.logoUrl ?? record.logoUrl,
        heroImageUrl: profile.heroImageUrl ?? record.heroImageUrl,
        storefrontSlug: profile.storefrontSlug ?? record.storefrontSlug ?? generateStorefrontSlug(record.displayName),
        operationsNotes: profile.operationsNotes ?? record.operationsNotes,
        coverageNotes: profile.coverageNotes ?? record.coverageNotes,
        averageRating:
          profile.averageRating !== undefined ? profile.averageRating : record.averageRating,
        jobsCompleted:
          profile.jobsCompleted !== undefined ? profile.jobsCompleted : record.jobsCompleted,
        lastReviewAt: profile.lastReviewAt ?? record.lastReviewAt,
        tags: Array.isArray(profile.tags) ? profile.tags : record.tags
      });
      await record.save({ transaction });
    }

    return getProvider(companyId, { transaction });
  });
}

export async function archiveProvider(companyId, options = {}) {
  const reason = typeof options?.reason === 'string' ? options.reason.trim() : '';
  const actor = typeof options?.actor === 'string' ? options.actor.trim() : '';

  return sequelize.transaction(async (transaction) => {
    const record = await ProviderProfile.findOne({
      where: { companyId },
      include: [
        {
          model: Company,
          as: 'company',
          include: [{ model: Region, as: 'region' }]
        }
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!record) {
      throw new Error('Provider not found');
    }

    if (record.status === 'archived') {
      return getProvider(companyId, { transaction });
    }

    record.status = 'archived';
    if (record.onboardingStage !== 'live') {
      record.onboardingStage = 'live';
    }

    const timestamp = DateTime.utc().toISO();
    const entryParts = [`Archived${actor ? ` by ${actor}` : ''}`];
    if (reason) {
      entryParts.push(reason);
    }
    const entry = `[${timestamp}] ${entryParts.join(' — ')}`;
    record.operationsNotes = record.operationsNotes ? `${entry}\n${record.operationsNotes}` : entry;

    await record.save({ transaction });

    if (record.company) {
      record.company.verified = false;
      record.company.insuredSellerBadgeVisible = false;
      await record.company.save({ transaction });
    }

    return getProvider(companyId, { transaction });
  });
}

export async function upsertProviderContact(companyId, contactId, payload) {
  if (!payload?.name) {
    throw new Error('Contact name required');
  }

  return sequelize.transaction(async (transaction) => {
    const provider = await ProviderProfile.findOne({ where: { companyId }, transaction });
    if (!provider) {
      throw new Error('Provider not found');
    }

    let contact;
    if (contactId) {
      contact = await ProviderContact.findOne({ where: { id: contactId, companyId }, transaction });
      if (!contact) {
        throw new Error('Contact not found');
      }
      Object.assign(contact, {
        name: payload.name,
        role: payload.role ?? contact.role,
        email: payload.email ?? contact.email,
        phone: payload.phone ?? contact.phone,
        type: payload.type ?? contact.type,
        isPrimary: payload.isPrimary !== undefined ? Boolean(payload.isPrimary) : contact.isPrimary,
        notes: payload.notes ?? contact.notes,
        avatarUrl: payload.avatarUrl ?? contact.avatarUrl
      });
      await contact.save({ transaction });
    } else {
      contact = await ProviderContact.create(
        {
          companyId,
          name: payload.name,
          role: payload.role ?? 'Contact',
          email: payload.email ?? null,
          phone: payload.phone ?? null,
          type: payload.type ?? 'operations',
          isPrimary: Boolean(payload.isPrimary),
          notes: payload.notes ?? null,
          avatarUrl: payload.avatarUrl ?? null
        },
        { transaction }
      );
    }

    if (contact.isPrimary) {
      await ProviderContact.update(
        { isPrimary: false },
        {
          where: {
            companyId,
            id: { [Op.ne]: contact.id }
          },
          transaction
        }
      );
    }

    return mapContact(contact);
  });
}

export async function deleteProviderContact(companyId, contactId) {
  return sequelize.transaction(async (transaction) => {
    const deleted = await ProviderContact.destroy({ where: { id: contactId, companyId }, transaction });
    if (!deleted) {
      throw new Error('Contact not found');
    }
  });
}

export async function upsertProviderCoverage(companyId, coverageId, payload) {
  if (!payload?.zoneId) {
    throw new Error('Zone required');
  }

  return sequelize.transaction(async (transaction) => {
    const provider = await ProviderProfile.findOne({ where: { companyId }, transaction });
    if (!provider) {
      throw new Error('Provider not found');
    }

    let coverage;
    if (coverageId) {
      coverage = await ProviderCoverage.findOne({ where: { id: coverageId, companyId }, transaction });
      if (!coverage) {
        throw new Error('Coverage not found');
      }
      Object.assign(coverage, {
        zoneId: payload.zoneId,
        coverageType: payload.coverageType ?? coverage.coverageType,
        slaMinutes: payload.slaMinutes ?? coverage.slaMinutes,
        maxCapacity: payload.maxCapacity ?? coverage.maxCapacity,
        effectiveFrom: payload.effectiveFrom ?? coverage.effectiveFrom,
        effectiveTo: payload.effectiveTo ?? coverage.effectiveTo,
        notes: payload.notes ?? coverage.notes,
        metadata: payload.metadata ?? coverage.metadata
      });
      await coverage.save({ transaction });
    } else {
      coverage = await ProviderCoverage.create(
        {
          companyId,
          zoneId: payload.zoneId,
          coverageType: payload.coverageType ?? 'primary',
          slaMinutes: payload.slaMinutes ?? 240,
          maxCapacity: payload.maxCapacity ?? 0,
          effectiveFrom: payload.effectiveFrom ?? null,
          effectiveTo: payload.effectiveTo ?? null,
          notes: payload.notes ?? null,
          metadata: payload.metadata ?? {}
        },
        { transaction }
      );
    }

    const reloaded = await ProviderCoverage.findByPk(coverage.id, {
      include: [{ model: ServiceZone, as: 'zone', attributes: ['id', 'name', 'companyId'] }],
      transaction
    });

    return mapCoverage(reloaded);
  });
}

export async function deleteProviderCoverage(companyId, coverageId) {
  return sequelize.transaction(async (transaction) => {
    const deleted = await ProviderCoverage.destroy({ where: { id: coverageId, companyId }, transaction });
    if (!deleted) {
      throw new Error('Coverage not found');
    }
  });
}

export const PROVIDER_STATUS_OPTIONS = PROVIDER_STATUSES.map((option) => option.value);
export const PROVIDER_STAGE_OPTIONS = ONBOARDING_STAGES.map((option) => option.value);
export const PROVIDER_TIER_OPTIONS = PROVIDER_TIERS.map((option) => option.value);
export const PROVIDER_RISK_OPTIONS = RISK_LEVELS.map((option) => option.value);
export const PROVIDER_COVERAGE_OPTIONS = COVERAGE_TYPES.map((option) => option.value);
export const PROVIDER_INSURED_OPTIONS = INSURED_STATUSES.map((option) => option.value);

export default {
  listProviders,
  createProvider,
  getProvider,
  updateProvider,
  archiveProvider,
  upsertProviderContact,
  deleteProviderContact,
  upsertProviderCoverage,
  deleteProviderCoverage
};
