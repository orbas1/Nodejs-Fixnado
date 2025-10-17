import { Company, User } from '../models/index.js';

export function buildHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function toSlug(input, fallback) {
  if (typeof input === 'string' && input.trim()) {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }
  return fallback;
}

export async function resolveCompanyForActor({ companyId, actor }) {
  if (!actor?.id) {
    throw buildHttpError(403, 'forbidden');
  }

  const actorRecord = await User.findByPk(actor.id, { attributes: ['id', 'type', 'email'] });
  if (!actorRecord) {
    throw buildHttpError(403, 'forbidden');
  }

  const include = [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'type'] }];
  const order = [['createdAt', 'ASC']];

  if (actorRecord.type === 'admin') {
    const companyInstance = companyId
      ? await Company.findByPk(companyId, { include })
      : await Company.findOne({ include, order });

    if (!companyInstance) {
      throw buildHttpError(404, 'company_not_found');
    }

    return { company: companyInstance.get({ plain: true }), actor: actorRecord.get({ plain: true }) };
  }

  if (actorRecord.type !== 'company') {
    throw buildHttpError(403, 'forbidden');
  }

  const where = companyId ? { id: companyId, userId: actorRecord.id } : { userId: actorRecord.id };
  const companyInstance = await Company.findOne({ where, include, order });

  if (companyInstance) {
    return { company: companyInstance.get({ plain: true }), actor: actorRecord.get({ plain: true }) };
  }

  if (companyId) {
    const exists = await Company.findByPk(companyId, { attributes: ['id'] });
    if (exists) {
      throw buildHttpError(403, 'forbidden');
    }
  }

  throw buildHttpError(404, 'company_not_found');
}

export async function resolveCompanyId(companyId) {
  if (companyId) {
    const exists = await Company.findByPk(companyId, { attributes: ['id'], raw: true });
    if (exists) {
      return exists.id;
    }
  }

  const firstCompany = await Company.findOne({ attributes: ['id'], order: [['createdAt', 'ASC']], raw: true });
  if (!firstCompany) {
    throw buildHttpError(404, 'company_not_found');
  }
  return firstCompany.id;
}
