import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class InventoryItem extends Model {}

InventoryItem.init(
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
    marketplaceItemId: {
      field: 'marketplace_item_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    sku: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    unitType: {
      field: 'unit_type',
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'unit'
    },
    quantityOnHand: {
      field: 'quantity_on_hand',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    quantityReserved: {
      field: 'quantity_reserved',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    safetyStock: {
      field: 'safety_stock',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    locationZoneId: {
      field: 'location_zone_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    categoryId: {
      field: 'category_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    itemType: {
      field: 'item_type',
      type: DataTypes.ENUM('tool', 'material'),
      allowNull: false,
      defaultValue: 'tool'
    },
    fulfilmentType: {
      field: 'fulfilment_type',
      type: DataTypes.ENUM('purchase', 'rental', 'hybrid'),
      allowNull: false,
      defaultValue: 'purchase'
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'inactive', 'retired'),
      allowNull: false,
      defaultValue: 'active'
    },
    tagline: {
      type: DataTypes.STRING(160),
      allowNull: true
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
    purchasePrice: {
      field: 'purchase_price',
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    purchasePriceCurrency: {
      field: 'purchase_price_currency',
      type: DataTypes.STRING(3),
      allowNull: true
    },
    replacementCost: {
      field: 'replacement_cost',
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    insuranceRequired: {
      field: 'insurance_required',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    conditionRating: {
      field: 'condition_rating',
      type: DataTypes.ENUM('new', 'excellent', 'good', 'fair', 'needs_service'),
      allowNull: false,
      defaultValue: 'good'
    },
    primarySupplierId: {
      field: 'primary_supplier_id',
      type: DataTypes.UUID,
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
    modelName: 'InventoryItem',
    tableName: 'InventoryItem'
  }
);

export default InventoryItem;
