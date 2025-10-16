import { validationResult } from 'express-validator';
import {
  loadCustomerOverview,
  persistCustomerProfile,
  createCustomerContactRecord,
  updateCustomerContactRecord,
  deleteCustomerContactRecord,
  createCustomerLocationRecord,
  updateCustomerLocationRecord,
  deleteCustomerLocationRecord
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
  'zoneLabel',
  'zoneCode',
  'serviceCatalogues',
  'onsiteContactName',
  'onsiteContactPhone',
  'onsiteContactEmail',
  'accessWindowStart',
  'accessWindowEnd',
  'parkingInformation',
  'loadingDockDetails',
  'securityNotes',
  'floorLevel',
  'mapImageUrl',
  'accessNotes',
  'isPrimary'
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
    zoneLabel: payload.zoneLabel ?? '',
    zoneCode: payload.zoneCode ?? '',
    serviceCatalogues: payload.serviceCatalogues ?? '',
    onsiteContactName: payload.onsiteContactName ?? '',
    onsiteContactPhone: payload.onsiteContactPhone ?? '',
    onsiteContactEmail: payload.onsiteContactEmail ?? '',
    accessWindowStart: payload.accessWindowStart ?? '',
    accessWindowEnd: payload.accessWindowEnd ?? '',
    parkingInformation: payload.parkingInformation ?? '',
    loadingDockDetails: payload.loadingDockDetails ?? '',
    securityNotes: payload.securityNotes ?? '',
    floorLevel: payload.floorLevel ?? '',
    mapImageUrl: payload.mapImageUrl ?? '',
    accessNotes: payload.accessNotes ?? '',
    isPrimary: Boolean(payload.isPrimary),
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

    const { profile, contacts, locations } = await loadCustomerOverview(userId);

    return res.json({
      profile: serialiseProfile(profile),
      contacts: contacts.map(serialiseContact),
      locations: locations.map(serialiseLocation)
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
