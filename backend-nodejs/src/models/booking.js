import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Booking extends Model {}

Booking.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    zoneId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(
        'draft',
        'pending',
        'awaiting_assignment',
        'scheduled',
        'in_progress',
        'completed',
        'cancelled',
        'disputed'
      ),
      allowNull: false,
      defaultValue: 'pending'
    },
    type: {
      type: DataTypes.ENUM('on_demand', 'scheduled'),
      allowNull: false
    },
    scheduledStart: {
      type: DataTypes.DATE,
      allowNull: true
    },
    scheduledEnd: {
      type: DataTypes.DATE,
      allowNull: true
    },
    slaExpiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    baseAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    commissionAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    taxAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    meta: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: () => ({})
    },
    lastStatusTransitionAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'Booking',
    indexes: [
      { fields: ['zone_id', 'status'] },
      { fields: ['customer_id'] }
    ]
  }
);

export default Booking;
