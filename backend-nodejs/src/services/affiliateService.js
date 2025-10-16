import crypto from 'node:crypto';
import { fn, col, literal, Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  AffiliateProfile,
  AffiliateReferral,
  AffiliateLedgerEntry,
  AffiliateCommissionRule,
  PlatformSetting,
  User
} from '../models/index.js';

const AFFILIATE_SETTINGS_KEY = 'affiliate.settings';

const DEFAULT_SETTINGS = {
  programmeName: 'Fixnado Affiliate Program',
  programmeTagline: 'Earn ongoing revenue by referring verified Fixnado jobs.',
  contactEmail: 'affiliates@fixnado.com',
  partnerPortalUrl: 'https://fixnado.com/affiliate',
  landingPageUrl: 'https://fixnado.com/affiliate/join',
  onboardingGuideUrl: 'https://fixnado.com/affiliate/guide',
  welcomeEmailSubject: 'Welcome to the Fixnado affiliate community',
  welcomeEmailBody:
    'Thanks for partnering with Fixnado. Share your referral link, track conversions in real time, and reach out to our partner desk any time you need support.',
  heroImageUrl: '',
  logoUrl: '',
  brandColor: '#1445E0',
  resources: [],
  assetLibrary: [],
  tiers: [],
  autoApproveReferrals: true,
  payoutCadenceDays: 30,
  minimumPayoutAmount: 250,
  referralAttributionWindowDays: 365,
  disclosureUrl: 'https://fixnado.com/legal/affiliate-terms'
};

function normaliseString(value) {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value == null) {
    return '';
  }
  return String(value).trim();
}

function normaliseMultiline(value) {
  if (typeof value !== 'string') {
    if (value == null) {
      return '';
    }
    return String(value);
  }
  return value.replace(/\r\n/g, '\n').replace(/\s+$/g, '');
}

function slugify(value, fallback) {
  const source = normaliseString(value);
  if (!source) {
    if (fallback) {
      return slugify(fallback);
    }
    return '';
  }
  const slug = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return slug || (fallback ? slugify(fallback) : '');
}

function toPositiveInteger(value, fallback, { min = 1, max } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  let result = parsed;
  if (result < min) {
    result = min;
  }
  if (max != null && result > max) {
    result = max;
  }
  return result;
}

function toCurrencyAmount(value, fallback, { allowNegative = false } = {}) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  if (!allowNegative && parsed < 0) {
    return fallback;
  }
  return Number.parseFloat(parsed.toFixed(2));
}

function toStringList(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => normaliseString(entry)).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/\r?\n|,/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
}

function normaliseBrandColor(value) {
  const input = normaliseString(value);
  if (!input) {
    return DEFAULT_SETTINGS.brandColor;
  }
  const hex = input.startsWith('#') ? input : `#${input}`;
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) {
    return DEFAULT_SETTINGS.brandColor;
  }
  if (hex.length === 4) {
    const expanded = hex
      .slice(1)
      .split('')
      .map((char) => char + char)
      .join('');
    return `#${expanded}`.toUpperCase();
  }
  return hex.toUpperCase();
}

function normaliseResource(resource, index) {
  if (!resource) {
    return null;
  }
  const label = normaliseString(resource.label);
  const url = normaliseString(resource.url);
  if (!label || !url) {
    return null;
  }
  const type = ['link', 'guide', 'video', 'document'].includes(resource.type)
    ? resource.type
    : 'link';
  const roles = toStringList(resource.roles);
  return {
    id: slugify(resource.id, label) || `resource-${index + 1}`,
    label,
    url,
    type,
    description: normaliseString(resource.description),
    roles,
    openInNewTab: resource.openInNewTab !== false
  };
}

function normaliseAsset(asset, index) {
  if (!asset) {
    return null;
  }
  const label = normaliseString(asset.label);
  const url = normaliseString(asset.url);
  if (!label || !url) {
    return null;
  }
  const type = ['image', 'logo', 'banner', 'document', 'video'].includes(asset.type)
    ? asset.type
    : 'image';
  return {
    id: slugify(asset.id, label) || `asset-${index + 1}`,
    label,
    type,
    url,
    previewUrl: normaliseString(asset.previewUrl),
    description: normaliseString(asset.description)
  };
}

function normaliseTier(tier, index) {
  if (!tier) {
    return null;
  }
  const label = normaliseString(tier.label);
  if (!label) {
    return null;
  }
  const benefits = toStringList(tier.benefits);
  return {
    id: slugify(tier.id, label) || `tier-${index + 1}`,
    label,
    headline: normaliseString(tier.headline),
    description: normaliseString(tier.description),
    requirement: normaliseString(tier.requirement),
    badgeColor: normaliseBrandColor(tier.badgeColor),
    imageUrl: normaliseString(tier.imageUrl),
    benefits
  };
}

function normaliseAffiliateSettings(value = {}) {
  const merged = { ...DEFAULT_SETTINGS, ...value };
  const payoutCadenceDays = toPositiveInteger(merged.payoutCadenceDays, DEFAULT_SETTINGS.payoutCadenceDays, {
    min: 7,
    max: 365
  });
  const referralAttributionWindowDays = toPositiveInteger(
    merged.referralAttributionWindowDays,
    DEFAULT_SETTINGS.referralAttributionWindowDays,
    { min: 1, max: 1095 }
  );
  const minimumPayoutAmount = toCurrencyAmount(
    merged.minimumPayoutAmount,
    DEFAULT_SETTINGS.minimumPayoutAmount
  );

  const resources = Array.isArray(merged.resources)
    ? merged.resources.map(normaliseResource).filter(Boolean)
    : DEFAULT_SETTINGS.resources;
  const assetLibrary = Array.isArray(merged.assetLibrary)
    ? merged.assetLibrary.map(normaliseAsset).filter(Boolean)
    : DEFAULT_SETTINGS.assetLibrary;
  const tiers = Array.isArray(merged.tiers)
    ? merged.tiers.map(normaliseTier).filter(Boolean)
    : DEFAULT_SETTINGS.tiers;

  return {
    ...DEFAULT_SETTINGS,
    programmeName: normaliseString(merged.programmeName) || DEFAULT_SETTINGS.programmeName,
    programmeTagline: normaliseString(merged.programmeTagline),
    contactEmail: normaliseString(merged.contactEmail),
    partnerPortalUrl: normaliseString(merged.partnerPortalUrl),
    landingPageUrl: normaliseString(merged.landingPageUrl),
    onboardingGuideUrl: normaliseString(merged.onboardingGuideUrl),
    welcomeEmailSubject: normaliseString(merged.welcomeEmailSubject),
    welcomeEmailBody: normaliseMultiline(merged.welcomeEmailBody),
    heroImageUrl: normaliseString(merged.heroImageUrl),
    logoUrl: normaliseString(merged.logoUrl),
    brandColor: normaliseBrandColor(merged.brandColor),
    autoApproveReferrals: merged.autoApproveReferrals !== false,
    payoutCadenceDays,
    minimumPayoutAmount,
    referralAttributionWindowDays,
    disclosureUrl: normaliseString(merged.disclosureUrl) || DEFAULT_SETTINGS.disclosureUrl,
    resources,
    assetLibrary,
    tiers
  };
}

function toNumber(value, fallback = 0) {
  if (value == null) return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const REFERRAL_CODE_LENGTH = 10;

function buildReferralCodeFromSeed(seed = '') {
  const cleaned = normaliseString(seed).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!cleaned) {
    return '';
  }
  if (cleaned.length >= REFERRAL_CODE_LENGTH) {
    return cleaned.slice(0, REFERRAL_CODE_LENGTH);
  }
  const random = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `${cleaned}${random}`.slice(0, REFERRAL_CODE_LENGTH);
}

function randomReferralCode() {
  return buildReferralCodeFromSeed(crypto.randomBytes(6).toString('hex')) || crypto.randomBytes(6).toString('hex').toUpperCase().slice(0, REFERRAL_CODE_LENGTH);
}

async function referralCodeExists(code, { transaction } = {}) {
  if (!code) return false;
  const count = await AffiliateProfile.count({ where: { referralCode: code }, transaction });
  return count > 0;
}

export function generateReferralCode(seed = '') {
  return buildReferralCodeFromSeed(seed) || randomReferralCode();
}

export async function allocateReferralCode({ preferred, transaction } = {}) {
  const attempts = new Set();
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidateSeed = attempt === 0 && preferred ? preferred : crypto.randomBytes(6).toString('hex');
    const candidate = buildReferralCodeFromSeed(candidateSeed);
    if (!candidate || attempts.has(candidate)) {
      continue;
    }
    attempts.add(candidate);
    if (!(await referralCodeExists(candidate, { transaction }))) {
      return candidate;
    }
  }
  throw new Error('Unable to allocate a unique referral code.');
}

export async function ensureAffiliateProfile({ userId, transaction } = {}) {
  const existing = await AffiliateProfile.findOne({ where: { userId }, transaction });
  if (existing) {
    return existing;
  }

  const referralCode = await allocateReferralCode({ transaction });
  return AffiliateProfile.create(
    {
      userId,
      referralCode
    },
    { transaction }
  );
}

const PROFILE_STATUSES = new Set(['active', 'suspended', 'pending']);
const LEDGER_STATUSES = new Set(['pending', 'approved', 'rejected', 'paid']);
const REFERRAL_STATUSES = new Set(['pending', 'converted', 'blocked']);

function normaliseProfileStatus(value, fallback = 'active') {
  const normalised = normaliseString(value).toLowerCase();
  return PROFILE_STATUSES.has(normalised) ? normalised : fallback;
}

function normaliseLedgerStatus(value, fallback = 'approved') {
  const normalised = normaliseString(value).toLowerCase();
  return LEDGER_STATUSES.has(normalised) ? normalised : fallback;
}

function normaliseReferralStatus(value, fallback = 'pending') {
  const normalised = normaliseString(value).toLowerCase();
  return REFERRAL_STATUSES.has(normalised) ? normalised : fallback;
}

function normaliseProfileMetadata(value, fallback = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fallback;
  }
  return { ...fallback, ...value };
}

function parseDate(value, fallback = new Date()) {
  if (!value) {
    return fallback;
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function buildProfileResponse(profileInstance) {
  const profile = profileInstance.toJSON();
  return {
    id: profile.id,
    userId: profile.userId,
    referralCode: profile.referralCode,
    status: profile.status,
    tierLabel: profile.tierLabel,
    totalReferred: profile.totalReferred,
    totalCommissionEarned: toNumber(profile.totalCommissionEarned, 0),
    pendingCommission: toNumber(profile.pendingCommission, 0),
    lifetimeRevenue: toNumber(profile.lifetimeRevenue, 0),
    metadata: profile.metadata || {},
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    user: profile.user
      ? {
          id: profile.user.id,
          firstName: profile.user.firstName,
          lastName: profile.user.lastName,
          email: profile.user.email
        }
      : null
  };
}

function buildLedgerEntryResponse(entryInstance) {
  const entry = entryInstance.toJSON();
  return {
    id: entry.id,
    affiliateProfileId: entry.affiliateProfileId,
    referralId: entry.referralId,
    commissionRuleId: entry.commissionRuleId,
    transactionId: entry.transactionId,
    transactionAmount: toNumber(entry.transactionAmount, 0),
    commissionAmount: toNumber(entry.commissionAmount, 0),
    currency: entry.currency,
    occurrenceIndex: entry.occurrenceIndex,
    status: entry.status,
    recognizedAt: entry.recognizedAt,
    metadata: entry.metadata || {},
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt
  };
}

function buildReferralResponse(referralInstance) {
  const referral = referralInstance.toJSON();
  return {
    id: referral.id,
    affiliateProfileId: referral.affiliateProfileId,
    referredUserId: referral.referredUserId,
    referralCodeUsed: referral.referralCodeUsed,
    status: referral.status,
    conversionsCount: toNumber(referral.conversionsCount, 0),
    totalRevenue: toNumber(referral.totalRevenue, 0),
    totalCommissionEarned: toNumber(referral.totalCommissionEarned, 0),
    lastConversionAt: referral.lastConversionAt,
    metadata: referral.metadata || {},
    createdAt: referral.createdAt,
    updatedAt: referral.updatedAt,
    affiliate: referral.affiliate
      ? {
          id: referral.affiliate.id,
          referralCode: referral.affiliate.referralCode,
          tierLabel: referral.affiliate.tierLabel,
          status: referral.affiliate.status
        }
      : null,
    referredUser: referral.referredUser
      ? {
          id: referral.referredUser.id,
          firstName: referral.referredUser.firstName,
          lastName: referral.referredUser.lastName,
          email: referral.referredUser.email
        }
      : null
  };
}

async function refreshAffiliateFinancials(affiliateProfileId, { transaction } = {}) {
  const [rollup] = await AffiliateLedgerEntry.findAll({
    attributes: [
      [literal('COALESCE(SUM("AffiliateLedgerEntry"."transaction_amount"),0)'), 'total_revenue'],
      [
        literal(
          "COALESCE(SUM(CASE WHEN \"AffiliateLedgerEntry\".\"status\" IN ('approved','paid') THEN \"AffiliateLedgerEntry\".\"commission_amount\" ELSE 0 END),0)"
        ),
        'earned_commission'
      ],
      [
        literal(
          "COALESCE(SUM(CASE WHEN \"AffiliateLedgerEntry\".\"status\" = 'pending' THEN \"AffiliateLedgerEntry\".\"commission_amount\" ELSE 0 END),0)"
        ),
        'pending_commission'
      ]
    ],
    where: { affiliateProfileId },
    transaction,
    raw: true
  });

  const lifetimeRevenue = toNumber(rollup?.total_revenue, 0);
  const totalCommissionEarned = toNumber(rollup?.earned_commission, 0);
  const pendingCommission = toNumber(rollup?.pending_commission, 0);

  await AffiliateProfile.update(
    { lifetimeRevenue, totalCommissionEarned, pendingCommission },
    { where: { id: affiliateProfileId }, transaction }
  );

  const refreshed = await AffiliateProfile.findByPk(affiliateProfileId, {
    include: [{ model: User, as: 'user' }],
    transaction
  });

  return refreshed;
}

async function refreshAffiliateReferralRollup(affiliateProfileId, { transaction } = {}) {
  const profile = await AffiliateProfile.findByPk(affiliateProfileId, { transaction });
  if (!profile) {
    return null;
  }

  const [rollup] = await AffiliateReferral.findAll({
    attributes: [
      [literal('COALESCE(SUM("AffiliateReferral"."conversions_count"),0)'), 'conversions_sum'],
      [fn('COUNT', col('id')), 'referral_count'],
      [fn('MAX', col('last_conversion_at')), 'last_conversion_at']
    ],
    where: { affiliateProfileId },
    raw: true,
    transaction
  });

  const conversions = toNumber(rollup?.conversions_sum, 0);
  const referralCount = toNumber(rollup?.referral_count, 0);
  const totalReferred = conversions > 0 ? conversions : referralCount;
  const lastConversionAt = rollup?.last_conversion_at ?? null;

  const nextMetadata = normaliseProfileMetadata(profile.metadata, {});
  nextMetadata.lastConversionAt = lastConversionAt;

  await profile.update({ totalReferred, metadata: nextMetadata }, { transaction });
  await profile.reload({ include: [{ model: User, as: 'user' }], transaction });
  return profile;
}

export async function getAffiliateSettings() {
  const setting = await PlatformSetting.findOne({ where: { key: AFFILIATE_SETTINGS_KEY } });
  if (!setting) {
    return normaliseAffiliateSettings();
  }
  return normaliseAffiliateSettings(setting.value || {});
}

export async function saveAffiliateSettings({ actorId, payload }) {
  const nextValue = normaliseAffiliateSettings(payload);

  await PlatformSetting.upsert({
    key: AFFILIATE_SETTINGS_KEY,
    value: nextValue,
    updatedBy: actorId
  });

  return nextValue;
}

export function resolveCommissionRule({ amount, occurrenceIndex = 1, rules }) {
  const numericAmount = toNumber(amount, 0);
  if (!Array.isArray(rules) || rules.length === 0) {
    return null;
  }

  const eligible = rules
    .filter((rule) => {
      if (!rule.isActive) return false;
      const min = toNumber(rule.minTransactionValue, 0);
      const max = rule.maxTransactionValue == null ? null : toNumber(rule.maxTransactionValue);
      if (numericAmount < min) return false;
      if (max != null && numericAmount > max) return false;
      if (rule.recurrenceType === 'one_time' && occurrenceIndex > 1) return false;
      if (rule.recurrenceType === 'finite' && rule.recurrenceLimit && occurrenceIndex > rule.recurrenceLimit) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return toNumber(b.commissionRate, 0) - toNumber(a.commissionRate, 0);
    });

  return eligible[0] || null;
}

export async function listCommissionRules() {
  const rules = await AffiliateCommissionRule.findAll({
    order: [
      ['isActive', 'DESC'],
      ['priority', 'ASC'],
      ['minTransactionValue', 'ASC']
    ]
  });
  return rules.map((rule) => rule.toJSON());
}

export function validateCommissionRulePayload(payload) {
  if (!payload?.name) {
    throw Object.assign(new Error('Rule name is required'), { statusCode: 422 });
  }
  if (!payload?.tierLabel) {
    throw Object.assign(new Error('Tier label is required'), { statusCode: 422 });
  }
  const rate = toNumber(payload.commissionRate, NaN);
  if (Number.isNaN(rate) || rate <= 0 || rate > 100) {
    throw Object.assign(new Error('Commission rate must be between 0 and 100'), { statusCode: 422 });
  }
  const recurrenceType = payload.recurrenceType || 'one_time';
  if (!['one_time', 'finite', 'infinite'].includes(recurrenceType)) {
    throw Object.assign(new Error('Invalid recurrence type'), { statusCode: 422 });
  }
  if (recurrenceType === 'finite' && (!payload.recurrenceLimit || payload.recurrenceLimit <= 0)) {
    throw Object.assign(new Error('Finite recurrence rules require a positive recurrence limit'), { statusCode: 422 });
  }
}

export async function createOrUpdateCommissionRule({ id, payload, actorId }) {
  validateCommissionRulePayload(payload);
  const body = {
    name: payload.name,
    tierLabel: payload.tierLabel,
    commissionRate: payload.commissionRate,
    minTransactionValue: payload.minTransactionValue ?? 0,
    maxTransactionValue: payload.maxTransactionValue ?? null,
    recurrenceType: payload.recurrenceType ?? 'one_time',
    recurrenceLimit: payload.recurrenceType === 'finite' ? payload.recurrenceLimit : null,
    priority: payload.priority ?? 100,
    currency: payload.currency ?? 'USD',
    metadata: payload.metadata ?? {},
    createdBy: actorId
  };

  if (payload.isActive != null) {
    body.isActive = Boolean(payload.isActive);
  }

  let rule;
  if (id) {
    rule = await AffiliateCommissionRule.findByPk(id);
    if (!rule) {
      throw Object.assign(new Error('Affiliate commission rule not found'), { statusCode: 404 });
    }
    await rule.update(body);
  } else {
    rule = await AffiliateCommissionRule.create(body);
  }

  return rule.toJSON();
}

export async function deactivateCommissionRule({ id }) {
  const rule = await AffiliateCommissionRule.findByPk(id);
  if (!rule) {
    throw Object.assign(new Error('Affiliate commission rule not found'), { statusCode: 404 });
  }
  await rule.update({ isActive: false });
  return rule.toJSON();
}

export async function recordAffiliateConversion({
  affiliateProfileId,
  referralId,
  transactionId,
  transactionAmount,
  occurrenceIndex = 1,
  currency = 'USD'
}) {
  const numericAmount = toNumber(transactionAmount, 0);
  if (!numericAmount || numericAmount <= 0) {
    throw Object.assign(new Error('Transaction amount must be positive'), { statusCode: 422 });
  }

  const rules = await AffiliateCommissionRule.findAll({ where: { isActive: true }, order: [['priority', 'ASC']] });
  const activeRule = resolveCommissionRule({ amount: numericAmount, occurrenceIndex, rules });
  if (!activeRule) {
    throw Object.assign(new Error('No commission rule configured for this transaction value'), { statusCode: 422 });
  }

  const commissionRate = toNumber(activeRule.commissionRate, 0) / 100;
  const commissionAmount = Number.parseFloat((numericAmount * commissionRate).toFixed(2));

  return sequelize.transaction(async (transaction) => {
    const ledgerEntry = await AffiliateLedgerEntry.create(
      {
        affiliateProfileId,
        referralId: referralId ?? null,
        commissionRuleId: activeRule.id,
        transactionId,
        transactionAmount: numericAmount,
        commissionAmount,
        currency,
        occurrenceIndex,
        status: 'approved'
      },
      { transaction }
    );

    await AffiliateProfile.increment(
      {
        totalCommissionEarned: commissionAmount,
        lifetimeRevenue: numericAmount,
        pendingCommission: commissionAmount
      },
      { where: { id: affiliateProfileId }, transaction }
    );

    if (referralId) {
      await AffiliateReferral.increment(
        {
          conversionsCount: 1,
          totalRevenue: numericAmount,
          totalCommissionEarned: commissionAmount
        },
        { where: { id: referralId }, transaction }
      );
      await AffiliateReferral.update({ lastConversionAt: new Date(), status: 'converted' }, { where: { id: referralId }, transaction });
    }

    return ledgerEntry.toJSON();
  });
}

export async function getAffiliateDashboard({ userId }) {
  const profile = await ensureAffiliateProfile({ userId });

  const [summary] = await AffiliateLedgerEntry.findAll({
    attributes: [
      [fn('COALESCE', fn('SUM', col('commissionAmount')), literal('0')), 'totalCommission'],
      [fn('COALESCE', fn('SUM', col('transactionAmount')), literal('0')), 'totalRevenue'],
      [fn('COUNT', col('id')), 'transactionCount']
    ],
    where: { affiliateProfileId: profile.id }
  });

  const aggregated = summary ? summary.get() : {};

  const referrals = await AffiliateReferral.findAll({
    where: { affiliateProfileId: profile.id },
    order: [['lastConversionAt', 'DESC']],
    limit: 20
  });

  const rules = await AffiliateCommissionRule.findAll({
    where: { isActive: true },
    order: [
      ['priority', 'ASC'],
      ['minTransactionValue', 'ASC']
    ]
  });

  const settings = await getAffiliateSettings();

  return {
    profile: {
      id: profile.id,
      referralCode: profile.referralCode,
      status: profile.status,
      tierLabel: profile.tierLabel,
      totalReferred: profile.totalReferred,
      totalCommissionEarned: toNumber(profile.totalCommissionEarned, 0),
      pendingCommission: toNumber(profile.pendingCommission, 0),
      lifetimeRevenue: toNumber(profile.lifetimeRevenue, 0)
    },
    earnings: {
      totalCommission: toNumber(aggregated.totalCommission, 0),
      totalRevenue: toNumber(aggregated.totalRevenue, 0),
      transactionCount: toNumber(aggregated.transactionCount, 0)
    },
    referrals: referrals.map((referral) => ({
      id: referral.id,
      status: referral.status,
      conversionsCount: referral.conversionsCount,
      totalRevenue: toNumber(referral.totalRevenue, 0),
      totalCommissionEarned: toNumber(referral.totalCommissionEarned, 0),
      lastConversionAt: referral.lastConversionAt,
      referralCodeUsed: referral.referralCodeUsed
    })),
    commissionRules: rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      tierLabel: rule.tierLabel,
      commissionRate: toNumber(rule.commissionRate, 0),
      minTransactionValue: toNumber(rule.minTransactionValue, 0),
      maxTransactionValue: rule.maxTransactionValue != null ? toNumber(rule.maxTransactionValue, 0) : null,
      recurrenceType: rule.recurrenceType,
      recurrenceLimit: rule.recurrenceLimit
    })),
    settings
  };
}

export async function refreshAffiliateTier({ affiliateProfileId }) {
  const profile = await AffiliateProfile.findByPk(affiliateProfileId);
  if (!profile) {
    throw Object.assign(new Error('Affiliate profile not found'), { statusCode: 404 });
  }

  const rules = await AffiliateCommissionRule.findAll({ where: { isActive: true }, order: [['priority', 'ASC']] });
  if (rules.length === 0) {
    await profile.update({ tierLabel: null });
    return profile;
  }

  const highest = rules.reduce((acc, rule) => {
    if (!acc) return rule;
    if (toNumber(rule.commissionRate, 0) > toNumber(acc.commissionRate, 0)) {
      return rule;
    }
    return acc;
  }, null);

  await profile.update({ tierLabel: highest?.tierLabel ?? null });
  return profile;
}

export async function getAffiliatePerformanceForAdmin() {
  const rows = await AffiliateProfile.findAll({
    attributes: [
      'id',
      'userId',
      'referralCode',
      'status',
      'tierLabel',
      'totalReferred',
      'totalCommissionEarned',
      'pendingCommission',
      'lifetimeRevenue'
    ],
    include: [
      {
        model: AffiliateLedgerEntry,
        as: 'ledgerEntries',
        attributes: []
      }
    ],
    order: [['totalCommissionEarned', 'DESC']],
    limit: 50
  });

  return rows.map((row) => row.toJSON());
}

export async function getAffiliateReferralsForProfile({ affiliateProfileId }) {
  const referrals = await AffiliateReferral.findAll({
    where: { affiliateProfileId },
    order: [['createdAt', 'DESC']]
  });
  return referrals.map((referral) => referral.toJSON());
}

export async function listAffiliateProfiles({ search, status, tier, page = 1, pageSize = 25 } = {}) {
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safePageSize = Math.min(Math.max(Number.parseInt(pageSize, 10) || 25, 1), 100);
  const offset = (safePage - 1) * safePageSize;

  const where = {};
  if (status && PROFILE_STATUSES.has(status)) {
    where.status = status;
  }
  if (tier) {
    where.tierLabel = normaliseString(tier) || null;
  }
  if (search) {
    const keyword = normaliseString(search);
    if (keyword) {
      where.referralCode = { [Op.iLike]: `%${keyword}%` };
    }
  }

  const { rows, count } = await AffiliateProfile.findAndCountAll({
    where,
    limit: safePageSize,
    offset,
    order: [['createdAt', 'DESC']],
    include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }]
  });

  return {
    data: rows.map((row) => buildProfileResponse(row)),
    meta: {
      page: safePage,
      pageSize: safePageSize,
      total: count,
      pageCount: Math.ceil(count / safePageSize)
    }
  };
}

export async function createAffiliateProfile({ actorId, payload }) {
  if (!payload || !payload.userId) {
    throw Object.assign(new Error('userId is required to create an affiliate profile'), { statusCode: 422 });
  }

  const user = await User.findByPk(payload.userId);
  if (!user) {
    throw Object.assign(new Error('User not found for affiliate profile creation'), { statusCode: 404 });
  }

  const existing = await AffiliateProfile.findOne({ where: { userId: payload.userId } });
  if (existing) {
    throw Object.assign(new Error('Affiliate profile already exists for this user'), { statusCode: 409 });
  }

  return sequelize.transaction(async (transaction) => {
    const referralCode = await allocateReferralCode({ preferred: payload.referralCode, transaction });

    const profile = await AffiliateProfile.create(
      {
        userId: payload.userId,
        referralCode,
        status: normaliseProfileStatus(payload.status, 'active'),
        tierLabel: normaliseString(payload.tierLabel) || null,
        totalReferred: toPositiveInteger(payload.totalReferred, 0, { min: 0 }),
        totalCommissionEarned: toCurrencyAmount(payload.totalCommissionEarned, 0, { allowNegative: true }),
        pendingCommission: toCurrencyAmount(payload.pendingCommission, 0, { allowNegative: true }),
        lifetimeRevenue: toCurrencyAmount(payload.lifetimeRevenue, 0, { allowNegative: true }),
        metadata: normaliseProfileMetadata(payload.metadata, { createdBy: actorId || 'system' })
      },
      { transaction }
    );

    await profile.reload({ include: [{ model: User, as: 'user' }], transaction });
    return buildProfileResponse(profile);
  });
}

export async function updateAffiliateProfile({ id, payload }) {
  const profile = await AffiliateProfile.findByPk(id, { include: [{ model: User, as: 'user' }] });
  if (!profile) {
    throw Object.assign(new Error('Affiliate profile not found'), { statusCode: 404 });
  }

  return sequelize.transaction(async (transaction) => {
    const updates = {};

    if (Object.hasOwn(payload, 'status')) {
      updates.status = normaliseProfileStatus(payload.status, profile.status);
    }

    if (Object.hasOwn(payload, 'tierLabel')) {
      updates.tierLabel = normaliseString(payload.tierLabel) || null;
    }

    if (Object.hasOwn(payload, 'metadata')) {
      updates.metadata = normaliseProfileMetadata(payload.metadata, profile.metadata || {});
    }

    if (Object.hasOwn(payload, 'totalReferred')) {
      updates.totalReferred = toPositiveInteger(payload.totalReferred, profile.totalReferred, { min: 0 });
    }

    if (Object.hasOwn(payload, 'totalCommissionEarned')) {
      updates.totalCommissionEarned = toCurrencyAmount(
        payload.totalCommissionEarned,
        profile.totalCommissionEarned,
        { allowNegative: true }
      );
    }

    if (Object.hasOwn(payload, 'pendingCommission')) {
      updates.pendingCommission = toCurrencyAmount(payload.pendingCommission, profile.pendingCommission, {
        allowNegative: true
      });
    }

    if (Object.hasOwn(payload, 'lifetimeRevenue')) {
      updates.lifetimeRevenue = toCurrencyAmount(payload.lifetimeRevenue, profile.lifetimeRevenue, {
        allowNegative: true
      });
    }

    if (Object.hasOwn(payload, 'referralCode')) {
      const desired = normaliseString(payload.referralCode);
      if (desired && desired.toUpperCase() !== profile.referralCode) {
        updates.referralCode = await allocateReferralCode({ preferred: desired, transaction });
      }
    }

    if (Object.keys(updates).length === 0) {
      return buildProfileResponse(profile);
    }

    await profile.update(updates, { transaction });
    await profile.reload({ include: [{ model: User, as: 'user' }], transaction });
    return buildProfileResponse(profile);
  });
}

export async function listAffiliateLedgerEntries({ affiliateProfileId, page = 1, pageSize = 25 } = {}) {
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safePageSize = Math.min(Math.max(Number.parseInt(pageSize, 10) || 25, 1), 100);
  const offset = (safePage - 1) * safePageSize;

  const { rows, count } = await AffiliateLedgerEntry.findAndCountAll({
    where: { affiliateProfileId },
    limit: safePageSize,
    offset,
    order: [['recognizedAt', 'DESC']],
    include: [
      { model: AffiliateCommissionRule, as: 'commissionRule', attributes: ['id', 'name', 'tierLabel'] },
      { model: AffiliateReferral, as: 'referral', attributes: ['id', 'referralCodeUsed', 'status'] }
    ]
  });

  return {
    data: rows.map((row) => ({
      ...buildLedgerEntryResponse(row),
      commissionRule: row.commissionRule ? row.commissionRule.toJSON() : null,
      referral: row.referral ? row.referral.toJSON() : null
    })),
    meta: {
      page: safePage,
      pageSize: safePageSize,
      total: count,
      pageCount: Math.ceil(count / safePageSize)
    }
  };
}

export async function createManualAffiliateLedgerEntry({ affiliateProfileId, actorId, payload }) {
  const profile = await AffiliateProfile.findByPk(affiliateProfileId, { include: [{ model: User, as: 'user' }] });
  if (!profile) {
    throw Object.assign(new Error('Affiliate profile not found'), { statusCode: 404 });
  }

  const commissionAmount = toCurrencyAmount(payload.commissionAmount, null, { allowNegative: true });
  if (commissionAmount === null) {
    throw Object.assign(new Error('Commission amount must be provided'), { statusCode: 422 });
  }

  const transactionAmount = toCurrencyAmount(payload.transactionAmount ?? commissionAmount, 0, {
    allowNegative: true
  });

  const occurrenceIndex = toPositiveInteger(payload.occurrenceIndex, 1, { min: 1 });
  const status = normaliseLedgerStatus(payload.status, 'approved');
  const recognizedAt = parseDate(payload.recognizedAt, new Date());
  const transactionId = normaliseString(payload.transactionId) || `manual-${Date.now()}`;

  return sequelize.transaction(async (transaction) => {
    const entry = await AffiliateLedgerEntry.create(
      {
        affiliateProfileId,
        referralId: payload.referralId || null,
        commissionRuleId: payload.commissionRuleId || null,
        transactionId,
        transactionAmount,
        commissionAmount,
        currency: normaliseString(payload.currency) || 'USD',
        occurrenceIndex,
        status,
        recognizedAt,
        metadata: normaliseProfileMetadata(payload.metadata, { createdBy: actorId || 'system', type: 'manual-adjustment' })
      },
      { transaction }
    );

    const refreshedProfile = await refreshAffiliateFinancials(affiliateProfileId, { transaction });

    await refreshedProfile.reload({ include: [{ model: User, as: 'user' }], transaction });

    return {
      entry: buildLedgerEntryResponse(entry),
      profile: buildProfileResponse(refreshedProfile)
    };
  });
}

export async function listAffiliateReferrals({ status, search, affiliateProfileId, page = 1, pageSize = 25 } = {}) {
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safePageSize = Math.min(Math.max(Number.parseInt(pageSize, 10) || 25, 1), 100);
  const offset = (safePage - 1) * safePageSize;

  const where = {};
  if (status && REFERRAL_STATUSES.has(status)) {
    where.status = status;
  }
  if (affiliateProfileId) {
    where.affiliateProfileId = affiliateProfileId;
  }
  if (search) {
    const keyword = normaliseString(search);
    if (keyword) {
      const lowered = keyword.toLowerCase();
      const pattern = `%${lowered}%`;
      where[Op.or] = [
        sequelize.where(fn('LOWER', col('AffiliateReferral.referral_code_used')), { [Op.like]: pattern }),
        sequelize.where(fn('LOWER', col('affiliate.referral_code')), { [Op.like]: pattern })
      ];
    }
  }

  const { rows, count } = await AffiliateReferral.findAndCountAll({
    where,
    limit: safePageSize,
    offset,
    order: [['createdAt', 'DESC']],
    subQuery: false,
    include: [
      {
        model: AffiliateProfile,
        as: 'affiliate',
        attributes: ['id', 'referralCode', 'tierLabel', 'status']
      },
      { model: User, as: 'referredUser', attributes: ['id', 'firstName', 'lastName', 'email'] }
    ]
  });

  return {
    data: rows.map((row) => buildReferralResponse(row)),
    meta: {
      page: safePage,
      pageSize: safePageSize,
      total: count,
      pageCount: Math.ceil(count / safePageSize)
    }
  };
}

export async function createAffiliateReferral({ actorId, payload }) {
  if (!payload?.affiliateProfileId) {
    throw Object.assign(new Error('affiliateProfileId is required'), { statusCode: 422 });
  }

  const profile = await AffiliateProfile.findByPk(payload.affiliateProfileId, {
    include: [{ model: User, as: 'user' }]
  });
  if (!profile) {
    throw Object.assign(new Error('Affiliate profile not found'), { statusCode: 404 });
  }

  const referralCodeUsed = normaliseString(payload.referralCodeUsed) || profile.referralCode;

  return sequelize.transaction(async (transaction) => {
    const referral = await AffiliateReferral.create(
      {
        affiliateProfileId: profile.id,
        referredUserId: payload.referredUserId || null,
        referralCodeUsed,
        status: normaliseReferralStatus(payload.status, 'pending'),
        conversionsCount: toPositiveInteger(payload.conversionsCount, 0, { min: 0 }),
        totalRevenue: toCurrencyAmount(payload.totalRevenue, 0, { allowNegative: false }),
        totalCommissionEarned: toCurrencyAmount(payload.totalCommissionEarned, 0, { allowNegative: false }),
        lastConversionAt: parseDate(payload.lastConversionAt, null),
        metadata: normaliseProfileMetadata(payload.metadata, { createdBy: actorId || 'system' })
      },
      { transaction }
    );

    const refreshedProfile = await refreshAffiliateReferralRollup(profile.id, { transaction });
    await referral.reload({ include: [{ model: AffiliateProfile, as: 'affiliate' }, { model: User, as: 'referredUser' }], transaction });

    return {
      referral: buildReferralResponse(referral),
      profile: refreshedProfile ? buildProfileResponse(refreshedProfile) : buildProfileResponse(profile)
    };
  });
}

export async function updateAffiliateReferral({ id, payload }) {
  const referral = await AffiliateReferral.findByPk(id, {
    include: [
      { model: AffiliateProfile, as: 'affiliate', include: [{ model: User, as: 'user' }] },
      { model: User, as: 'referredUser' }
    ]
  });

  if (!referral) {
    throw Object.assign(new Error('Affiliate referral not found'), { statusCode: 404 });
  }

  return sequelize.transaction(async (transaction) => {
    const updates = {};

    if (Object.hasOwn(payload, 'status')) {
      updates.status = normaliseReferralStatus(payload.status, referral.status);
    }
    if (Object.hasOwn(payload, 'conversionsCount')) {
      updates.conversionsCount = toPositiveInteger(payload.conversionsCount, referral.conversionsCount, { min: 0 });
    }
    if (Object.hasOwn(payload, 'totalRevenue')) {
      updates.totalRevenue = toCurrencyAmount(payload.totalRevenue, referral.totalRevenue, { allowNegative: false });
    }
    if (Object.hasOwn(payload, 'totalCommissionEarned')) {
      updates.totalCommissionEarned = toCurrencyAmount(
        payload.totalCommissionEarned,
        referral.totalCommissionEarned,
        { allowNegative: false }
      );
    }
    if (Object.hasOwn(payload, 'lastConversionAt')) {
      updates.lastConversionAt = parseDate(payload.lastConversionAt, referral.lastConversionAt ?? null);
    }
    if (Object.hasOwn(payload, 'metadata')) {
      updates.metadata = normaliseProfileMetadata(payload.metadata, referral.metadata || {});
    }

    if (Object.keys(updates).length > 0) {
      await referral.update(updates, { transaction });
    }

    const refreshedProfile = await refreshAffiliateReferralRollup(referral.affiliateProfileId, { transaction });
    await referral.reload({
      include: [
        { model: AffiliateProfile, as: 'affiliate', include: [{ model: User, as: 'user' }] },
        { model: User, as: 'referredUser' }
      ],
      transaction
    });

    return {
      referral: buildReferralResponse(referral),
      profile: refreshedProfile ? buildProfileResponse(refreshedProfile) : null
    };
  });
}
