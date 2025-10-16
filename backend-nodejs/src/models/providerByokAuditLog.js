import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

function normaliseEventDetail(value) {
  if (!value) {
    return {};
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
}

class ProviderByokAuditLog extends Model {}

ProviderByokAuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    integrationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'integration_id'
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'company_id'
    },
    eventType: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'event_type',
      set(value) {
        if (typeof value !== 'string' || !value.trim()) {
          throw new TypeError('eventType must be a non-empty string');
        }
        this.setDataValue('eventType', value.trim().toLowerCase());
      }
    },
    eventDetail: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'event_detail',
      defaultValue: {},
      set(value) {
        this.setDataValue('eventDetail', normaliseEventDetail(value));
      }
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'actor_id'
    },
    actorType: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'actor_type',
      set(value) {
        if (value == null) {
          this.setDataValue('actorType', null);
          return;
        }
        if (typeof value !== 'string') {
          throw new TypeError('actorType must be a string when provided');
        }
        this.setDataValue('actorType', value.trim().toLowerCase());
      }
    }
  },
  {
    sequelize,
    modelName: 'ProviderByokAuditLog',
    tableName: 'provider_byok_audit_logs',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false
  }
);

export default ProviderByokAuditLog;
