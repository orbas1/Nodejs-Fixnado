import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServiceTaxonomyAssignment extends Model {}

ServiceTaxonomyAssignment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    serviceId: {
      field: 'service_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    nodeId: {
      field: 'node_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    weight: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    isPrimary: {
      field: 'is_primary',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ServiceTaxonomyAssignment',
    tableName: 'service_taxonomy_assignments',
    underscored: true
  }
);

export default ServiceTaxonomyAssignment;
