import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServiceCategory extends Model {}

ServiceCategory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true
    },
    accentColour: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'accent_colour'
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'parent_id'
    },
    ordering: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ServiceCategory',
    tableName: 'service_categories'
  }
);

export default ServiceCategory;
