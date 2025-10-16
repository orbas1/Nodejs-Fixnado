import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

export const AUDIT_EVENT_CATEGORIES = [
  'pipeline',
  'compliance',
  'dispute',
  'security',
  'governance',
  'product',
  'other'
];

export const AUDIT_EVENT_STATUSES = [
  'scheduled',
  'in_progress',
  'completed',
  'blocked',
  'cancelled'
];

class AdminAuditEvent extends Model {}

AdminAuditEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM(...AUDIT_EVENT_CATEGORIES),
      allowNull: false,
      defaultValue: 'other'
    },
    status: {
      type: DataTypes.ENUM(...AUDIT_EVENT_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    ownerName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: 'owner_name'
    },
    ownerTeam: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'owner_team'
    },
    occurredAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'occurred_at'
    },
    dueAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_at'
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
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
    }
  },
  {
    sequelize,
    modelName: 'AdminAuditEvent',
    tableName: 'admin_audit_events',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default AdminAuditEvent;
