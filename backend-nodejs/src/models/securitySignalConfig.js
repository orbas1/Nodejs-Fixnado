import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class SecuritySignalConfig extends Model {}

SecuritySignalConfig.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    metricKey: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      field: 'metric_key'
    },
    displayName: {
      type: DataTypes.STRING(128),
      allowNull: false,
      field: 'display_name'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    unit: {
      type: DataTypes.STRING(24),
      allowNull: true
    },
    valueSource: {
      type: DataTypes.ENUM('computed', 'manual'),
      allowNull: false,
      defaultValue: 'computed',
      field: 'value_source'
    },
    targetSuccess: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      field: 'target_success'
    },
    targetWarning: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      field: 'target_warning'
    },
    lowerIsBetter: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'lower_is_better'
    },
    runbookUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'runbook_url'
    },
    ownerRole: {
      type: DataTypes.STRING(96),
      allowNull: true,
      field: 'owner_role'
    },
    icon: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    manualValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'manual_value'
    },
    manualValueLabel: {
      type: DataTypes.STRING(128),
      allowNull: true,
      field: 'manual_value_label'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order'
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
    modelName: 'SecuritySignalConfig',
    tableName: 'SecuritySignalConfig',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default SecuritySignalConfig;
