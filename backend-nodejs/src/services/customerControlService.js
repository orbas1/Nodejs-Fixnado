import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  CustomerProfile,
  CustomerContact,
  CustomerLocation
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

export async function loadCustomerOverview(userId) {
  const [profile, contacts, locations] = await Promise.all([
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
    })
  ]);

  return { profile, contacts, locations };
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

export default {
  loadCustomerOverview,
  persistCustomerProfile,
  createCustomerContactRecord,
  updateCustomerContactRecord,
  deleteCustomerContactRecord,
  createCustomerLocationRecord,
  updateCustomerLocationRecord,
  deleteCustomerLocationRecord
};
