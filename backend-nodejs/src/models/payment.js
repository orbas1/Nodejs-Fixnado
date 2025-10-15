import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Payment extends Model {}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      field: 'order_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    buyerId: {
      field: 'buyer_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    providerId: {
      field: 'provider_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    serviceId: {
      field: 'service_id',
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
      type: DataTypes.ENUM('pending', 'authorised', 'captured', 'refunded', 'cancelled', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    gatewayReference: {
      field: 'gateway_reference',
      type: DataTypes.STRING(128),
      allowNull: true
    },
    fingerprint: {
      type: DataTypes.STRING(128),
      allowNull: true,
      unique: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    capturedAt: {
      field: 'captured_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    refundedAt: {
      field: 'refunded_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    regionId: {
      field: 'region_id',
      type: DataTypes.UUID,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    underscored: true
  }
);

export default Payment;
