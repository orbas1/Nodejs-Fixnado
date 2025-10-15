import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class FinanceWebhookEvent extends Model {}

FinanceWebhookEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    provider: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    eventType: {
      field: 'event_type',
      type: DataTypes.STRING(64),
      allowNull: false
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('queued', 'processing', 'succeeded', 'failed', 'discarded'),
      allowNull: false,
      defaultValue: 'queued'
    },
    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    lastError: {
      field: 'last_error',
      type: DataTypes.TEXT,
      allowNull: true
    },
    nextRetryAt: {
      field: 'next_retry_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    orderId: {
      field: 'order_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    paymentId: {
      field: 'payment_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    escrowId: {
      field: 'escrow_id',
      type: DataTypes.UUID,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'FinanceWebhookEvent',
    tableName: 'finance_webhook_events',
    underscored: true
  }
);

export default FinanceWebhookEvent;
