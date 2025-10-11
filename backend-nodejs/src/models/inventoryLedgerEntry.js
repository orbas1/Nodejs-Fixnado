import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class InventoryLedgerEntry extends Model {}

InventoryLedgerEntry.init(
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
    type: {
      type: DataTypes.ENUM(
        'adjustment',
        'reservation',
        'reservation_release',
        'checkout',
        'return',
        'write_off',
        'restock'
      ),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    balanceAfter: {
      field: 'balance_after',
      type: DataTypes.INTEGER,
      allowNull: false
    },
    referenceId: {
      field: 'reference_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    referenceType: {
      field: 'reference_type',
      type: DataTypes.STRING(64),
      allowNull: true
    },
    source: {
      type: DataTypes.ENUM('system', 'provider', 'automation'),
      allowNull: false,
      defaultValue: 'system'
    },
    note: {
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
    modelName: 'InventoryLedgerEntry',
    tableName: 'InventoryLedgerEntry'
  }
);

export default InventoryLedgerEntry;
