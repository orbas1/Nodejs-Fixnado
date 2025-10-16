import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class InventoryItemTag extends Model {}

InventoryItemTag.init(
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
    tagId: {
      field: 'tag_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    sortOrder: {
      field: 'sort_order',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize,
    modelName: 'InventoryItemTag',
    tableName: 'InventoryItemTag',
    indexes: [
      {
        unique: true,
        fields: ['item_id', 'tag_id']
      }
    ]
  }
);

export default InventoryItemTag;
