import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class WebsitePage extends Model {}

WebsitePage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'draft'
    },
    layout: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'default'
    },
    visibility: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'public'
    },
    heroHeadline: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    heroSubheading: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    heroImageUrl: {
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    heroCtaLabel: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    heroCtaUrl: {
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    featureImageUrl: {
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    seoTitle: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    seoDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    allowedRoles: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    previewPath: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    createdBy: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    updatedBy: {
      type: DataTypes.STRING(120),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'WebsitePage'
  }
);

export default WebsitePage;
