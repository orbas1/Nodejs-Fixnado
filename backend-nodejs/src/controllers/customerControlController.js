import { validationResult } from 'express-validator';
import {
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
} from '../services/customerControlService.js';

const PROFILE_FIELDS = [
  'preferredName',
  'companyName',
  'jobTitle',
  'primaryEmail',
  'primaryPhone',
  'preferredContactMethod',
  'billingEmail',
  'timezone',
  'locale',
  'defaultCurrency',
  'avatarUrl',
  'coverImageUrl',
  'supportNotes',
  'escalationWindowMinutes',
  'marketingOptIn',
  'notificationsEmailOptIn',
  'notificationsSmsOptIn'
];

const CONTACT_FIELDS = ['name', 'role', 'email', 'phone', 'contactType', 'isPrimary', 'notes', 'avatarUrl'];
const LOCATION_FIELDS = [
  'label',
  'addressLine1',
  'addressLine2',
  'city',
  'region',
  'postalCode',
  'country',
  'accessNotes',
  'isPrimary'
];

const COUPON_FIELDS = [
  'name',
  'code',
  'description',
  'discountType',
  'discountValue',
  'currency',
  'minOrderTotal',
  'startsAt',
  'expiresAt',
  'maxRedemptions',
  'maxRedemptionsPerCustomer',
  'autoApply',
  'status',
  'imageUrl',
  'termsUrl',
  'internalNotes'
];

function extractPayload(source, fields) {
  const payload = {};
  fields.forEach((field) => {
    if (Object.hasOwn(source, field)) {
      payload[field] = source[field];
    }
  });
  return payload;
}

function normaliseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true' || value === '1') {
    return true;
  }
  if (value === 'false' || value === '0') {
    return false;
  }
  return undefined;
}

function sanitiseProfileInput(body) {
  const payload = extractPayload(body, PROFILE_FIELDS);
  if (Object.hasOwn(payload, 'marketingOptIn')) {
    const normalised = normaliseBoolean(payload.marketingOptIn);
    if (typeof normalised === 'boolean') {
      payload.marketingOptIn = normalised;
    }
  }
  if (Object.hasOwn(payload, 'notificationsEmailOptIn')) {
    const normalised = normaliseBoolean(payload.notificationsEmailOptIn);
    if (typeof normalised === 'boolean') {
      payload.notificationsEmailOptIn = normalised;
    }
  }
  if (Object.hasOwn(payload, 'notificationsSmsOptIn')) {
    const normalised = normaliseBoolean(payload.notificationsSmsOptIn);
    if (typeof normalised === 'boolean') {
      payload.notificationsSmsOptIn = normalised;
    }
  }
  if (Object.hasOwn(payload, 'escalationWindowMinutes')) {
    const parsed = Number.parseInt(payload.escalationWindowMinutes, 10);
    if (Number.isFinite(parsed)) {
      payload.escalationWindowMinutes = parsed;
    } else {
      delete payload.escalationWindowMinutes;
    }
  }
  return payload;
}

function sanitiseContactInput(body) {
  const payload = extractPayload(body, CONTACT_FIELDS);
  if (Object.hasOwn(payload, 'isPrimary')) {
    const normalised = normaliseBoolean(payload.isPrimary);
    if (typeof normalised === 'boolean') {
      payload.isPrimary = normalised;
    }
  }
  return payload;
}

function sanitiseLocationInput(body) {
  const payload = extractPayload(body, LOCATION_FIELDS);
  if (Object.hasOwn(payload, 'isPrimary')) {
    const normalised = normaliseBoolean(payload.isPrimary);
    if (typeof normalised === 'boolean') {
      payload.isPrimary = normalised;
    }
  }
  return payload;
}

function sanitiseCouponInput(body) {
  const payload = extractPayload(body, COUPON_FIELDS);

  if (Object.hasOwn(payload, 'name')) {
    payload.name = `${payload.name ?? ''}`.trim();
  }

  if (Object.hasOwn(payload, 'code')) {
    payload.code = `${payload.code ?? ''}`.replace(/\s+/g, '').toUpperCase();
  }

  const trimStringField = (field) => {
    if (Object.hasOwn(payload, field)) {
      const value = `${payload[field] ?? ''}`.trim();
      payload[field] = value.length ? value : null;
    }
  };

  ['description', 'imageUrl', 'termsUrl', 'internalNotes'].forEach(trimStringField);

  if (Object.hasOwn(payload, 'currency')) {
    const value = `${payload.currency ?? ''}`.trim().toUpperCase();
    payload.currency = value.length ? value : null;
  }

  const parseDecimal = (value) => {
    const numeric = Number.parseFloat(`${value ?? ''}`);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const parseInteger = (value) => {
    const numeric = Number.parseInt(`${value ?? ''}`, 10);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  };

  if (Object.hasOwn(payload, 'discountValue')) {
    payload.discountValue = parseDecimal(payload.discountValue);
  }

  if (Object.hasOwn(payload, 'minOrderTotal')) {
    payload.minOrderTotal = parseDecimal(payload.minOrderTotal);
  }

  if (Object.hasOwn(payload, 'maxRedemptions')) {
    payload.maxRedemptions = parseInteger(payload.maxRedemptions);
  }

  if (Object.hasOwn(payload, 'maxRedemptionsPerCustomer')) {
    payload.maxRedemptionsPerCustomer = parseInteger(payload.maxRedemptionsPerCustomer);
  }

  if (Object.hasOwn(payload, 'autoApply')) {
    const normalised = normaliseBoolean(payload.autoApply);
    if (typeof normalised === 'boolean') {
      payload.autoApply = normalised;
    }
  }

  if (Object.hasOwn(payload, 'status')) {
    const value = `${payload.status ?? ''}`.trim().toLowerCase();
    payload.status = value.length ? value : null;
  }

  const parseDateValue = (value) => {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  if (Object.hasOwn(payload, 'startsAt')) {
    payload.startsAt = parseDateValue(payload.startsAt);
  }

  if (Object.hasOwn(payload, 'expiresAt')) {
    payload.expiresAt = parseDateValue(payload.expiresAt);
  }

  return payload;
}

function buildAuditContext(req) {
  return {
    actorId: req.auth?.actor?.actorId ?? req.user?.id ?? null,
    actorRole: req.auth?.actor?.role ?? req.user?.role ?? 'user',
    actorPersona: req.auth?.actor?.persona ?? req.user?.persona ?? null,
    ipAddress: req.ip ?? null,
    userAgent: req.headers['user-agent'] ?? null,
    correlationId: req.headers['x-request-id'] ?? req.headers['x-correlation-id'] ?? null
  };
}

function handleServiceError(res, next, error) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  return next(error);
}

function serialiseProfile(profile) {
  if (!profile) {
    return null;
  }
  const payload = profile.toJSON();
  return {
    id: payload.id,
    userId: payload.userId,
    preferredName: payload.preferredName ?? '',
    companyName: payload.companyName ?? '',
    jobTitle: payload.jobTitle ?? '',
    primaryEmail: payload.primaryEmail ?? '',
    primaryPhone: payload.primaryPhone ?? '',
    preferredContactMethod: payload.preferredContactMethod ?? '',
    billingEmail: payload.billingEmail ?? '',
    timezone: payload.timezone ?? '',
    locale: payload.locale ?? '',
    defaultCurrency: payload.defaultCurrency ?? '',
    avatarUrl: payload.avatarUrl ?? '',
    coverImageUrl: payload.coverImageUrl ?? '',
    supportNotes: payload.supportNotes ?? '',
    escalationWindowMinutes: payload.escalationWindowMinutes ?? 120,
    marketingOptIn: payload.marketingOptIn ?? false,
    notificationsEmailOptIn: payload.notificationsEmailOptIn ?? true,
    notificationsSmsOptIn: payload.notificationsSmsOptIn ?? false,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt
  };
}

function serialiseContact(contact) {
  const payload = contact.toJSON();
  return {
    id: payload.id,
    userId: payload.userId,
    name: payload.name ?? '',
    role: payload.role ?? '',
    email: payload.email ?? '',
    phone: payload.phone ?? '',
    contactType: payload.contactType,
    isPrimary: Boolean(payload.isPrimary),
    notes: payload.notes ?? '',
    avatarUrl: payload.avatarUrl ?? '',
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt
  };
}

function serialiseLocation(location) {
  const payload = location.toJSON();
  return {
    id: payload.id,
    userId: payload.userId,
    label: payload.label ?? '',
    addressLine1: payload.addressLine1 ?? '',
    addressLine2: payload.addressLine2 ?? '',
    city: payload.city ?? '',
    region: payload.region ?? '',
    postalCode: payload.postalCode ?? '',
    country: payload.country ?? '',
    accessNotes: payload.accessNotes ?? '',
    isPrimary: Boolean(payload.isPrimary),
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt
  };
}

function resolveCouponLifecycleStatus(payload) {
  const now = new Date();
  const startsAt = payload.startsAt ? new Date(payload.startsAt) : null;
  const expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;

  if (payload.status === 'archived') {
    return 'archived';
  }

  if (payload.status === 'expired' || (expiresAt && expiresAt < now)) {
    return 'expired';
  }

  if (startsAt && startsAt > now) {
    return 'scheduled';
  }

  if (payload.status === 'draft') {
    return 'draft';
  }

  return 'active';
}

function serialiseCoupon(coupon) {
  const payload = coupon.toJSON();
  const discountValue = payload.discountValue ? Number.parseFloat(payload.discountValue) : 0;
  const minOrderTotal = payload.minOrderTotal ? Number.parseFloat(payload.minOrderTotal) : null;

  return {
    id: payload.id,
    userId: payload.userId,
    name: payload.name ?? '',
    code: payload.code ?? '',
    description: payload.description ?? '',
    discountType: payload.discountType ?? 'percentage',
    discountValue: Number.isFinite(discountValue) ? discountValue : 0,
    currency: payload.currency ?? null,
    minOrderTotal: Number.isFinite(minOrderTotal) ? minOrderTotal : null,
    startsAt: payload.startsAt ? new Date(payload.startsAt).toISOString() : null,
    expiresAt: payload.expiresAt ? new Date(payload.expiresAt).toISOString() : null,
    maxRedemptions: payload.maxRedemptions ?? null,
    maxRedemptionsPerCustomer: payload.maxRedemptionsPerCustomer ?? null,
    autoApply: Boolean(payload.autoApply),
    status: payload.status ?? 'draft',
    lifecycleStatus: resolveCouponLifecycleStatus(payload),
    imageUrl: payload.imageUrl ?? '',
    termsUrl: payload.termsUrl ?? '',
    internalNotes: payload.internalNotes ?? '',
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt
  };
}

export async function getCustomerOverview(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const { profile, contacts, locations, coupons } = await loadCustomerOverview(userId);

    return res.json({
      profile: serialiseProfile(profile),
      contacts: contacts.map(serialiseContact),
      locations: locations.map(serialiseLocation),
      coupons: coupons.map(serialiseCoupon)
    });
  } catch (error) {
    next(error);
  }
}

export async function upsertCustomerProfile(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const payload = sanitiseProfileInput(req.body ?? {});
    const profile = await persistCustomerProfile({
      userId,
      payload,
      auditContext: buildAuditContext(req)
    });

    return res.json({ profile: serialiseProfile(profile) });
  } catch (error) {
    next(error);
  }
}

export async function createCustomerContact(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const payload = sanitiseContactInput(req.body ?? {});
    const contact = await createCustomerContactRecord({
      userId,
      payload,
      auditContext: buildAuditContext(req)
    });
    return res.status(201).json({ contact: serialiseContact(contact) });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateCustomerContact(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const contactId = req.params.contactId;
    const payload = sanitiseContactInput(req.body ?? {});
    const contact = await updateCustomerContactRecord({
      userId,
      contactId,
      payload,
      auditContext: buildAuditContext(req)
    });

    return res.json({ contact: serialiseContact(contact) });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteCustomerContact(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const contactId = req.params.contactId;
    await deleteCustomerContactRecord({
      userId,
      contactId,
      auditContext: buildAuditContext(req)
    });
    return res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function createCustomerLocation(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const payload = sanitiseLocationInput(req.body ?? {});
    const location = await createCustomerLocationRecord({
      userId,
      payload,
      auditContext: buildAuditContext(req)
    });
    return res.status(201).json({ location: serialiseLocation(location) });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateCustomerLocation(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const locationId = req.params.locationId;
    const payload = sanitiseLocationInput(req.body ?? {});
    const location = await updateCustomerLocationRecord({
      userId,
      locationId,
      payload,
      auditContext: buildAuditContext(req)
    });

    return res.json({ location: serialiseLocation(location) });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteCustomerLocation(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const locationId = req.params.locationId;
    await deleteCustomerLocationRecord({
      userId,
      locationId,
      auditContext: buildAuditContext(req)
    });
    return res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function createCustomerCoupon(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const payload = sanitiseCouponInput(req.body ?? {});
    const coupon = await createCustomerCouponRecord({
      userId,
      payload,
      auditContext: buildAuditContext(req)
    });

    return res.status(201).json({ coupon: serialiseCoupon(coupon) });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateCustomerCoupon(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const couponId = req.params.couponId;
    const payload = sanitiseCouponInput(req.body ?? {});
    const coupon = await updateCustomerCouponRecord({
      userId,
      couponId,
      payload,
      auditContext: buildAuditContext(req)
    });

    return res.json({ coupon: serialiseCoupon(coupon) });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function deleteCustomerCoupon(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'auth_required' });
    }

    const couponId = req.params.couponId;
    await deleteCustomerCouponRecord({
      userId,
      couponId,
      auditContext: buildAuditContext(req)
    });

    return res.status(204).send();
  } catch (error) {
    handleServiceError(res, next, error);
  }
}
