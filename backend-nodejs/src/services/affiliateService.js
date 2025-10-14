import crypto from 'node:crypto';
import { fn, col, literal } from 'sequelize';
import sequelize from '../config/database.js';
import {
  AffiliateProfile,
  AffiliateReferral,
  AffiliateLedgerEntry,
  AffiliateCommissionRule,
  PlatformSetting
} from '../models/index.js';

const AFFILIATE_SETTINGS_KEY = 'affiliate.settings';

const DEFAULT_SETTINGS = {
  autoApproveReferrals: true,
  payoutCadenceDays: 30,
  minimumPayoutAmount: 250,
  referralAttributionWindowDays: 365,
  disclosureUrl: 'https://fixnado.com/legal/affiliate-terms'
};

function toNumber(value, fallback = 0) {
  if (value == null) return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function generateReferralCode() {
  return crypto.randomBytes(5).toString('hex');
}

export async function ensureAffiliateProfile({ userId, transaction } = {}) {
  const [profile] = await AffiliateProfile.findOrCreate({
    where: { userId },
    defaults: {
      referralCode: generateReferralCode()
    },
    transaction
  });
  return profile;
}

export async function getAffiliateSettings() {
  const setting = await PlatformSetting.findOne({ where: { key: AFFILIATE_SETTINGS_KEY } });
  if (!setting) {
    return { ...DEFAULT_SETTINGS, tiers: [] };
  }
  const value = setting.value || {};
  return {
    ...DEFAULT_SETTINGS,
    ...value,
    tiers: Array.isArray(value.tiers) ? value.tiers : []
  };
}

export async function saveAffiliateSettings({ actorId, payload }) {
  const nextValue = {
    ...DEFAULT_SETTINGS,
    ...payload,
    tiers: Array.isArray(payload?.tiers) ? payload.tiers : []
  };

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
