import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class BookingHistoryEntry extends Model {}

BookingHistoryEntry.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'booking_id'
    },
    title: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    entryType: {
      type: DataTypes.ENUM('note', 'status_update', 'milestone', 'handoff', 'document'),
      allowNull: false,
      defaultValue: 'note',
      field: 'entry_type'
    },
    status: {
      type: DataTypes.ENUM('open', 'in_progress', 'blocked', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'open'
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'actor_id'
    },
    actorRole: {
      type: DataTypes.ENUM('customer', 'provider', 'operations', 'support', 'finance', 'system'),
      allowNull: false,
      defaultValue: 'customer',
      field: 'actor_role'
    },
    occurredAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'occurred_at'
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    meta: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'BookingHistoryEntry',
    tableName: 'BookingHistoryEntry',
    underscored: true
  }
);

export default BookingHistoryEntry;
