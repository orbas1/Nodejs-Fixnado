import { randomUUID } from 'crypto';
import validator from 'validator';
import { Op } from 'sequelize';
import { ProviderProfile, ProviderContact, ProviderCoverage, ServiceZone, sequelize } from '../models/index.js';
import { resolveCompanyForActor } from './panelService.js';

export const CONTACT_TYPES = ['owner', 'operations', 'finance', 'compliance', 'support', 'sales', 'other'];
export const COVERAGE_TYPES = ['primary', 'secondary', 'standby'];
export const SUPPORT_DAYS = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' }
];

function buildHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertActor(actor) {
  if (!actor?.id) {
    throw buildHttpError(403, 'forbidden');
  }
}

function normaliseString(value, { field, min = 1, max = 255, optional = false } = {}) {
  if (value === undefined || value === null) {
    if (optional) {
      return null;
    }
    throw buildHttpError(422, `${field}_required`);
  }

  if (typeof value !== 'string') {
    throw buildHttpError(422, `${field}_must_be_string`);
  }

  const trimmed = value.trim();
  if (!trimmed && !optional) {
    throw buildHttpError(422, `${field}_required`);
  }

  if (trimmed && trimmed.length < min) {
    throw buildHttpError(422, `${field}_too_short`);
  }

  if (trimmed.length > max) {
    throw buildHttpError(422, `${field}_too_long`);
  }

  return trimmed || null;
}

function normaliseOptionalString(value, options = {}) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return normaliseString(value, { ...options, optional: true });
}

function normaliseEmail(value, { field, optional = false } = {}) {
  const candidate = normaliseOptionalString(value, { field, min: 3, max: 320, optional: true });
  if (!candidate) {
    if (optional) {
      return null;
    }
    throw buildHttpError(422, `${field}_required`);
  }
  if (!validator.isEmail(candidate)) {
    throw buildHttpError(422, `${field}_invalid`);
  }
  return candidate;
}

function normaliseOptionalEmail(value, { field }) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return normaliseEmail(value, { field, optional: true });
}

function normaliseUrl(value, { field, optional = false } = {}) {
  const candidate = normaliseOptionalString(value, { field, max: 255, optional: true });
  if (!candidate) {
    if (optional) {
      return null;
    }
    throw buildHttpError(422, `${field}_required`);
  }
  if (!validator.isURL(candidate, { require_protocol: true })) {
    throw buildHttpError(422, `${field}_invalid`);
  }
  return candidate;
}

function normaliseOptionalUrl(value, { field }) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return normaliseUrl(value, { field, optional: true });
}

function normaliseInteger(value, { field, min, max, optional = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (optional) {
      return null;
    }
    throw buildHttpError(422, `${field}_required`);
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw buildHttpError(422, `${field}_invalid`);
  }

  if (min !== undefined && parsed < min) {
    throw buildHttpError(422, `${field}_too_small`);
  }

  if (max !== undefined && parsed > max) {
    throw buildHttpError(422, `${field}_too_large`);
  }

  return parsed;
}

function normaliseOptionalInteger(value, options = {}) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return normaliseInteger(value, { ...options, optional: true });
}

function normaliseColour(value, field) {
  const candidate = normaliseOptionalString(value, { field, max: 32, optional: true });
  if (!candidate) {
    return null;
  }
  if (!/^#?[0-9a-fA-F]{3,8}$/.test(candidate)) {
    throw buildHttpError(422, `${field}_invalid`);
  }
  return candidate.startsWith('#') ? candidate : `#${candidate}`;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function normaliseSupportHours(input = {}) {
  const result = {};
  for (const day of SUPPORT_DAYS) {
    const raw = input?.[day.id] ?? {};
    const enabled = Boolean(raw?.enabled);
    const start = raw?.start ?? null;
    const end = raw?.end ?? null;

    if (enabled) {
      if (!start || !TIME_PATTERN.test(start)) {
        throw buildHttpError(422, `${day.id}_start_invalid`);
      }
      if (!end || !TIME_PATTERN.test(end)) {
        throw buildHttpError(422, `${day.id}_end_invalid`);
      }
      result[day.id] = { enabled: true, start, end };
    } else {
      result[day.id] = { enabled: false, start: null, end: null };
    }
  }
  return result;
}

function normaliseSocialLinks(entries = []) {
  if (!Array.isArray(entries)) {
    throw buildHttpError(422, 'social_links_invalid');
  }
  return entries
    .map((entry) => {
      const label = normaliseOptionalString(entry?.label, { field: 'social_label', max: 80, optional: true }) ?? '';
      const url = normaliseOptionalUrl(entry?.url, { field: 'social_url' });
      if (!url) {
        throw buildHttpError(422, 'social_url_required');
      }
      return {
        id: entry?.id ?? randomUUID(),
        label: label || url,
        url
      };
    })
    .slice(0, 12);
}

function normaliseMediaGallery(entries = []) {
  if (!Array.isArray(entries)) {
    throw buildHttpError(422, 'media_gallery_invalid');
  }
  return entries
    .map((entry) => {
      const label = normaliseOptionalString(entry?.label, { field: 'media_label', max: 120, optional: true }) ?? '';
      const url = normaliseOptionalUrl(entry?.url, { field: 'media_url' });
      if (!url) {
        throw buildHttpError(422, 'media_url_required');
      }
      return {
        id: entry?.id ?? randomUUID(),
        label: label || url,
        url
      };
    })
    .slice(0, 12);
}

async function loadProviderContext(actor, inputCompanyId, transaction) {
  const { company } = await resolveCompanyForActor({ companyId: inputCompanyId, actor });
  if (!company) {
    throw buildHttpError(404, 'company_not_found');
  }
  const profile = await ProviderProfile.findOne({ where: { companyId: company.id }, transaction });
  if (!profile) {
    throw buildHttpError(404, 'provider_profile_not_found');
  }
  return { company, profile };
}

function serialiseContact(record) {
  return {
    id: record.id,
    name: record.name,
    role: record.role,
    email: record.email,
    phone: record.phone,
    type: record.type,
    isPrimary: Boolean(record.isPrimary),
    notes: record.notes,
    avatarUrl: record.avatarUrl
  };
}

function serialiseCoverage(record) {
  return {
    id: record.id,
    zoneId: record.zoneId,
    zoneName: record.zone?.name ?? null,
    coverageType: record.coverageType,
    slaMinutes: record.slaMinutes,
    maxCapacity: record.maxCapacity,
    effectiveFrom: record.effectiveFrom?.toISOString?.() ?? null,
    effectiveTo: record.effectiveTo?.toISOString?.() ?? null,
    notes: record.notes,
    metadata: record.metadata ?? {}
  };
}

function serialiseSupportHours(hours = {}) {
  const result = {};
  for (const day of SUPPORT_DAYS) {
    const value = hours?.[day.id] ?? {};
    result[day.id] = {
      enabled: Boolean(value.enabled),
      start: value.start ?? null,
      end: value.end ?? null
    };
  }
  return result;
}

function splitRegions(value) {
  if (!value) {
    return [];
  }
  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function joinRegions(list) {
  if (!list) {
    return null;
  }
  if (Array.isArray(list)) {
    return list.map((entry) => entry.trim()).filter(Boolean).join(', ');
  }
  if (typeof list === 'string') {
    return list.split(',').map((entry) => entry.trim()).filter(Boolean).join(', ');
  }
  throw buildHttpError(422, 'service_regions_invalid');
}

function buildStorefrontUrl(profile) {
  if (!profile.storefrontSlug) {
    return null;
  }
  return `/providers/${profile.storefrontSlug}`;
}

async function serialiseSettings(company, profile, transaction) {
  const [contacts, coverage, zones] = await Promise.all([
    ProviderContact.findAll({
      where: { companyId: company.id },
      order: [
        ['isPrimary', 'DESC'],
        ['createdAt', 'ASC']
      ],
      transaction
    }),
    ProviderCoverage.findAll({
      where: { companyId: company.id },
      include: [{ model: ServiceZone, as: 'zone', attributes: ['id', 'name'] }],
      order: [
        ['coverageType', 'ASC'],
        ['createdAt', 'DESC']
      ],
      transaction
    }),
    ServiceZone.findAll({
      where: { companyId: company.id },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
      transaction
    })
  ]);

  return {
    profile: {
      displayName: profile.displayName,
      tradingName: profile.tradingName,
      tagline: profile.tagline,
      missionStatement: profile.missionStatement,
      supportEmail: profile.supportEmail,
      supportPhone: profile.supportPhone,
      billingEmail: profile.billingEmail,
      billingPhone: profile.billingPhone,
      websiteUrl: profile.websiteUrl,
      storefrontSlug: profile.storefrontSlug,
      dispatchRadiusKm: profile.dispatchRadiusKm,
      preferredResponseMinutes: profile.preferredResponseMinutes,
      serviceRegions: splitRegions(company.serviceRegions),
      operationsPlaybookUrl: profile.operationsPlaybookUrl,
      insurancePolicyUrl: profile.insurancePolicyUrl
    },
    branding: {
      logoUrl: profile.logoUrl,
      heroImageUrl: profile.heroImageUrl,
      brandPrimaryColor: profile.brandPrimaryColor,
      brandSecondaryColor: profile.brandSecondaryColor,
      brandFont: profile.brandFont,
      mediaGallery: Array.isArray(profile.mediaGallery) ? profile.mediaGallery : []
    },
    operations: {
      operationsNotes: profile.operationsNotes,
      coverageNotes: profile.coverageNotes,
      supportHours: serialiseSupportHours(profile.supportHours),
      socialLinks: Array.isArray(profile.socialLinks) ? profile.socialLinks : []
    },
    contacts: contacts.map(serialiseContact),
    coverage: coverage.map(serialiseCoverage),
    enums: {
      contactTypes: CONTACT_TYPES,
      coverageTypes: COVERAGE_TYPES,
      serviceZones: zones.map((zone) => ({ id: zone.id, label: zone.name })),
      supportDays: SUPPORT_DAYS
    },
    links: {
      storefront: buildStorefrontUrl(profile)
    }
  };
}

export async function getProviderSettings(actor, { companyId } = {}) {
  assertActor(actor);
  const { company, profile } = await loadProviderContext(actor, companyId);
  return serialiseSettings(company, profile);
}

export async function updateProviderProfile(actor, payload = {}, { companyId } = {}) {
  assertActor(actor);
  return sequelize.transaction(async (transaction) => {
    const { company, profile } = await loadProviderContext(actor, companyId, transaction);

    const displayName = normaliseString(payload.displayName ?? profile.displayName, {
      field: 'display_name',
      min: 2,
      max: 120
    });
    const tradingName = normaliseOptionalString(payload.tradingName ?? profile.tradingName, {
      field: 'trading_name',
      max: 160,
      optional: true
    });
    const tagline = normaliseOptionalString(payload.tagline ?? profile.tagline, {
      field: 'tagline',
      max: 160,
      optional: true
    });
    const missionStatement = normaliseOptionalString(payload.missionStatement ?? profile.missionStatement, {
      field: 'mission_statement',
      max: 2000,
      optional: true
    });
    const supportEmail = normaliseEmail(payload.supportEmail ?? profile.supportEmail, {
      field: 'support_email'
    });
    const supportPhone = normaliseOptionalString(payload.supportPhone ?? profile.supportPhone, {
      field: 'support_phone',
      max: 40,
      optional: true
    });
    const billingEmail = normaliseOptionalEmail(payload.billingEmail ?? profile.billingEmail, {
      field: 'billing_email'
    });
    const billingPhone = normaliseOptionalString(payload.billingPhone ?? profile.billingPhone, {
      field: 'billing_phone',
      max: 40,
      optional: true
    });
    const websiteUrl = normaliseOptionalUrl(payload.websiteUrl ?? profile.websiteUrl, {
      field: 'website_url'
    });
    const operationsPlaybookUrl = normaliseOptionalUrl(
      payload.operationsPlaybookUrl ?? profile.operationsPlaybookUrl,
      { field: 'operations_playbook_url' }
    );
    const insurancePolicyUrl = normaliseOptionalUrl(payload.insurancePolicyUrl ?? profile.insurancePolicyUrl, {
      field: 'insurance_policy_url'
    });
    const dispatchRadiusKm = normaliseOptionalInteger(payload.dispatchRadiusKm ?? profile.dispatchRadiusKm, {
      field: 'dispatch_radius_km',
      min: 0,
      max: 1000
    });
    const preferredResponseMinutes = normaliseOptionalInteger(
      payload.preferredResponseMinutes ?? profile.preferredResponseMinutes,
      { field: 'preferred_response_minutes', min: 5, max: 1440 }
    );
    const serviceRegions = joinRegions(payload.serviceRegions ?? company.serviceRegions);

    Object.assign(profile, {
      displayName,
      tradingName,
      tagline,
      missionStatement,
      supportEmail,
      supportPhone,
      billingEmail,
      billingPhone,
      websiteUrl,
      dispatchRadiusKm,
      preferredResponseMinutes,
      operationsPlaybookUrl,
      insurancePolicyUrl
    });

    if (!profile.storefrontSlug) {
      profile.storefrontSlug = profile.displayName
        ?.toLowerCase()
        ?.replace(/[^a-z0-9]+/g, '-')
        ?.replace(/^-+|-+$/g, '')
        ?.slice(0, 80);
    }

    Object.assign(company, {
      serviceRegions
    });

    await profile.save({ transaction });
    await company.save({ transaction });

    return serialiseSettings(company, profile, transaction);
  });
}

export async function updateProviderBranding(actor, payload = {}, { companyId } = {}) {
  assertActor(actor);
  return sequelize.transaction(async (transaction) => {
    const { company, profile } = await loadProviderContext(actor, companyId, transaction);

    const logoUrl = normaliseOptionalUrl(payload.logoUrl ?? profile.logoUrl, { field: 'logo_url' });
    const heroImageUrl = normaliseOptionalUrl(payload.heroImageUrl ?? profile.heroImageUrl, {
      field: 'hero_image_url'
    });
    const brandPrimaryColor = normaliseColour(payload.brandPrimaryColor ?? profile.brandPrimaryColor, 'brand_primary_color');
    const brandSecondaryColor = normaliseColour(
      payload.brandSecondaryColor ?? profile.brandSecondaryColor,
      'brand_secondary_color'
    );
    const brandFont = normaliseOptionalString(payload.brandFont ?? profile.brandFont, {
      field: 'brand_font',
      max: 80,
      optional: true
    });
    const mediaGallery = normaliseMediaGallery(payload.mediaGallery ?? profile.mediaGallery);

    Object.assign(profile, {
      logoUrl,
      heroImageUrl,
      brandPrimaryColor,
      brandSecondaryColor,
      brandFont,
      mediaGallery
    });

    await profile.save({ transaction });

    return serialiseSettings(company, profile, transaction);
  });
}

export async function updateProviderOperations(actor, payload = {}, { companyId } = {}) {
  assertActor(actor);
  return sequelize.transaction(async (transaction) => {
    const { company, profile } = await loadProviderContext(actor, companyId, transaction);

    const operationsNotes = normaliseOptionalString(payload.operationsNotes ?? profile.operationsNotes, {
      field: 'operations_notes',
      max: 4000,
      optional: true
    });
    const coverageNotes = normaliseOptionalString(payload.coverageNotes ?? profile.coverageNotes, {
      field: 'coverage_notes',
      max: 4000,
      optional: true
    });
    const supportHours = normaliseSupportHours(payload.supportHours ?? profile.supportHours);
    const socialLinks = normaliseSocialLinks(payload.socialLinks ?? profile.socialLinks);

    Object.assign(profile, {
      operationsNotes,
      coverageNotes,
      supportHours,
      socialLinks
    });

    await profile.save({ transaction });

    return serialiseSettings(company, profile, transaction);
  });
}

async function ensureContactBelongsToCompany(companyId, contactId, transaction) {
  const contact = await ProviderContact.findOne({
    where: { id: contactId, companyId },
    transaction
  });
  if (!contact) {
    throw buildHttpError(404, 'contact_not_found');
  }
  return contact;
}

export async function upsertProviderContact(actor, contactId, payload = {}, { companyId } = {}) {
  assertActor(actor);
  return sequelize.transaction(async (transaction) => {
    const { company } = await loadProviderContext(actor, companyId, transaction);

    const name = normaliseString(payload.name, { field: 'contact_name', min: 2, max: 160 });
    const role = normaliseOptionalString(payload.role, { field: 'contact_role', max: 120, optional: true });
    const email = normaliseOptionalEmail(payload.email, { field: 'contact_email' });
    const phone = normaliseOptionalString(payload.phone, { field: 'contact_phone', max: 40, optional: true });
    const type = (payload.type || 'operations').toLowerCase();
    if (!CONTACT_TYPES.includes(type)) {
      throw buildHttpError(422, 'contact_type_invalid');
    }
    const isPrimary = Boolean(payload.isPrimary);
    const notes = normaliseOptionalString(payload.notes, { field: 'contact_notes', max: 2000, optional: true });
    const avatarUrl = normaliseOptionalUrl(payload.avatarUrl, { field: 'contact_avatar_url' });

    let contact;
    if (contactId) {
      contact = await ensureContactBelongsToCompany(company.id, contactId, transaction);
      Object.assign(contact, { name, role, email, phone, type, isPrimary, notes, avatarUrl });
      await contact.save({ transaction });
    } else {
      contact = await ProviderContact.create(
        {
          companyId: company.id,
          name,
          role,
          email,
          phone,
          type,
          isPrimary,
          notes,
          avatarUrl
        },
        { transaction }
      );
    }

    if (isPrimary) {
      await ProviderContact.update(
        { isPrimary: false },
        {
          where: {
            companyId: company.id,
            id: { [Op.ne]: contact.id }
          },
          transaction
        }
      );
    }

    const profile = await ProviderProfile.findOne({ where: { companyId: company.id }, transaction });
    return serialiseSettings(company, profile, transaction);
  });
}

export async function deleteProviderContact(actor, contactId, { companyId } = {}) {
  assertActor(actor);
  return sequelize.transaction(async (transaction) => {
    const { company } = await loadProviderContext(actor, companyId, transaction);
    const contact = await ensureContactBelongsToCompany(company.id, contactId, transaction);
    await contact.destroy({ transaction });
    const profile = await ProviderProfile.findOne({ where: { companyId: company.id }, transaction });
    return serialiseSettings(company, profile, transaction);
  });
}

async function ensureCoverageBelongsToCompany(companyId, coverageId, transaction) {
  const coverage = await ProviderCoverage.findOne({
    where: { id: coverageId, companyId },
    transaction
  });
  if (!coverage) {
    throw buildHttpError(404, 'coverage_not_found');
  }
  return coverage;
}

async function assertZoneForCompany(companyId, zoneId, transaction) {
  const zone = await ServiceZone.findOne({ where: { id: zoneId, companyId }, transaction });
  if (!zone) {
    throw buildHttpError(422, 'zone_invalid');
  }
  return zone;
}

export async function upsertProviderCoverage(actor, coverageId, payload = {}, { companyId } = {}) {
  assertActor(actor);
  return sequelize.transaction(async (transaction) => {
    const { company } = await loadProviderContext(actor, companyId, transaction);

    const zoneId = normaliseString(payload.zoneId, { field: 'zone_id', min: 1, max: 64 });
    await assertZoneForCompany(company.id, zoneId, transaction);
    const coverageType = (payload.coverageType || 'primary').toLowerCase();
    if (!COVERAGE_TYPES.includes(coverageType)) {
      throw buildHttpError(422, 'coverage_type_invalid');
    }
    const slaMinutes = normaliseInteger(payload.slaMinutes ?? 240, {
      field: 'sla_minutes',
      min: 15,
      max: 1440
    });
    const maxCapacity = normaliseInteger(payload.maxCapacity ?? 0, {
      field: 'max_capacity',
      min: 0,
      max: 1000
    });
    const notes = normaliseOptionalString(payload.notes, { field: 'coverage_notes', max: 2000, optional: true });
    const metadata = typeof payload.metadata === 'object' && payload.metadata !== null ? payload.metadata : {};

    let coverage;
    if (coverageId) {
      coverage = await ensureCoverageBelongsToCompany(company.id, coverageId, transaction);
      Object.assign(coverage, { zoneId, coverageType, slaMinutes, maxCapacity, notes, metadata });
      await coverage.save({ transaction });
    } else {
      coverage = await ProviderCoverage.create(
        {
          companyId: company.id,
          zoneId,
          coverageType,
          slaMinutes,
          maxCapacity,
          notes,
          metadata
        },
        { transaction }
      );
    }

    const profile = await ProviderProfile.findOne({ where: { companyId: company.id }, transaction });
    return serialiseSettings(company, profile, transaction);
  });
}

export async function deleteProviderCoverage(actor, coverageId, { companyId } = {}) {
  assertActor(actor);
  return sequelize.transaction(async (transaction) => {
    const { company } = await loadProviderContext(actor, companyId, transaction);
    const coverage = await ensureCoverageBelongsToCompany(company.id, coverageId, transaction);
    await coverage.destroy({ transaction });
    const profile = await ProviderProfile.findOne({ where: { companyId: company.id }, transaction });
    return serialiseSettings(company, profile, transaction);
  });
}

export default {
  getProviderSettings,
  updateProviderProfile,
  updateProviderBranding,
  updateProviderOperations,
  upsertProviderContact,
  deleteProviderContact,
  upsertProviderCoverage,
  deleteProviderCoverage
};
