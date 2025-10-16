import { Op, fn, col } from 'sequelize';
import { DateTime } from 'luxon';
import ComplianceControl from '../models/complianceControl.js';
import Company from '../models/company.js';
import User from '../models/user.js';
import PlatformSetting from '../models/platformSetting.js';

export const CONTROL_CATEGORIES = ['policy', 'procedure', 'technical', 'vendor', 'training', 'other'];
export const CONTROL_TYPES = ['preventative', 'detective', 'corrective', 'compensating'];
export const CONTROL_STATUSES = ['draft', 'active', 'monitoring', 'overdue', 'retired'];
export const REVIEW_FREQUENCIES = ['monthly', 'quarterly', 'semiannual', 'annual', 'event_driven'];

const DEFAULT_AUTOMATION_SETTINGS = Object.freeze({
  autoReminders: true,
  reminderOffsetDays: 7,
  defaultOwnerTeam: 'Compliance Ops',
  escalateTo: 'compliance-ops@fixnado.com',
  evidenceGraceDays: 2
});

const AUTOMATION_SETTING_KEY = 'compliance.control.automation';
const LIKE_OPERATOR = Object.prototype.hasOwnProperty.call(Op, 'iLike') ? Op.iLike : Op.like;

function normaliseArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : entry))
      .filter((entry) => Boolean(entry && String(entry).trim()))
      .map((entry) => String(entry).trim());
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'number') {
    const parsedMillis = DateTime.fromMillis(value);
    return parsedMillis.isValid ? parsedMillis.toJSDate() : null;
  }

  const parsed = DateTime.fromISO(String(value), { zone: 'utc' });
  if (!parsed.isValid) {
    return null;
  }
  return parsed.toJSDate();
}

function sanitiseMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return { evidenceCheckpoints: [], exceptionReviews: [] };
  }

  const evidenceCheckpoints = Array.isArray(metadata.evidenceCheckpoints)
    ? metadata.evidenceCheckpoints
        .map((item) => ({
          id: item.id || item.name || item.requirement || null,
          name: typeof item.name === 'string' ? item.name.trim() : '',
          requirement: typeof item.requirement === 'string' ? item.requirement.trim() : '',
          dueAt: item.dueAt ? DateTime.fromISO(item.dueAt).toISO() : null,
          owner: typeof item.owner === 'string' ? item.owner.trim() : '',
          status: typeof item.status === 'string' ? item.status.trim() : 'pending',
          evidenceUrl: typeof item.evidenceUrl === 'string' ? item.evidenceUrl.trim() : '',
          notes: typeof item.notes === 'string' ? item.notes.trim() : ''
        }))
        .filter((item) => item.name || item.requirement)
    : [];

  const exceptionReviews = Array.isArray(metadata.exceptionReviews)
    ? metadata.exceptionReviews
        .map((item) => ({
          id: item.id || item.summary || null,
          summary: typeof item.summary === 'string' ? item.summary.trim() : '',
          owner: typeof item.owner === 'string' ? item.owner.trim() : '',
          expiresAt: item.expiresAt ? DateTime.fromISO(item.expiresAt).toISO() : null,
          status: typeof item.status === 'string' ? item.status.trim() : 'open',
          notes: typeof item.notes === 'string' ? item.notes.trim() : ''
        }))
        .filter((item) => item.summary)
    : [];

  const automation = metadata.automation && typeof metadata.automation === 'object' ? metadata.automation : {};
  const rolesAllowed = normaliseArray(metadata.rolesAllowed);

  return {
    evidenceCheckpoints,
    exceptionReviews,
    automation,
    rolesAllowed
  };
}

function buildDueDescriptor(control, timezone = 'UTC') {
  if (!control.nextReviewAt) {
    return { dueLabel: 'No review scheduled', dueStatus: 'unscheduled' };
  }

  const now = DateTime.now().setZone(timezone);
  const due = DateTime.fromJSDate(control.nextReviewAt).setZone(timezone);
  const diffDays = Math.round(due.diff(now, 'days').days);

  if (diffDays < 0) {
    return { dueLabel: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`, dueStatus: 'overdue' };
  }

  if (diffDays === 0) {
    return { dueLabel: 'Due today', dueStatus: 'due-today' };
  }

  if (diffDays <= 7) {
    return { dueLabel: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`, dueStatus: 'due-soon' };
  }

  return { dueLabel: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`, dueStatus: 'on-track' };
}

function toControlDto(control, timezone = 'UTC') {
  const owner = control.owner
    ? {
        id: control.owner.id,
        name: [control.owner.firstName, control.owner.lastName].filter(Boolean).join(' ').trim() || null,
        email: control.owner.email || null
      }
    : null;

  const company = control.company
    ? {
        id: control.company.id,
        name: control.company.contactName || control.company.legalStructure || control.company.name || null
      }
    : null;

  const metadata = control.metadata && typeof control.metadata === 'object' ? control.metadata : {};
  const { dueLabel, dueStatus } = buildDueDescriptor(control, timezone);

  return {
    id: control.id,
    title: control.title,
    category: control.category,
    controlType: control.controlType,
    status: control.status,
    reviewFrequency: control.reviewFrequency,
    nextReviewAt: control.nextReviewAt ? control.nextReviewAt.toISOString() : null,
    lastReviewAt: control.lastReviewAt ? control.lastReviewAt.toISOString() : null,
    ownerTeam: control.ownerTeam,
    ownerEmail: control.ownerEmail || null,
    owner,
    company,
    evidenceRequired: control.evidenceRequired,
    evidenceLocation: control.evidenceLocation || null,
    documentationUrl: control.documentationUrl || null,
    escalationPolicy: control.escalationPolicy || null,
    notes: control.notes || null,
    tags: Array.isArray(control.tags) ? control.tags : [],
    watchers: Array.isArray(control.watchers) ? control.watchers : [],
    metadata,
    dueLabel,
    dueStatus
  };
}

function sanitiseControlPayload(payload = {}) {
  const cleanedMetadata = sanitiseMetadata(payload.metadata);

  const body = {
    title: typeof payload.title === 'string' ? payload.title.trim() : null,
    category: CONTROL_CATEGORIES.includes(payload.category) ? payload.category : 'policy',
    controlType: CONTROL_TYPES.includes(payload.controlType) ? payload.controlType : 'preventative',
    status: CONTROL_STATUSES.includes(payload.status) ? payload.status : 'active',
    reviewFrequency: REVIEW_FREQUENCIES.includes(payload.reviewFrequency) ? payload.reviewFrequency : 'annual',
    ownerTeam: typeof payload.ownerTeam === 'string' && payload.ownerTeam.trim() ? payload.ownerTeam.trim() : 'Compliance Ops',
    ownerEmail: typeof payload.ownerEmail === 'string' && payload.ownerEmail.trim() ? payload.ownerEmail.trim() : null,
    ownerId: payload.ownerId || null,
    companyId: payload.companyId || null,
    nextReviewAt: parseDate(payload.nextReviewAt),
    lastReviewAt: parseDate(payload.lastReviewAt),
    evidenceRequired: payload.evidenceRequired === true || payload.evidenceRequired === 'true',
    evidenceLocation:
      typeof payload.evidenceLocation === 'string' && payload.evidenceLocation.trim()
        ? payload.evidenceLocation.trim()
        : null,
    documentationUrl:
      typeof payload.documentationUrl === 'string' && payload.documentationUrl.trim()
        ? payload.documentationUrl.trim()
        : null,
    escalationPolicy:
      typeof payload.escalationPolicy === 'string' && payload.escalationPolicy.trim()
        ? payload.escalationPolicy.trim()
        : null,
    notes: typeof payload.notes === 'string' && payload.notes.trim() ? payload.notes.trim() : null,
    tags: normaliseArray(payload.tags),
    watchers: normaliseArray(payload.watchers),
    metadata: {
      ...cleanedMetadata,
      automation:
        cleanedMetadata.automation && typeof cleanedMetadata.automation === 'object'
          ? cleanedMetadata.automation
          : {},
      evidenceCheckpoints: cleanedMetadata.evidenceCheckpoints,
      exceptionReviews: cleanedMetadata.exceptionReviews,
      rolesAllowed: cleanedMetadata.rolesAllowed
    }
  };

  if (!body.title) {
    throw new Error('Control title is required');
  }

  return body;
}

export async function listComplianceControls({
  status,
  category,
  ownerTeam,
  search,
  dueBefore,
  dueAfter,
  timezone = 'UTC'
} = {}) {
  const where = {};

  if (status && CONTROL_STATUSES.includes(status)) {
    where.status = status;
  }

  if (category && CONTROL_CATEGORIES.includes(category)) {
    where.category = category;
  }

  if (ownerTeam && typeof ownerTeam === 'string') {
    where.ownerTeam = ownerTeam.trim();
  }

  if (dueBefore) {
    where.nextReviewAt = {
      ...(where.nextReviewAt || {}),
      [Op.lte]: parseDate(dueBefore)
    };
  }

  if (dueAfter) {
    where.nextReviewAt = {
      ...(where.nextReviewAt || {}),
      [Op.gte]: parseDate(dueAfter)
    };
  }

  if (search && typeof search === 'string' && search.trim()) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { title: { [LIKE_OPERATOR]: term } },
      { ownerTeam: { [LIKE_OPERATOR]: term } }
    ];
  }

  const controls = await ComplianceControl.findAll({
    where,
    include: [
      { model: Company, as: 'company', attributes: ['id', 'contactName', 'legalStructure'] },
      { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }
    ],
    order: [
      ['status', 'ASC'],
      ['nextReviewAt', 'ASC'],
      ['title', 'ASC']
    ]
  });

  const [total, overdue, dueSoon, monitoring] = await Promise.all([
    ComplianceControl.count(),
    ComplianceControl.count({
      where: {
        status: { [Op.ne]: 'retired' },
        nextReviewAt: { [Op.not]: null, [Op.lt]: DateTime.now().toJSDate() }
      }
    }),
    ComplianceControl.count({
      where: {
        status: { [Op.in]: ['active', 'monitoring'] },
        nextReviewAt: {
          [Op.not]: null,
          [Op.between]: [DateTime.now().toJSDate(), DateTime.now().plus({ days: 14 }).toJSDate()]
        }
      }
    }),
    ComplianceControl.count({ where: { status: 'monitoring' } })
  ]);

  const ownerTeams = await ComplianceControl.findAll({
    attributes: [[fn('DISTINCT', col('owner_team')), 'ownerTeam']],
    raw: true
  });

  const automation = await getComplianceControlAutomationSettings();

  const evidence = controls.flatMap((control) => {
    const checkpoints = Array.isArray(control.metadata?.evidenceCheckpoints)
      ? control.metadata.evidenceCheckpoints
      : [];
    return checkpoints.map((checkpoint) => ({
      id: checkpoint.id || `${control.id}-evidence-${checkpoint.name}`,
      controlId: control.id,
      controlTitle: control.title,
      requirement: checkpoint.requirement || checkpoint.name || 'Evidence requirement',
      dueAt: checkpoint.dueAt || control.nextReviewAt?.toISOString() || null,
      status: checkpoint.status || 'pending',
      owner: checkpoint.owner || control.ownerTeam,
      evidenceUrl: checkpoint.evidenceUrl || null,
      notes: checkpoint.notes || null
    }));
  });

  const exceptions = controls.flatMap((control) => {
    const reviews = Array.isArray(control.metadata?.exceptionReviews)
      ? control.metadata.exceptionReviews
      : [];
    return reviews.map((review) => ({
      id: review.id || `${control.id}-exception-${review.summary}`,
      controlId: control.id,
      controlTitle: control.title,
      summary: review.summary,
      owner: review.owner || control.ownerTeam,
      status: review.status || 'open',
      expiresAt: review.expiresAt || null,
      notes: review.notes || null
    }));
  });

  return {
    controls: controls.map((control) => toControlDto(control, timezone)),
    summary: {
      total,
      overdue,
      dueSoon,
      monitoring
    },
    automation,
    evidence,
    exceptions,
    filters: {
      statuses: CONTROL_STATUSES,
      categories: CONTROL_CATEGORIES,
      reviewFrequencies: REVIEW_FREQUENCIES,
      controlTypes: CONTROL_TYPES,
      ownerTeams: ownerTeams
        .map((entry) => entry.ownerTeam)
        .filter((value) => typeof value === 'string' && value.trim())
    }
  };
}

export async function createComplianceControl(payload, { timezone = 'UTC' } = {}) {
  const body = sanitiseControlPayload(payload);
  const control = await ComplianceControl.create(body);
  const withRelations = await ComplianceControl.findByPk(control.id, {
    include: [
      { model: Company, as: 'company', attributes: ['id', 'contactName', 'legalStructure'] },
      { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }
    ]
  });
  return toControlDto(withRelations, timezone);
}

export async function updateComplianceControl(controlId, payload, { timezone = 'UTC' } = {}) {
  const control = await ComplianceControl.findByPk(controlId);
  if (!control) {
    const error = new Error('Compliance control not found');
    error.status = 404;
    throw error;
  }

  const body = sanitiseControlPayload({ ...control.toJSON(), ...payload });
  await control.update(body);

  const withRelations = await ComplianceControl.findByPk(control.id, {
    include: [
      { model: Company, as: 'company', attributes: ['id', 'contactName', 'legalStructure'] },
      { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }
    ]
  });

  return toControlDto(withRelations, timezone);
}

export async function deleteComplianceControl(controlId) {
  const control = await ComplianceControl.findByPk(controlId);
  if (!control) {
    const error = new Error('Compliance control not found');
    error.status = 404;
    throw error;
  }

  await control.destroy();
}

export async function getComplianceControlAutomationSettings() {
  const setting = await PlatformSetting.findOne({ where: { key: AUTOMATION_SETTING_KEY } });
  if (!setting) {
    return { ...DEFAULT_AUTOMATION_SETTINGS };
  }

  return {
    ...DEFAULT_AUTOMATION_SETTINGS,
    ...(setting.value || {})
  };
}

export async function updateComplianceControlAutomationSettings(values = {}, actorId = null) {
  const current = await getComplianceControlAutomationSettings();
  const next = {
    ...current,
    autoReminders: values.autoReminders ?? current.autoReminders,
    reminderOffsetDays: Number.isFinite(Number(values.reminderOffsetDays))
      ? Math.max(0, Number.parseInt(values.reminderOffsetDays, 10))
      : current.reminderOffsetDays,
    defaultOwnerTeam:
      typeof values.defaultOwnerTeam === 'string' && values.defaultOwnerTeam.trim()
        ? values.defaultOwnerTeam.trim()
        : current.defaultOwnerTeam,
    escalateTo:
      typeof values.escalateTo === 'string' && values.escalateTo.trim()
        ? values.escalateTo.trim()
        : current.escalateTo,
    evidenceGraceDays: Number.isFinite(Number(values.evidenceGraceDays))
      ? Math.max(0, Number.parseInt(values.evidenceGraceDays, 10))
      : current.evidenceGraceDays
  };

  await PlatformSetting.upsert({
    key: AUTOMATION_SETTING_KEY,
    value: next,
    updatedBy: actorId || null
  });

  return next;
}

export function __private__test_only__sanitiseControlPayload(payload) {
  return sanitiseControlPayload(payload);
}

