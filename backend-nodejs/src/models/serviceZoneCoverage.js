import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

function resolveJsonType() {
  const dialect = sequelize.getDialect();
  if (dialect === 'postgres') {
    return DataTypes.JSONB;
  }

  return DataTypes.JSON;
}

class ServiceZoneCoverage extends Model {}

ServiceZoneCoverage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    zoneId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'ServiceZone',
        key: 'id'
      }
    },
    serviceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Service',
        key: 'id'
      }
    },
    coverageType: {
      type: DataTypes.ENUM('primary', 'secondary', 'supplementary'),
      allowNull: false,
      defaultValue: 'primary'
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    effectiveFrom: {
      type: DataTypes.DATE,
      allowNull: true
    },
    effectiveTo: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: resolveJsonType(),
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ServiceZoneCoverage',
    tableName: 'ServiceZoneCoverage',
    indexes: [
      {
        unique: true,
        fields: ['zone_id', 'service_id']
      },
      {
        fields: ['zone_id', 'priority']
      }
    ]
  }
);

export default ServiceZoneCoverage;
