import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import Company from './company.js';
import ProviderContact from './providerContact.js';
import Booking from './booking.js';
import ServicemanCommissionRule from './servicemanCommissionRule.js';

export const SERVICEMAN_PAYMENT_STATUSES = Object.freeze([
  'scheduled',
  'pending',
  'approved',
  'paid',
  'failed',
  'cancelled'
]);

class ServicemanPayment extends Model {}

ServicemanPayment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      field: 'company_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    servicemanId: {
      field: 'serviceman_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    servicemanName: {
      field: 'serviceman_name',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    servicemanRole: {
      field: 'serviceman_role',
      type: DataTypes.STRING(120),
      allowNull: true
    },
    servicemanSnapshot: {
      field: 'serviceman_snapshot',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    bookingId: {
      field: 'booking_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    bookingReference: {
      field: 'booking_reference',
      type: DataTypes.STRING(120),
      allowNull: true
    },
    bookingServiceName: {
      field: 'booking_service_name',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    bookingSnapshot: {
      field: 'booking_snapshot',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    commissionRuleId: {
      field: 'commission_rule_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'GBP'
    },
    status: {
      type: DataTypes.ENUM(...SERVICEMAN_PAYMENT_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    commissionRate: {
      field: 'commission_rate',
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true
    },
    commissionAmount: {
      field: 'commission_amount',
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    dueDate: {
      field: 'due_date',
      type: DataTypes.DATE,
      allowNull: true
    },
    paidAt: {
      field: 'paid_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    createdBy: {
      field: 'created_by',
      type: DataTypes.UUID,
      allowNull: true
    },
    updatedBy: {
      field: 'updated_by',
      type: DataTypes.UUID,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'ServicemanPayment',
    tableName: 'serviceman_payments',
    underscored: true,
    indexes: [
      { fields: ['company_id'] },
      { fields: ['serviceman_id'] },
      { fields: ['booking_id'] },
      { fields: ['status'] },
      { fields: ['due_date'] }
    ]
  }
);

Company.hasMany(ServicemanPayment, { foreignKey: 'companyId', as: 'servicemanPayments' });
ServicemanPayment.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

ProviderContact.hasMany(ServicemanPayment, { foreignKey: 'servicemanId', as: 'payments' });
ServicemanPayment.belongsTo(ProviderContact, { foreignKey: 'servicemanId', as: 'serviceman' });

Booking.hasMany(ServicemanPayment, { foreignKey: 'bookingId', as: 'servicemanPayments' });
ServicemanPayment.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

ServicemanPayment.belongsTo(ServicemanCommissionRule, {
  foreignKey: 'commissionRuleId',
  as: 'commissionRule'
});
ServicemanCommissionRule.hasMany(ServicemanPayment, {
  foreignKey: 'commissionRuleId',
  as: 'payments'
});

export default ServicemanPayment;
