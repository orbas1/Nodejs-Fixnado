import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class OrderNote extends Model {}

OrderNote.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'order_id'
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'author_id'
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    }
  },
  {
    sequelize,
    modelName: 'OrderNote',
    tableName: 'OrderNote',
    indexes: [
      { fields: ['order_id'] },
      { fields: ['author_id'] }
    ]
  }
);

export default OrderNote;
