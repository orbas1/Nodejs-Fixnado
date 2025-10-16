import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderCalendarEvent extends Model {}

ProviderCalendarEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'company_id'
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'booking_id'
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    startAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_at'
    },
    endAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_at'
    },
    status: {
      type: DataTypes.ENUM('planned', 'confirmed', 'cancelled', 'tentative', 'standby', 'travel'),
      allowNull: false,
      defaultValue: 'planned'
    },
    eventType: {
      type: DataTypes.ENUM('internal', 'hold', 'travel', 'maintenance', 'booking'),
      allowNull: false,
      defaultValue: 'internal',
      field: 'event_type'
    },
    visibility: {
      type: DataTypes.ENUM('internal', 'crew', 'public'),
      allowNull: false,
      defaultValue: 'internal'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by'
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'updated_by'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ProviderCalendarEvent',
    tableName: 'provider_calendar_events',
    underscored: true,
    indexes: [
      { fields: ['company_id', 'start_at'] },
      { fields: ['booking_id'] }
    ]
  }
);

export default ProviderCalendarEvent;
