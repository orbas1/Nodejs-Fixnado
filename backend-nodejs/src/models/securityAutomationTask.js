import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class SecurityAutomationTask extends Model {}

SecurityAutomationTask.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('planned', 'in_progress', 'blocked', 'completed'),
      allowNull: false,
      defaultValue: 'planned'
    },
    owner: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium'
    },
    dueAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_at'
    },
    runbookUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'runbook_url'
    },
    signalKey: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'signal_key'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
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
    modelName: 'SecurityAutomationTask',
    tableName: 'SecurityAutomationTask',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default SecurityAutomationTask;
