import { AnalyticsEvent } from '../models/index.js';

const EVENT_DEFINITIONS = Object.freeze({
  'zone.created': {
    domain: 'zones',
    entityType: 'zone',
    requiredMetadata: ['zoneId', 'companyId', 'demandLevel', 'areaSqMeters'],
    tenantKey: 'companyId'
  },
  'zone.updated': {
    domain: 'zones',
    entityType: 'zone',
    requiredMetadata: ['zoneId', 'companyId', 'changes'],
    tenantKey: 'companyId'
  },
  'zone.deleted': {
    domain: 'zones',
    entityType: 'zone',
    requiredMetadata: ['zoneId', 'companyId'],
    tenantKey: 'companyId'
  },
  'booking.created': {
    domain: 'bookings',
    entityType: 'booking',
    requiredMetadata: ['bookingId', 'companyId', 'zoneId', 'type', 'demandLevel', 'currency', 'totalAmount', 'slaExpiresAt'],
    tenantKey: 'companyId'
  },
  'booking.status_transition': {
    domain: 'bookings',
    entityType: 'booking',
    requiredMetadata: ['bookingId', 'companyId', 'fromStatus', 'toStatus'],
    tenantKey: 'companyId'
  },
  'booking.assignment.created': {
    domain: 'bookings',
    entityType: 'booking_assignment',
    entityIdKey: 'assignmentId',
    requiredMetadata: ['bookingId', 'companyId', 'providerId', 'role', 'assignmentId'],
    tenantKey: 'companyId'
  },
  'booking.dispute.raised': {
    domain: 'disputes',
    entityType: 'booking',
    requiredMetadata: ['bookingId', 'companyId', 'reason'],
    tenantKey: 'companyId'
  },
  'rental.requested': {
    domain: 'rentals',
    entityType: 'rental_agreement',
    entityIdKey: 'rentalId',
    requiredMetadata: ['rentalId', 'companyId', 'itemId', 'quantity'],
    tenantKey: 'companyId'
  },
  'rental.status_transition': {
    domain: 'rentals',
    entityType: 'rental_agreement',
    entityIdKey: 'rentalId',
    requiredMetadata: ['rentalId', 'companyId', 'fromStatus', 'toStatus'],
    tenantKey: 'companyId'
  },
  'rental.inspection.completed': {
    domain: 'rentals',
    entityType: 'rental_agreement',
    entityIdKey: 'rentalId',
    requiredMetadata: ['rentalId', 'companyId', 'outcome', 'totalCharges', 'currency', 'durationDays'],
    tenantKey: 'companyId'
  },
  'ads.campaign.metrics_recorded': {
    domain: 'ads',
    entityType: 'campaign',
    requiredMetadata: ['campaignId', 'companyId', 'flightId', 'metricDate', 'impressions', 'clicks', 'conversions', 'spend', 'currency'],
    tenantKey: 'companyId'
  },
  'ads.campaign.fraud_signal': {
    domain: 'ads',
    entityType: 'campaign',
    requiredMetadata: ['campaignId', 'companyId', 'signalType', 'severity'],
    tenantKey: 'companyId'
  },
  'communications.message.sent': {
    domain: 'communications',
    entityType: 'conversation_message',
    entityIdKey: 'messageId',
    requiredMetadata: ['conversationId', 'messageId', 'participantId', 'messageType', 'aiAssistUsed'],
    tenantKey: 'tenantId'
  },
  'communications.delivery.suppressed': {
    domain: 'communications',
    entityType: 'message_delivery',
    entityIdKey: 'deliveryId',
    requiredMetadata: ['conversationId', 'messageId', 'participantId', 'reason', 'deliveryId'],
    tenantKey: 'tenantId'
  }
});

function assertMetadataObject(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error('Event metadata must be an object.');
  }
}

function normaliseDate(value) {
  if (!value) {
    return new Date();
  }

  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid occurredAt timestamp provided for analytics event');
  }

  return parsed;
}

function ensureRequired(metadata, required, eventName) {
  if (!required || required.length === 0) {
    return;
  }

  const missing = required.filter((key) => metadata[key] === undefined || metadata[key] === null);
  if (missing.length > 0) {
    throw new Error(`Analytics event "${eventName}" is missing required metadata: ${missing.join(', ')}`);
  }
}

function sanitiseMetadata(metadata) {
  const cleaned = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function deriveTenantId(definition, metadata, explicitTenantId) {
  if (explicitTenantId) {
    return explicitTenantId;
  }

  if (definition.tenantKey && metadata[definition.tenantKey]) {
    return metadata[definition.tenantKey];
  }

  return null;
}

function resolveActor(actorInput = {}, fallbackType) {
  if (!actorInput) {
    return { type: fallbackType || null, id: null, label: null };
  }

  if (typeof actorInput === 'string') {
    return { type: fallbackType || 'system', id: null, label: actorInput };
  }

  return {
    type: actorInput.type || fallbackType || null,
    id: actorInput.id || null,
    label: actorInput.label || null
  };
}

export async function recordAnalyticsEvent(event, options = {}) {
  const definition = EVENT_DEFINITIONS[event.name];
  if (!definition) {
    throw new Error(`Unknown analytics event: ${event.name}`);
  }

  const metadataInput = event.metadata || {};
  assertMetadataObject(metadataInput);
  const metadata = sanitiseMetadata(metadataInput);
  ensureRequired(metadata, definition.requiredMetadata, event.name);

  const occurredAt = normaliseDate(event.occurredAt);
  const actorDetails = resolveActor(event.actor, event.actorType);
  const tenantId = deriveTenantId(definition, metadata, event.tenantId);

  const record = {
    eventName: event.name,
    domain: definition.domain,
    schemaVersion: definition.schemaVersion || 1,
    entityType: event.entityType || definition.entityType,
    entityId: event.entityId || metadata[definition.entityIdKey || `${definition.entityType}Id`] || null,
    entityExternalId: event.entityExternalId || null,
    actorType: actorDetails.type,
    actorId: actorDetails.id,
    actorLabel: actorDetails.label,
    tenantId,
    source: event.source || 'api',
    channel: event.channel || null,
    correlationId: event.correlationId || null,
    occurredAt,
    metadata
  };

  const createOptions = options.transaction ? { transaction: options.transaction } : undefined;
  const saved = await AnalyticsEvent.create(record, createOptions);
  return saved;
}

export async function recordAnalyticsEvents(events, options = {}) {
  if (!Array.isArray(events)) {
    throw new Error('recordAnalyticsEvents expects an array of events.');
  }

  const results = [];
  for (const event of events) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await recordAnalyticsEvent(event, options));
  }
  return results;
}

export function getAnalyticsEventDefinition(name) {
  return EVENT_DEFINITIONS[name] || null;
}

export const analyticsEventCatalog = EVENT_DEFINITIONS;
