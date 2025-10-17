import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class InventoryItemSupplier extends Model {}

InventoryItemSupplier.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    itemId: {
      field: 'item_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    supplierId: {
      field: 'supplier_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    unitPrice: {
      field: 'unit_price',
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'GBP'
    },
    minimumOrderQuantity: {
      field: 'minimum_order_quantity',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    leadTimeDays: {
      field: 'lead_time_days',
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isPrimary: {
      field: 'is_primary',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    },
    lastQuotedAt: {
      field: 'last_quoted_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'InventoryItemSupplier',
    tableName: 'InventoryItemSupplier',
    indexes: [
      {
        unique: true,
        fields: ['item_id', 'supplier_id']
      }
    ]
  }
);

export default InventoryItemSupplier;
