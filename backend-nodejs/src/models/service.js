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
    shortDescription: {
      type: DataTypes.STRING(280),
      allowNull: true,
      field: 'short_description'
    },
    tagline: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
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
    pricingModel: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'pricing_model'
    },
    pricingUnit: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'pricing_unit'
    },
    crewSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'crew_size'
    },
    displayUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'display_url'
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
    showcaseVideoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'showcase_video_url'
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
    keywordTags: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: 'keyword_tags'
    },
    seoTitle: {
      type: DataTypes.STRING(180),
      allowNull: true,
      field: 'seo_title'
    },
    seoDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'seo_description'
    },
    seoKeywords: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: 'seo_keywords'
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
