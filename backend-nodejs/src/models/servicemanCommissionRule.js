import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import Company from './company.js';

export const SERVICEMAN_COMMISSION_RATE_TYPES = Object.freeze(['percentage', 'flat', 'hybrid']);
export const SERVICEMAN_COMMISSION_APPROVAL_STATUSES = Object.freeze([
  'draft',
  'pending_approval',
  'approved',
  'archived'
]);

class ServicemanCommissionRule extends Model {}

ServicemanCommissionRule.init(
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
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    appliesToRole: {
      field: 'applies_to_role',
      type: DataTypes.STRING(120),
      allowNull: true
    },
    serviceCategory: {
      field: 'service_category',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    rateType: {
      field: 'rate_type',
      type: DataTypes.ENUM(...SERVICEMAN_COMMISSION_RATE_TYPES),
      allowNull: false,
      defaultValue: 'percentage'
    },
    rateValue: {
      field: 'rate_value',
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 0
    },
    minimumBookingValue: {
      field: 'minimum_booking_value',
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    maximumCommissionValue: {
      field: 'maximum_commission_value',
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    autoApply: {
      field: 'auto_apply',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isDefault: {
      field: 'is_default',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    approvalStatus: {
      field: 'approval_status',
      type: DataTypes.ENUM(...SERVICEMAN_COMMISSION_APPROVAL_STATUSES),
      allowNull: false,
      defaultValue: 'draft'
    },
    effectiveFrom: {
      field: 'effective_from',
      type: DataTypes.DATE,
      allowNull: true
    },
    effectiveTo: {
      field: 'effective_to',
      type: DataTypes.DATE,
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
    },
    archivedAt: {
      field: 'archived_at',
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'ServicemanCommissionRule',
    tableName: 'serviceman_commission_rules',
    underscored: true,
    indexes: [
      { fields: ['company_id'] },
      { fields: ['approval_status'] },
      { fields: ['is_default'] }
    ]
  }
);

Company.hasMany(ServicemanCommissionRule, { foreignKey: 'companyId', as: 'servicemanCommissionRules' });
ServicemanCommissionRule.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

export default ServicemanCommissionRule;
