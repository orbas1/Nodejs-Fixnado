import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  CustomerProfile,
  CustomerContact,
  CustomerLocation,
  CustomerCoupon
} from '../models/index.js';
import { recordSecurityEvent } from './auditTrailService.js';

function customerControlError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function buildAuditContext(auditContext = {}) {
  return {
    actorId: auditContext.actorId ?? null,
    actorRole: auditContext.actorRole ?? 'user',
    actorPersona: auditContext.actorPersona ?? null,
    ipAddress: auditContext.ipAddress ?? null,
    userAgent: auditContext.userAgent ?? null,
    correlationId: auditContext.correlationId ?? null
  };
}

async function recordCustomerControlEvent(userId, action, auditContext, metadata = {}) {
  const context = buildAuditContext(auditContext);
  await recordSecurityEvent({
    userId: context.actorId ?? userId,
    actorRole: context.actorRole,
    actorPersona: context.actorPersona,
    resource: 'customer.control',
    action,
    decision: 'allow',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    correlationId: context.correlationId,
    metadata: {
      workspaceUserId: userId,
      ...metadata
    }
  });
}

const ALLOWED_COUPON_STATUSES = new Set(['draft', 'scheduled', 'active', 'expired', 'archived']);

function coerceCouponPayload(payload = {}) {
  const result = { ...payload };

  if (Object.hasOwn(result, 'code') && typeof result.code === 'string') {
    result.code = result.code.trim().toUpperCase();
  }

  if (Object.hasOwn(result, 'discountValue')) {
    const value = Number.parseFloat(result.discountValue);
    result.discountValue = Number.isFinite(value) ? Number.parseFloat(value.toFixed(2)) : null;
  }

  if (Object.hasOwn(result, 'minOrderTotal')) {
    const value = Number.parseFloat(result.minOrderTotal);
    result.minOrderTotal = Number.isFinite(value) ? Number.parseFloat(value.toFixed(2)) : null;
  }

  if (Object.hasOwn(result, 'maxRedemptions')) {
    const value = Number.parseInt(result.maxRedemptions, 10);
    result.maxRedemptions = Number.isInteger(value) && value > 0 ? value : null;
  }

  if (Object.hasOwn(result, 'maxRedemptionsPerCustomer')) {
    const value = Number.parseInt(result.maxRedemptionsPerCustomer, 10);
    result.maxRedemptionsPerCustomer = Number.isInteger(value) && value > 0 ? value : null;
  }

  if (Object.hasOwn(result, 'autoApply')) {
    result.autoApply = Boolean(result.autoApply);
  }

  if (Object.hasOwn(result, 'status') && typeof result.status === 'string') {
    result.status = result.status.trim().toLowerCase();
  }

  if (Object.hasOwn(result, 'currency')) {
    result.currency = result.currency ? `${result.currency}`.trim().toUpperCase() : null;
  }

  const normaliseDate = (value) => {
    if (!value) {
      return null;
    }
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  if (Object.hasOwn(result, 'startsAt')) {
    result.startsAt = normaliseDate(result.startsAt);
  }

  if (Object.hasOwn(result, 'expiresAt')) {
    result.expiresAt = normaliseDate(result.expiresAt);
  }

  ['name', 'description', 'imageUrl', 'termsUrl', 'internalNotes'].forEach((field) => {
    if (Object.hasOwn(result, field) && typeof result[field] === 'string') {
      const trimmed = result[field].trim();
      result[field] = trimmed.length ? trimmed : null;
    }
  });

  return result;
}

function validateCouponBusinessRules(payload) {
  if (!payload.name || !payload.code) {
    throw customerControlError('coupon_required_fields_missing', 422);
  }

  const discountValue = Number.parseFloat(payload.discountValue ?? 0);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    throw customerControlError('coupon_invalid_discount', 422);
  }

  if (payload.discountType === 'percentage' && discountValue > 100) {
    throw customerControlError('coupon_percentage_exceeds_maximum', 422);
  }

  if (payload.discountType === 'fixed' && !payload.currency) {
    throw customerControlError('coupon_currency_required', 422);
  }

  if (payload.startsAt && payload.expiresAt && payload.expiresAt < payload.startsAt) {
    throw customerControlError('coupon_expiry_before_start', 422);
  }

  if (
    Number.isInteger(payload.maxRedemptions ?? null) &&
    Number.isInteger(payload.maxRedemptionsPerCustomer ?? null) &&
    payload.maxRedemptionsPerCustomer > payload.maxRedemptions
  ) {
    throw customerControlError('coupon_redemption_limits_invalid', 422);
  }

  if (payload.status && !ALLOWED_COUPON_STATUSES.has(payload.status)) {
    throw customerControlError('coupon_status_invalid', 422);
  }
}

export async function loadCustomerOverview(userId) {
  const [profile, contacts, locations, coupons] = await Promise.all([
    CustomerProfile.findOne({ where: { userId } }),
    CustomerContact.findAll({
      where: { userId },
      order: [
        ['is_primary', 'DESC'],
        ['created_at', 'ASC']
      ]
    }),
    CustomerLocation.findAll({
      where: { userId },
      order: [
        ['is_primary', 'DESC'],
        ['created_at', 'ASC']
      ]
    }),
    CustomerCoupon.findAll({
      where: { userId },
      order: [
        ['status', 'ASC'],
        ['created_at', 'DESC']
      ]
    })
  ]);

  return { profile, contacts, locations, coupons };
}

export async function persistCustomerProfile({ userId, payload, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    const existingProfile = await CustomerProfile.findOne({
      where: { userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (existingProfile) {
      existingProfile.set(payload);
      const changed = existingProfile.changed() ?? [];
      await existingProfile.save({ transaction });
      await recordCustomerControlEvent(userId, 'customer.control:profile:update', auditContext, {
        profileId: existingProfile.id,
        changedFields: changed
      });
      return existingProfile;
    }

    const profile = await CustomerProfile.create({ userId, ...payload }, { transaction });
    await recordCustomerControlEvent(userId, 'customer.control:profile:create', auditContext, {
      profileId: profile.id,
      fields: Object.keys(payload)
    });
    return profile;
  });
}

export async function createCustomerContactRecord({ userId, payload, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    const contact = await CustomerContact.create({ userId, ...payload }, { transaction });

    if (payload.isPrimary) {
      await CustomerContact.update(
        { isPrimary: false },
        {
          where: { userId, id: { [Op.ne]: contact.id } },
          transaction
        }
      );
    }

    await recordCustomerControlEvent(userId, 'customer.control:contact:create', auditContext, {
      contactId: contact.id,
      isPrimary: contact.isPrimary
    });

    return contact;
  });
}

export async function updateCustomerContactRecord({ userId, contactId, payload, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    const contact = await CustomerContact.findOne({
      where: { id: contactId, userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!contact) {
      throw customerControlError('contact_not_found', 404);
    }

    contact.set(payload);
    const changed = contact.changed() ?? [];
    await contact.save({ transaction });

    if (contact.isPrimary) {
      await CustomerContact.update(
        { isPrimary: false },
        {
          where: { userId, id: { [Op.ne]: contact.id } },
          transaction
        }
      );
    }

    await recordCustomerControlEvent(userId, 'customer.control:contact:update', auditContext, {
      contactId: contact.id,
      changedFields: changed,
      isPrimary: contact.isPrimary
    });

    return contact;
  });
}

export async function deleteCustomerContactRecord({ userId, contactId, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    const contact = await CustomerContact.findOne({
      where: { id: contactId, userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!contact) {
      throw customerControlError('contact_not_found', 404);
    }

    const wasPrimary = contact.isPrimary;
    await contact.destroy({ transaction });

    await recordCustomerControlEvent(userId, 'customer.control:contact:delete', auditContext, {
      contactId,
      wasPrimary
    });

    return true;
  });
}

export async function createCustomerLocationRecord({ userId, payload, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    const location = await CustomerLocation.create({ userId, ...payload }, { transaction });

    if (payload.isPrimary) {
      await CustomerLocation.update(
        { isPrimary: false },
        {
          where: { userId, id: { [Op.ne]: location.id } },
          transaction
        }
      );
    }

    await recordCustomerControlEvent(userId, 'customer.control:location:create', auditContext, {
      locationId: location.id,
      isPrimary: location.isPrimary
    });

    return location;
  });
}

export async function updateCustomerLocationRecord({ userId, locationId, payload, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    const location = await CustomerLocation.findOne({
      where: { id: locationId, userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!location) {
      throw customerControlError('location_not_found', 404);
    }

    location.set(payload);
    const changed = location.changed() ?? [];
    await location.save({ transaction });

    if (location.isPrimary) {
      await CustomerLocation.update(
        { isPrimary: false },
        {
          where: { userId, id: { [Op.ne]: location.id } },
          transaction
        }
      );
    }

    await recordCustomerControlEvent(userId, 'customer.control:location:update', auditContext, {
      locationId: location.id,
      changedFields: changed,
      isPrimary: location.isPrimary
    });

    return location;
  });
}

export async function deleteCustomerLocationRecord({ userId, locationId, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    const location = await CustomerLocation.findOne({
      where: { id: locationId, userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!location) {
      throw customerControlError('location_not_found', 404);
    }

    const wasPrimary = location.isPrimary;
    await location.destroy({ transaction });

    await recordCustomerControlEvent(userId, 'customer.control:location:delete', auditContext, {
      locationId,
      wasPrimary
    });

    return true;
  });
}

export async function createCustomerCouponRecord({ userId, payload, auditContext }) {
  const couponPayload = coerceCouponPayload(payload);

  return sequelize.transaction(async (transaction) => {
    if (couponPayload.code) {
      const existing = await CustomerCoupon.findOne({
        where: { userId, code: couponPayload.code },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (existing) {
        throw customerControlError('coupon_code_conflict', 409);
      }
    }

    validateCouponBusinessRules(couponPayload);

    const coupon = await CustomerCoupon.create({ userId, ...couponPayload }, { transaction });

    await recordCustomerControlEvent(userId, 'customer.control:coupon:create', auditContext, {
      couponId: coupon.id,
      status: coupon.status,
      discountType: coupon.discountType
    });

    return coupon;
  });
}

export async function updateCustomerCouponRecord({ userId, couponId, payload, auditContext }) {
  const couponPayload = coerceCouponPayload(payload);

  return sequelize.transaction(async (transaction) => {
    const coupon = await CustomerCoupon.findOne({
      where: { id: couponId, userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!coupon) {
      throw customerControlError('coupon_not_found', 404);
    }

    if (couponPayload.code) {
      const duplicate = await CustomerCoupon.findOne({
        where: { userId, code: couponPayload.code, id: { [Op.ne]: coupon.id } },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (duplicate) {
        throw customerControlError('coupon_code_conflict', 409);
      }
    }

    const existingValues = coerceCouponPayload(coupon.toJSON());
    validateCouponBusinessRules({ ...existingValues, ...couponPayload });

    coupon.set(couponPayload);
    const changed = coupon.changed() ?? [];
    await coupon.save({ transaction });

    await recordCustomerControlEvent(userId, 'customer.control:coupon:update', auditContext, {
      couponId: coupon.id,
      changedFields: changed,
      status: coupon.status
    });

    return coupon;
  });
}

export async function deleteCustomerCouponRecord({ userId, couponId, auditContext }) {
  return sequelize.transaction(async (transaction) => {
    const coupon = await CustomerCoupon.findOne({
      where: { id: couponId, userId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!coupon) {
      throw customerControlError('coupon_not_found', 404);
    }

    const status = coupon.status;
    await coupon.destroy({ transaction });

    await recordCustomerControlEvent(userId, 'customer.control:coupon:delete', auditContext, {
      couponId,
      status
    });

    return true;
  });
}

export default {
  loadCustomerOverview,
  persistCustomerProfile,
  createCustomerContactRecord,
  updateCustomerContactRecord,
  deleteCustomerContactRecord,
  createCustomerLocationRecord,
  updateCustomerLocationRecord,
  deleteCustomerLocationRecord,
  createCustomerCouponRecord,
  updateCustomerCouponRecord,
  deleteCustomerCouponRecord
};
