import sequelize from '../config/database.js';
import User from './user.js';
import Company from './company.js';
import Service from './service.js';
import Post from './post.js';
import MarketplaceItem from './marketplaceItem.js';
import ServiceZone from './serviceZone.js';
import Order from './order.js';
import Escrow from './escrow.js';
import Dispute from './dispute.js';

User.hasOne(Company, { foreignKey: 'userId' });
Company.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Post, { foreignKey: 'userId' });
Post.belongsTo(User, { foreignKey: 'userId' });

Company.hasMany(Service, { foreignKey: 'companyId' });
Service.belongsTo(Company, { foreignKey: 'companyId' });

User.hasMany(Service, { foreignKey: 'providerId' });
Service.belongsTo(User, { as: 'provider', foreignKey: 'providerId' });

Service.hasMany(Order, { foreignKey: 'serviceId' });
Order.belongsTo(Service, { foreignKey: 'serviceId' });

User.hasMany(Order, { foreignKey: 'buyerId' });
Order.belongsTo(User, { as: 'buyer', foreignKey: 'buyerId' });

Order.hasOne(Escrow, { foreignKey: 'orderId' });
Escrow.belongsTo(Order, { foreignKey: 'orderId' });

Escrow.hasMany(Dispute, { foreignKey: 'escrowId' });
Dispute.belongsTo(Escrow, { foreignKey: 'escrowId' });

Company.hasMany(MarketplaceItem, { foreignKey: 'companyId' });
MarketplaceItem.belongsTo(Company, { foreignKey: 'companyId' });

Company.hasMany(ServiceZone, { foreignKey: 'companyId' });
ServiceZone.belongsTo(Company, { foreignKey: 'companyId' });

export {
  sequelize,
  User,
  Company,
  Service,
  Post,
  MarketplaceItem,
  ServiceZone,
  Order,
  Escrow,
  Dispute
};
