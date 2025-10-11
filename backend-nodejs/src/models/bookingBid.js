import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class BookingBid extends Model {}

BookingBid.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    providerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined', 'withdrawn'),
      allowNull: false,
      defaultValue: 'pending'
    },
    revisionHistory: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    auditLog: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'BookingBid',
    indexes: [
      { fields: ['booking_id'] },
      {
        unique: true,
        fields: ['booking_id', 'provider_id']
      }
    ]
  }
);

export default BookingBid;
