import { Op } from 'sequelize';
import {
  Service,
  MarketplaceItem,
  Company,
  ServiceZone,
  ProviderProfile,
  ProviderServiceman
} from '../models/index.js';
import { categoriesForType, describeCategory, enrichServiceMetadata } from '../constants/serviceCatalog.js';

async function buildServiceWhereClause(query) {
  const whereClauses = [];

  if (query.term) {
    whereClauses.push({
      [Op.or]: [
        { title: { [Op.like]: `%${query.term}%` } },
        { description: { [Op.like]: `%${query.term}%` } }
      ]
    });
  }

  if (query.category && query.category !== 'all') {
    const descriptor = describeCategory(query.category);
    whereClauses.push({ category: descriptor.slug });
  }

  if (query.serviceType && query.serviceType !== 'all') {
    const categorySlugs = categoriesForType(query.serviceType);
    if (categorySlugs.length > 0) {
      whereClauses.push({ category: { [Op.in]: categorySlugs } });
    }
  }

  if (whereClauses.length === 0) {
    return {};
  }

  if (whereClauses.length === 1) {
    return whereClauses[0];
  }

  return { [Op.and]: whereClauses };
}

export async function searchNetwork(query) {
  const serviceWhere = await buildServiceWhereClause(query);

  let zoneCompanyId = null;
  if (query.zoneId && query.zoneId !== 'all') {
    const zone = await ServiceZone.findByPk(query.zoneId, { attributes: ['companyId'] });
    if (zone) {
      zoneCompanyId = zone.companyId;
      serviceWhere.companyId = zoneCompanyId;
    }
  }

  const services = await Service.findAll({
    where: serviceWhere,
    include: [
      {
        model: Company,
        attributes: ['id', 'contactName'],
        include: [{ model: ProviderProfile, as: 'profile', attributes: ['storefrontSlug', 'displayName', 'tier'] }]
      },
      { association: Service.associations.provider, attributes: ['firstName', 'lastName'] }
    ],
    limit: query.limit || 20
  });

  const itemsWhereClauses = [];
  if (query.term) {
    itemsWhereClauses.push({
      [Op.or]: [
        { title: { [Op.like]: `%${query.term}%` } },
        { description: { [Op.like]: `%${query.term}%` } }
      ]
    });
  }

  if (zoneCompanyId) {
    itemsWhereClauses.push({ companyId: zoneCompanyId });
  }

  const itemsWhere =
    itemsWhereClauses.length === 0
      ? {}
      : itemsWhereClauses.length === 1
        ? itemsWhereClauses[0]
        : { [Op.and]: itemsWhereClauses };

  const items = await MarketplaceItem.findAll({
    where: itemsWhere,
    include: [{ model: Company, attributes: ['id', 'contactName'] }],
    limit: query.limit || 20
  });

  const hydratedServices = services.map((service) => {
    const payload = service.get({ plain: true });
    const enriched = enrichServiceMetadata(payload);
    return {
      ...payload,
      type: enriched.type,
      category: enriched.category,
      categorySlug: enriched.categorySlug,
      tags: enriched.tags
    };
  });

  const hydratedItems = items.map((item) => item.get({ plain: true }));

  return { services: hydratedServices, items: hydratedItems };
}

function buildFuzzyTerm(term) {
  if (!term) {
    return '%';
  }

  const escaped = term.replace(/[\\%_]/g, (match) => `\\${match}`);
  return `%${escaped}%`;
}

export async function searchProviders(term = '') {
  const trimmed = term.trim();
  const whereClause = { status: 'active' };

  if (trimmed) {
    const likeTerm = buildFuzzyTerm(trimmed);
    whereClause[Op.or] = [
      { name: { [Op.iLike]: likeTerm } },
      { role: { [Op.iLike]: likeTerm } },
      { email: { [Op.iLike]: likeTerm } },
      { phone: { [Op.iLike]: likeTerm } }
    ];
  }

  const servicemen = await ProviderServiceman.findAll({
    where: whereClause,
    include: [
      {
        model: Company,
        as: 'company',
        attributes: ['id', 'contactName'],
        include: [
          { model: ProviderProfile, as: 'profile', attributes: ['storefrontSlug', 'displayName'] }
        ]
      }
    ],
    order: [
      ['availabilityStatus', 'ASC'],
      ['name', 'ASC']
    ],
    limit: 20
  });

  return servicemen.map((member) => {
    const payload = member.get({ plain: true });
    const companyProfile = payload.company?.profile ?? null;

    return {
      id: payload.id,
      name: payload.name,
      role: payload.role,
      email: payload.email,
      phone: payload.phone,
      availabilityStatus: payload.availabilityStatus,
      availabilityPercentage: payload.availabilityPercentage,
      skills: Array.isArray(payload.skills) ? payload.skills : [],
      company: payload.company
        ? {
            id: payload.company.id,
            name: companyProfile?.displayName || payload.company.contactName || null,
            slug: companyProfile?.storefrontSlug || null
          }
        : null
    };
  });
}
