import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderCoverage extends Model {}

ProviderCoverage.init(
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
    zoneId: {
      field: 'zone_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    coverageType: {
      field: 'coverage_type',
      type: DataTypes.ENUM('primary', 'secondary', 'standby'),
      allowNull: false,
      defaultValue: 'primary'
    },
    slaMinutes: {
      field: 'sla_minutes',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 240
    },
    maxCapacity: {
      field: 'max_capacity',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
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
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ProviderCoverage',
    tableName: 'ProviderCoverage',
    indexes: [
      {
        unique: true,
        fields: ['company_id', 'zone_id']
      },
      {
        fields: ['coverage_type']
      }
    ]
  }
);

export default ProviderCoverage;
