import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class OperationsQueueBoard extends Model {}

OperationsQueueBoard.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    slug: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true
    },
    title: {
      type: DataTypes.STRING(140),
      allowNull: false
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    owner: {
      type: DataTypes.STRING(140),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('operational', 'attention', 'delayed', 'blocked'),
      allowNull: false,
      defaultValue: 'operational'
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
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
    archivedAt: {
      field: 'archived_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    isArchived: {
      field: 'is_archived',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'OperationsQueueBoard',
    tableName: 'OperationsQueueBoard',
    defaultScope: {
      where: { isArchived: false }
    },
    scopes: {
      all: {
        where: {}
      }
    }
  }
);

export default OperationsQueueBoard;
