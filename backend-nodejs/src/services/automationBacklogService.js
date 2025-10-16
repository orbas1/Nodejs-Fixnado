import { Op } from 'sequelize';
import { z } from 'zod';
import { AutomationInitiative } from '../models/index.js';

export const AUTOMATION_STATUSES = [
  'ideation',
  'discovery',
  'pilot',
  'delivery',
  'live',
  'on_hold',
  'blocked',
  'sunset'
];

export const AUTOMATION_STAGES = ['backlog', 'validation', 'delivery', 'stabilisation', 'scale'];
export const AUTOMATION_PRIORITIES = ['now', 'next', 'later'];
export const AUTOMATION_RISKS = ['low', 'medium', 'high'];

const PRIORITY_ORDER_LITERAL = AutomationInitiative.sequelize.literal(
  `CASE "AutomationInitiative"."priority" WHEN 'now' THEN 0 WHEN 'next' THEN 1 ELSE 2 END`
);

const optionalString = (max) =>
  z
    .string({ required_error: 'Required' })
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .optional()
    .transform((value) => (value && value.length ? value : null));

const optionalDate = z
  .preprocess((value) => {
    if (value == null || value === '') {
      return null;
    }
    if (value instanceof Date) {
      return value;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, z.date().nullable());

const optionalNumber = z.preprocess((value) => {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  const numeric = Number.parseFloat(value);
  return Number.isNaN(numeric) ? null : numeric;
}, z.number().nonnegative().nullable());

const dependencySchema = z.object({
  label: z.string().trim().min(1).max(160),
  owner: optionalString(120).nullable(),
  status: z.string().trim().min(1).max(60),
  dueOn: optionalDate.optional()
});

const attachmentSchema = z.object({
  label: z.string().trim().min(1).max(160),
  url: z.string().trim().url('Provide a valid URL'),
  type: optionalString(60).nullable(),
  description: optionalString(240).nullable()
});

const imageSchema = attachmentSchema.extend({
  thumbnailUrl: optionalString(300).nullable()
});

const allowedRoleSchema = z.string().trim().min(1).transform((role) => role.toLowerCase());

const payloadSchema = z.object({
  name: z.string().trim().min(3).max(160),
  summary: z.string().trim().min(10),
  status: z.enum(AUTOMATION_STATUSES),
  stage: z.enum(AUTOMATION_STAGES),
  category: optionalString(64).nullable(),
  automationType: optionalString(64).nullable(),
  owner: z.string().trim().min(3).max(120),
  sponsor: optionalString(120).nullable(),
  squad: optionalString(120).nullable(),
  readinessScore: z.coerce.number().int().min(0).max(100),
  priority: z.enum(AUTOMATION_PRIORITIES),
  riskLevel: z.enum(AUTOMATION_RISKS),
  targetMetric: optionalString(160).nullable(),
  baselineMetric: optionalString(160).nullable(),
  forecastMetric: optionalString(160).nullable(),
  estimatedSavings: optionalNumber,
  savingsCurrency: optionalString(3).nullable(),
  expectedLaunchAt: optionalDate,
  nextMilestoneOn: optionalDate,
  lastReviewedAt: optionalDate,
  notes: z.string().trim().max(2000).optional().default(''),
  allowedRoles: z.array(allowedRoleSchema).min(1).default(['admin']),
  dependencies: z.array(dependencySchema).default([]),
  blockers: z.array(dependencySchema).default([]),
  attachments: z.array(attachmentSchema).default([]),
  images: z.array(imageSchema).default([]),
  metadata: z.record(z.any()).default({})
});

function sanitizeArray(value, schema) {
  try {
    return schema.parse(value);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw Object.assign(new Error(error.errors?.[0]?.message || 'Invalid payload'), {
        statusCode: 422,
        details: error.flatten()
      });
    }
    throw error;
  }
}

export function validateAutomationInitiativePayload(payload) {
  try {
    return payloadSchema.parse(payload ?? {});
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors?.[0]?.message || 'Invalid automation initiative payload';
      throw Object.assign(new Error(message), {
        statusCode: 422,
        details: error.flatten()
      });
    }
    throw error;
  }
}

export async function listAutomationInitiatives({ includeArchived = false } = {}) {
  const where = includeArchived
    ? {}
    : {
        [Op.or]: [{ archivedAt: { [Op.is]: null } }, { archivedAt: { [Op.eq]: null } }]
      };

  const initiatives = await AutomationInitiative.findAll({
    where,
    order: [
      [PRIORITY_ORDER_LITERAL, 'ASC'],
      ['readiness_score', 'DESC'],
      ['updated_at', 'DESC']
    ]
  });

  return initiatives.map((item) => item.toJSON());
}

export async function getAutomationInitiativeById(id) {
  return AutomationInitiative.findByPk(id);
}

function applyPayload(model, payload, actorId) {
  const sanitized = validateAutomationInitiativePayload(payload);

  model.set({
    name: sanitized.name,
    summary: sanitized.summary,
    status: sanitized.status,
    stage: sanitized.stage,
    category: sanitized.category,
    automationType: sanitized.automationType,
    owner: sanitized.owner,
    sponsor: sanitized.sponsor,
    squad: sanitized.squad,
    readinessScore: sanitized.readinessScore,
    priority: sanitized.priority,
    riskLevel: sanitized.riskLevel,
    targetMetric: sanitized.targetMetric,
    baselineMetric: sanitized.baselineMetric,
    forecastMetric: sanitized.forecastMetric,
    estimatedSavings: sanitized.estimatedSavings,
    savingsCurrency: sanitized.savingsCurrency?.toUpperCase() || null,
    expectedLaunchAt: sanitized.expectedLaunchAt,
    nextMilestoneOn: sanitized.nextMilestoneOn,
    lastReviewedAt: sanitized.lastReviewedAt,
    notes: sanitized.notes,
    allowedRoles: sanitized.allowedRoles,
    dependencies: sanitizeArray(sanitized.dependencies, z.array(dependencySchema)),
    blockers: sanitizeArray(sanitized.blockers, z.array(dependencySchema)),
    attachments: sanitizeArray(sanitized.attachments, z.array(attachmentSchema)),
    images: sanitizeArray(sanitized.images, z.array(imageSchema)),
    metadata: sanitized.metadata || {}
  });

  if (!model.createdBy) {
    model.createdBy = actorId ?? model.createdBy ?? null;
  }
  model.updatedBy = actorId ?? model.updatedBy ?? null;
}

export async function createAutomationInitiative({ actorId, payload }) {
  const model = AutomationInitiative.build();
  applyPayload(model, payload, actorId);
  model.archivedAt = null;
  model.archivedBy = null;
  await model.save();
  return model.toJSON();
}

export async function updateAutomationInitiative({ id, actorId, payload }) {
  const model = await getAutomationInitiativeById(id);
  if (!model) {
    throw Object.assign(new Error('Automation initiative not found'), { statusCode: 404 });
  }
  applyPayload(model, payload, actorId);
  await model.save();
  return model.toJSON();
}

export async function archiveAutomationInitiative({ id, actorId }) {
  const model = await getAutomationInitiativeById(id);
  if (!model) {
    throw Object.assign(new Error('Automation initiative not found'), { statusCode: 404 });
  }
  model.archivedAt = new Date();
  model.archivedBy = actorId ?? null;
  await model.save();
  return model.toJSON();
}

export function mapInitiativeToDashboard(item) {
  const tone = item.riskLevel === 'low' ? 'success' : item.riskLevel === 'medium' ? 'info' : 'warning';
  const readinessLabel = `Readiness ${item.readinessScore ?? 0}%`;
  const milestoneLabel = item.nextMilestoneOn
    ? `Next milestone ${new Date(item.nextMilestoneOn).toLocaleDateString()}`
    : 'Milestone to schedule';
  return {
    name: item.name,
    status: `${item.status.replace(/_/g, ' ')}`.replace(/\b\w/g, (c) => c.toUpperCase()),
    notes: `${item.summary}\n${readinessLabel} • ${milestoneLabel}`,
    tone
  };
}

export async function listAutomationInitiativesForDashboard(limit = 6) {
  const records = await AutomationInitiative.findAll({
    where: {
      [Op.or]: [{ archivedAt: { [Op.is]: null } }, { archivedAt: { [Op.eq]: null } }]
    },
    order: [
      [PRIORITY_ORDER_LITERAL, 'ASC'],
      ['readiness_score', 'DESC'],
      ['updated_at', 'DESC']
    ],
    limit
  });
  return records.map((record) => mapInitiativeToDashboard(record));
}
