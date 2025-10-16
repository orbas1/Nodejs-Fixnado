import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanFinancialProfile extends Model {}

ServicemanFinancialProfile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    servicemanId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'serviceman_id'
    },
    currency: {
      type: DataTypes.STRING(8),
      allowNull: false,
      defaultValue: 'GBP'
    },
    baseHourlyRate: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'base_hourly_rate'
    },
    overtimeRate: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'overtime_rate'
    },
    calloutFee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'callout_fee'
    },
    mileageRate: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      field: 'mileage_rate'
    },
    payoutMethod: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'wallet',
      field: 'payout_method'
    },
    payoutSchedule: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'weekly',
      field: 'payout_schedule'
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'tax_rate'
    },
    taxIdentifier: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'tax_identifier'
    },
    payoutInstructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'payout_instructions'
    },
    bankAccount: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      field: 'bank_account'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ServicemanFinancialProfile',
    tableName: 'serviceman_financial_profiles',
    underscored: true
  }
);

export default ServicemanFinancialProfile;
