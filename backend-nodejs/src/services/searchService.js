import { Op } from 'sequelize';
import { Service, MarketplaceItem, User, Company } from '../models/index.js';

export async function searchNetwork(query) {
  const where = query.term
    ? {
        [Op.or]: [
          { title: { [Op.like]: `%${query.term}%` } },
          { description: { [Op.like]: `%${query.term}%` } }
        ]
      }
    : {};

  const services = await Service.findAll({
    where,
    include: [
      { model: Company, attributes: ['id', 'contactName'] },
      { association: Service.associations.provider, attributes: ['firstName', 'lastName'] }
    ],
    limit: query.limit || 20
  });

  const items = await MarketplaceItem.findAll({
    where,
    include: [{ model: Company, attributes: ['id', 'contactName'] }],
    limit: query.limit || 20
  });

  return { services, items };
}

export async function searchProviders(term) {
  const users = await User.findAll({
    where: {
      type: 'servicemen',
      [Op.or]: [
        { firstName: { [Op.like]: `%${term}%` } },
        { lastName: { [Op.like]: `%${term}%` } }
      ]
    },
    limit: 20
  });
  return users;
}
