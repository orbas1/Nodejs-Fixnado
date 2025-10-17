import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class InventoryItemMedia extends Model {}

InventoryItemMedia.init(
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
    url: {
      type: DataTypes.STRING(512),
      allowNull: false
    },
    altText: {
      field: 'alt_text',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    caption: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    sortOrder: {
      field: 'sort_order',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'InventoryItemMedia',
    tableName: 'InventoryItemMedia'
  }
);

export default InventoryItemMedia;
