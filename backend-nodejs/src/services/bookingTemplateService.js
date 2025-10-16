import { Op } from 'sequelize';
import slugify from 'slugify';
import { BookingTemplate } from '../models/index.js';

function normaliseChecklist(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item, index) => {
      if (!item) return null;
      const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `item-${index + 1}`;
      const label = typeof item.label === 'string' ? item.label.trim() : '';
      if (!label) {
        return null;
      }
      return {
        id,
        label,
        mandatory: item.mandatory === true
      };
    })
    .filter(Boolean);
}

function normaliseAttachments(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item) => {
      if (!item) return null;
      const label = typeof item.label === 'string' ? item.label.trim() : '';
      const url = typeof item.url === 'string' ? item.url.trim() : '';
      if (!label || !url) {
        return null;
      }
      const type = typeof item.type === 'string' && item.type.trim() ? item.type.trim().toLowerCase() : 'document';
      return { label, url, type };
    })
    .filter(Boolean);
}

function coerceNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}

function ensureTemplate(template) {
  if (!template) {
    const error = new Error('Booking template not found');
    error.statusCode = 404;
    throw error;
  }
  return template;
}

export async function listBookingTemplates({ includeRetired = false } = {}) {
  const where = includeRetired
    ? {}
    : {
        status: {
          [Op.ne]: 'retired'
        }
      };
  const templates = await BookingTemplate.findAll({ where, order: [['name', 'ASC']] });
  return templates.map((template) => template.get({ plain: true }));
}

export async function getBookingTemplateById(templateId) {
  if (!templateId) {
    return null;
  }
  const template = await BookingTemplate.findByPk(templateId);
  return template ? template.get({ plain: true }) : null;
}

function buildSlug(name) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Template name is required');
  }
  return slugify(name.trim(), { lower: true, replacement: '-' });
}

export async function createBookingTemplate(payload = {}, actor = 'system') {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  if (!name) {
    const error = new Error('Template name is required');
    error.statusCode = 400;
    throw error;
  }

  const slug = payload.slug ? payload.slug.trim().toLowerCase() : buildSlug(name);
  const template = await BookingTemplate.create({
    name,
    slug,
    category: typeof payload.category === 'string' ? payload.category.trim() : null,
    status: ['draft', 'published', 'retired'].includes(payload.status) ? payload.status : 'draft',
    defaultType: payload.defaultType === 'on_demand' ? 'on_demand' : 'scheduled',
    defaultDemandLevel: typeof payload.defaultDemandLevel === 'string'
      ? payload.defaultDemandLevel.trim().toLowerCase()
      : 'medium',
    defaultBaseAmount: coerceNumber(payload.defaultBaseAmount),
    defaultCurrency:
      typeof payload.defaultCurrency === 'string' && payload.defaultCurrency.trim().length === 3
        ? payload.defaultCurrency.trim().toUpperCase()
        : 'GBP',
    defaultDurationMinutes: Number.isInteger(payload.defaultDurationMinutes)
      ? payload.defaultDurationMinutes
      : coerceNumber(payload.defaultDurationMinutes, null),
    instructions: typeof payload.instructions === 'string' ? payload.instructions.trim() : null,
    description: typeof payload.description === 'string' ? payload.description.trim() : null,
    checklist: normaliseChecklist(payload.checklist),
    attachments: normaliseAttachments(payload.attachments),
    heroImageUrl: typeof payload.heroImageUrl === 'string' ? payload.heroImageUrl.trim() : null,
    media: Array.isArray(payload.media) ? payload.media : [],
    metadata:
      payload.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
        ? payload.metadata
        : {},
    version: Number.isInteger(payload.version) && payload.version > 0 ? payload.version : 1,
    createdBy: actor,
    updatedBy: actor
  });

  return template.get({ plain: true });
}

export async function updateBookingTemplate(templateId, payload = {}, actor = 'system') {
  const template = ensureTemplate(await BookingTemplate.findByPk(templateId));

  const updates = {};
  if (typeof payload.name === 'string' && payload.name.trim()) {
    updates.name = payload.name.trim();
  }
  if (typeof payload.slug === 'string' && payload.slug.trim()) {
    updates.slug = payload.slug.trim().toLowerCase();
  }
  if (typeof payload.category === 'string') {
    updates.category = payload.category.trim() || null;
  }
  if (['draft', 'published', 'retired'].includes(payload.status)) {
    updates.status = payload.status;
  }
  if (payload.defaultType === 'on_demand' || payload.defaultType === 'scheduled') {
    updates.defaultType = payload.defaultType;
  }
  if (typeof payload.defaultDemandLevel === 'string' && payload.defaultDemandLevel.trim()) {
    updates.defaultDemandLevel = payload.defaultDemandLevel.trim().toLowerCase();
  }
  if (Object.hasOwn(payload, 'defaultBaseAmount')) {
    updates.defaultBaseAmount = coerceNumber(payload.defaultBaseAmount);
  }
  if (
    typeof payload.defaultCurrency === 'string' &&
    payload.defaultCurrency.trim().length >= 3
  ) {
    updates.defaultCurrency = payload.defaultCurrency.trim().slice(0, 3).toUpperCase();
  }
  if (Object.hasOwn(payload, 'defaultDurationMinutes')) {
    updates.defaultDurationMinutes = Number.isInteger(payload.defaultDurationMinutes)
      ? payload.defaultDurationMinutes
      : coerceNumber(payload.defaultDurationMinutes, null);
  }
  if (Object.hasOwn(payload, 'instructions')) {
    updates.instructions = typeof payload.instructions === 'string' ? payload.instructions.trim() : null;
  }
  if (Object.hasOwn(payload, 'description')) {
    updates.description = typeof payload.description === 'string' ? payload.description.trim() : null;
  }
  if (Object.hasOwn(payload, 'checklist')) {
    updates.checklist = normaliseChecklist(payload.checklist);
  }
  if (Object.hasOwn(payload, 'attachments')) {
    updates.attachments = normaliseAttachments(payload.attachments);
  }
  if (Object.hasOwn(payload, 'heroImageUrl')) {
    updates.heroImageUrl = typeof payload.heroImageUrl === 'string' ? payload.heroImageUrl.trim() : null;
  }
  if (Object.hasOwn(payload, 'media')) {
    updates.media = Array.isArray(payload.media) ? payload.media : [];
  }
  if (payload.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)) {
    updates.metadata = { ...template.metadata, ...payload.metadata };
  }
  if (Number.isInteger(payload.version) && payload.version > 0) {
    updates.version = payload.version;
  }

  updates.updatedBy = actor;

  await template.update(updates);
  const reloaded = await template.reload();
  return reloaded.get({ plain: true });
}

export async function archiveBookingTemplate(templateId, actor = 'system') {
  const template = ensureTemplate(await BookingTemplate.findByPk(templateId));
  await template.update({ status: 'retired', updatedBy: actor });
  return template.get({ plain: true });
}

export default {
  listBookingTemplates,
  getBookingTemplateById,
  createBookingTemplate,
  updateBookingTemplate,
  archiveBookingTemplate
};
