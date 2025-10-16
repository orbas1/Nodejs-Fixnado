import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class OperationsQueueUpdate extends Model {}

OperationsQueueUpdate.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    boardId: {
      field: 'board_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    headline: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tone: {
      type: DataTypes.ENUM('info', 'success', 'warning', 'danger'),
      allowNull: false,
      defaultValue: 'info'
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    recordedAt: {
      field: 'recorded_at',
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    createdBy: {
      field: 'created_by',
      type: DataTypes.UUID,
      allowNull: true
    },
    updatedBy: {
      field: 'updated_by',
      type: DataTypes.UUID,
      allowNull: true
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    isDeleted: {
      field: 'is_deleted',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'OperationsQueueUpdate',
    tableName: 'OperationsQueueUpdate',
    defaultScope: {
      where: { isDeleted: false }
    }
  }
);

export default OperationsQueueUpdate;
