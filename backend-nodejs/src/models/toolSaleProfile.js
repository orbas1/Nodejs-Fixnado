import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ToolSaleProfile extends Model {}

ToolSaleProfile.init(
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
    inventoryItemId: {
      field: 'inventory_item_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    marketplaceItemId: {
      field: 'marketplace_item_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    tagline: {
      type: DataTypes.STRING(160)
    },
    shortDescription: {
      field: 'short_description',
      type: DataTypes.STRING(512)
    },
    longDescription: {
      field: 'long_description',
      type: DataTypes.TEXT
    },
    heroImageUrl: {
      field: 'hero_image_url',
      type: DataTypes.STRING(512)
    },
    showcaseVideoUrl: {
      field: 'showcase_video_url',
      type: DataTypes.STRING(512)
    },
    galleryImages: {
      field: 'gallery_images',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    tags: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    keywordTags: {
      field: 'keyword_tags',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ToolSaleProfile',
    tableName: 'ToolSaleProfile',
    underscored: true
  }
);

export default ToolSaleProfile;
