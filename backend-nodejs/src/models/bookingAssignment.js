import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class BookingAssignment extends Model {}

BookingAssignment.init(
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
    role: {
      type: DataTypes.ENUM('lead', 'support'),
      allowNull: false,
      defaultValue: 'support'
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined', 'withdrawn'),
      allowNull: false,
      defaultValue: 'pending'
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    acknowledgedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'BookingAssignment',
    indexes: [
      {
        unique: true,
        fields: ['booking_id', 'provider_id']
      }
    ]
  }
);

export default BookingAssignment;
