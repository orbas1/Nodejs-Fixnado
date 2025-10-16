import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

const TASK_STATUS = ['open', 'in_progress', 'waiting_external', 'resolved', 'dismissed'];
const TASK_PRIORITY = ['low', 'medium', 'high', 'critical'];
const TASK_CHANNEL = ['concierge', 'email', 'phone', 'slack', 'self_service'];

class AccountSupportTask extends Model {}

AccountSupportTask.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    companyId: {
      field: 'company_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    userId: {
      field: 'user_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(...TASK_STATUS),
      allowNull: false,
      defaultValue: 'open'
    },
    priority: {
      type: DataTypes.ENUM(...TASK_PRIORITY),
      allowNull: false,
      defaultValue: 'medium'
    },
    channel: {
      type: DataTypes.ENUM(...TASK_CHANNEL),
      allowNull: false,
      defaultValue: 'concierge'
    },
    dueAt: {
      field: 'due_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    assignedTo: {
      field: 'assigned_to',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    assignedToRole: {
      field: 'assigned_to_role',
      type: DataTypes.STRING(80),
      allowNull: true
    },
    createdBy: {
      field: 'created_by',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    createdByRole: {
      field: 'created_by_role',
      type: DataTypes.STRING(80),
      allowNull: true
    },
    updatedBy: {
      field: 'updated_by',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    resolvedAt: {
      field: 'resolved_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    conversationId: {
      field: 'conversation_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'AccountSupportTask',
    tableName: 'AccountSupportTask'
  }
);

export default AccountSupportTask;
