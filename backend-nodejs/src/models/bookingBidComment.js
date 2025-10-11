import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class BookingBidComment extends Model {}

BookingBidComment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bidId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    authorType: {
      type: DataTypes.ENUM('customer', 'provider', 'admin'),
      allowNull: false
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'BookingBidComment',
    indexes: [
      { fields: ['bid_id'] }
    ]
  }
);

export default BookingBidComment;
