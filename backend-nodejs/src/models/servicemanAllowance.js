import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanAllowance extends Model {}

ServicemanAllowance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    servicemanId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'serviceman_id'
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(8),
      allowNull: false,
      defaultValue: 'GBP'
    },
    cadence: {
      type: DataTypes.ENUM('per_job', 'per_day', 'per_week', 'per_month'),
      allowNull: false,
      defaultValue: 'per_job'
    },
    effectiveFrom: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'effective_from'
    },
    effectiveTo: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'effective_to'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by'
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'updated_by'
    }
  },
  {
    sequelize,
    modelName: 'ServicemanAllowance',
    tableName: 'serviceman_allowances',
    underscored: true
  }
);

export default ServicemanAllowance;
