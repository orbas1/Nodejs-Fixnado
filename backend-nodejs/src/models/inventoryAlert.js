import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class InventoryAlert extends Model {}

InventoryAlert.init(
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
      type: DataTypes.ENUM('low_stock', 'overdue_return', 'damage_reported', 'manual'),
      allowNull: false
    },
    severity: {
      type: DataTypes.ENUM('info', 'warning', 'critical'),
      allowNull: false,
      defaultValue: 'warning'
    },
    status: {
      type: DataTypes.ENUM('active', 'acknowledged', 'resolved'),
      allowNull: false,
      defaultValue: 'active'
    },
    triggeredAt: {
      field: 'triggered_at',
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    resolvedAt: {
      field: 'resolved_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    resolutionNote: {
      field: 'resolution_note',
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
    modelName: 'InventoryAlert',
    tableName: 'InventoryAlert'
  }
);

export default InventoryAlert;
