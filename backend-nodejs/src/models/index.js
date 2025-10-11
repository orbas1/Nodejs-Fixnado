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
import UiPreferenceTelemetry from './uiPreferenceTelemetry.js';
import UiPreferenceTelemetrySnapshot from './uiPreferenceTelemetrySnapshot.js';
import ZoneAnalyticsSnapshot from './zoneAnalyticsSnapshot.js';
import Booking from './booking.js';
import BookingAssignment from './bookingAssignment.js';
import BookingBid from './bookingBid.js';
import BookingBidComment from './bookingBidComment.js';
import InventoryItem from './inventoryItem.js';
import InventoryLedgerEntry from './inventoryLedgerEntry.js';
import InventoryAlert from './inventoryAlert.js';
import RentalAgreement from './rentalAgreement.js';
import RentalCheckpoint from './rentalCheckpoint.js';

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

Company.hasMany(InventoryItem, { foreignKey: 'companyId' });
InventoryItem.belongsTo(Company, { foreignKey: 'companyId' });

InventoryItem.hasMany(InventoryLedgerEntry, { foreignKey: 'itemId' });
InventoryLedgerEntry.belongsTo(InventoryItem, { foreignKey: 'itemId' });

InventoryItem.hasMany(InventoryAlert, { foreignKey: 'itemId' });
InventoryAlert.belongsTo(InventoryItem, { foreignKey: 'itemId' });

InventoryItem.hasMany(RentalAgreement, { foreignKey: 'itemId' });
RentalAgreement.belongsTo(InventoryItem, { foreignKey: 'itemId' });

MarketplaceItem.hasMany(RentalAgreement, { foreignKey: 'marketplaceItemId' });
RentalAgreement.belongsTo(MarketplaceItem, { foreignKey: 'marketplaceItemId' });

Company.hasMany(RentalAgreement, { foreignKey: 'companyId' });
RentalAgreement.belongsTo(Company, { foreignKey: 'companyId' });

User.hasMany(RentalAgreement, { foreignKey: 'renterId', as: 'Rentals' });
RentalAgreement.belongsTo(User, { as: 'renter', foreignKey: 'renterId' });

Booking.hasMany(RentalAgreement, { foreignKey: 'bookingId' });
RentalAgreement.belongsTo(Booking, { foreignKey: 'bookingId' });

RentalAgreement.hasMany(RentalCheckpoint, { foreignKey: 'rentalAgreementId' });
RentalCheckpoint.belongsTo(RentalAgreement, { foreignKey: 'rentalAgreementId' });

Company.hasMany(ServiceZone, { foreignKey: 'companyId' });
ServiceZone.belongsTo(Company, { foreignKey: 'companyId' });

ServiceZone.hasMany(ZoneAnalyticsSnapshot, { foreignKey: 'zoneId' });
ZoneAnalyticsSnapshot.belongsTo(ServiceZone, { foreignKey: 'zoneId' });

ServiceZone.hasMany(Booking, { foreignKey: 'zoneId' });
Booking.belongsTo(ServiceZone, { foreignKey: 'zoneId' });

Company.hasMany(Booking, { foreignKey: 'companyId' });
Booking.belongsTo(Company, { foreignKey: 'companyId' });

User.hasMany(Booking, { foreignKey: 'customerId' });
Booking.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });

Booking.hasMany(BookingAssignment, { foreignKey: 'bookingId' });
BookingAssignment.belongsTo(Booking, { foreignKey: 'bookingId' });

Booking.hasMany(BookingBid, { foreignKey: 'bookingId' });
BookingBid.belongsTo(Booking, { foreignKey: 'bookingId' });

BookingBid.hasMany(BookingBidComment, { foreignKey: 'bidId' });
BookingBidComment.belongsTo(BookingBid, { foreignKey: 'bidId' });

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
  Dispute,
  UiPreferenceTelemetry,
  UiPreferenceTelemetrySnapshot,
  ZoneAnalyticsSnapshot,
  Booking,
  BookingAssignment,
  BookingBid,
  BookingBidComment,
  InventoryItem,
  InventoryLedgerEntry,
  InventoryAlert,
  RentalAgreement,
  RentalCheckpoint
};
