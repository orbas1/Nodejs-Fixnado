import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

const TASK_STATUS = ['open', 'in_progress', 'waiting_external', 'resolved', 'dismissed'];

class AccountSupportTaskUpdate extends Model {}

AccountSupportTaskUpdate.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    taskId: {
      field: 'task_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(...TASK_STATUS),
      allowNull: true
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
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
    }
  },
  {
    sequelize,
    modelName: 'AccountSupportTaskUpdate',
    tableName: 'AccountSupportTaskUpdate'
  }
);

export default AccountSupportTaskUpdate;
