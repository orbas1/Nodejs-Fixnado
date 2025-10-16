import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Service extends Model {}

Service.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    providerId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    category: DataTypes.STRING,
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'paused', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    visibility: {
      type: DataTypes.ENUM('private', 'restricted', 'public'),
      allowNull: false,
      defaultValue: 'restricted'
    },
    kind: {
      type: DataTypes.ENUM('standard', 'package'),
      allowNull: false,
      defaultValue: 'standard'
    },
    price: DataTypes.DECIMAL,
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    heroImageUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    gallery: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    coverage: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'Service',
    tableName: 'Service'
  }
);

export default Service;
