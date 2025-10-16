import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServiceTaxonomyCategory extends Model {}

ServiceTaxonomyCategory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    typeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'type_id'
    },
    slug: {
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
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'display_order'
    },
    defaultTags: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'default_tags'
    },
    searchKeywords: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'search_keywords'
    },
    heroImageUrl: {
      type: DataTypes.STRING(1024),
      allowNull: true,
      field: 'hero_image_url'
    },
    heroImageAlt: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'hero_image_alt'
    },
    iconUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'icon_url'
    },
    previewUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'preview_url'
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_featured'
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
    modelName: 'ServiceTaxonomyCategory',
    tableName: 'service_taxonomy_categories',
    indexes: [
      { unique: true, fields: ['slug'] },
      { fields: ['type_id'] },
      { fields: ['status'] },
      { fields: ['display_order'] }
    ]
  }
);

export default ServiceTaxonomyCategory;
