import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServiceTaxonomyType extends Model {}

ServiceTaxonomyType.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(180),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'active'
    },
    accentColor: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'accent_color'
    },
    icon: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'display_order'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
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
    },
    archivedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'archived_at'
    }
  },
  {
    sequelize,
    modelName: 'ServiceTaxonomyType',
    tableName: 'service_taxonomy_types',
    indexes: [
      { unique: true, fields: ['key'] },
      { fields: ['status'] },
      { fields: ['display_order'] }
    ]
  }
);

export default ServiceTaxonomyType;
