import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

function resolveGeometryType() {
  const dialect = sequelize.getDialect();
  if (dialect === 'postgres') {
    return DataTypes.GEOMETRY('MULTIPOLYGON', 4326);
  }

  return DataTypes.JSON;
}

function resolvePointType() {
  const dialect = sequelize.getDialect();
  if (dialect === 'postgres') {
    return DataTypes.GEOMETRY('POINT', 4326);
  }

  return DataTypes.JSON;
}

class ServiceZone extends Model {}

ServiceZone.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    boundary: {
      type: resolveGeometryType(),
      allowNull: false
    },
    centroid: {
      type: resolvePointType(),
      allowNull: false
    },
    boundingBox: {
      type: DataTypes.JSON,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    demandLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium'
    }
  },
  {
    sequelize,
    modelName: 'ServiceZone',
    indexes: [
      {
        fields: ['company_id']
      },
      {
        fields: ['demand_level']
      }
    ]
  }
);

export default ServiceZone;
