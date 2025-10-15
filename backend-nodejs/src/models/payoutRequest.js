import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class PayoutRequest extends Model {}

PayoutRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    providerId: {
      field: 'provider_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    paymentId: {
      field: 'payment_id',
      type: DataTypes.UUID,
      allowNull: true
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
      type: DataTypes.ENUM('pending', 'approved', 'processing', 'paid', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    scheduledFor: {
      field: 'scheduled_for',
      type: DataTypes.DATE,
      allowNull: true
    },
    processedAt: {
      field: 'processed_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    failureReason: {
      field: 'failure_reason',
      type: DataTypes.STRING(256),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    regionId: {
      field: 'region_id',
      type: DataTypes.UUID,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'PayoutRequest',
    tableName: 'payout_requests',
    underscored: true
  }
);

export default PayoutRequest;
