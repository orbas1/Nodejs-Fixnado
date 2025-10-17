import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ToolRentalAsset extends Model {}

ToolRentalAsset.init(
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
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rentalRate: {
      field: 'rental_rate',
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    rentalRateCurrency: {
      field: 'rental_rate_currency',
      type: DataTypes.STRING(3),
      allowNull: true
    },
    depositAmount: {
      field: 'deposit_amount',
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    depositCurrency: {
      field: 'deposit_currency',
      type: DataTypes.STRING(3),
      allowNull: true
    },
    minHireDays: {
      field: 'min_hire_days',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    maxHireDays: {
      field: 'max_hire_days',
      type: DataTypes.INTEGER,
      allowNull: true
    },
    quantityAvailable: {
      field: 'quantity_available',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    availabilityStatus: {
      field: 'availability_status',
      type: DataTypes.ENUM('available', 'low_stock', 'maintenance', 'unavailable'),
      allowNull: false,
      defaultValue: 'available'
    },
    seoTitle: {
      field: 'seo_title',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    seoDescription: {
      field: 'seo_description',
      type: DataTypes.STRING(300),
      allowNull: true
    },
    keywordTags: {
      field: 'keyword_tags',
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    heroImageUrl: {
      field: 'hero_image_url',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    gallery: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    showcaseVideoUrl: {
      field: 'showcase_video_url',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ToolRentalAsset',
    tableName: 'tool_rental_assets',
    indexes: [
      {
        name: 'tool_rental_assets_company_slug_unique',
        unique: true,
        fields: ['company_id', 'slug']
      },
      {
        name: 'tool_rental_assets_company_name',
        fields: ['company_id', 'name']
      }
    ]
  }
);

export default ToolRentalAsset;
