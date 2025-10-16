import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderStorefrontInventory extends Model {}

ProviderStorefrontInventory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    storefrontId: {
      field: 'storefront_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    sku: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    summary: {
      type: DataTypes.STRING(240)
    },
    description: {
      type: DataTypes.TEXT
    },
    priceAmount: {
      field: 'price_amount',
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    priceCurrency: {
      field: 'price_currency',
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'GBP'
    },
    stockOnHand: {
      field: 'stock_on_hand',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    reorderPoint: {
      field: 'reorder_point',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    restockAt: {
      field: 'restock_at',
      type: DataTypes.DATE
    },
    visibility: {
      type: DataTypes.ENUM('public', 'private', 'archived'),
      allowNull: false,
      defaultValue: 'public'
    },
    featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    imageUrl: {
      field: 'image_url',
      type: DataTypes.STRING(255)
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ProviderStorefrontInventory',
    tableName: 'provider_storefront_inventory',
    indexes: [
      { fields: ['storefront_id'] },
      { fields: ['sku'] }
    ]
  }
);

export default ProviderStorefrontInventory;
