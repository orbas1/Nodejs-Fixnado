import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class AutomationInitiative extends Model {}

AutomationInitiative.init(
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
    summary: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'ideation'
    },
    stage: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'backlog'
    },
    category: {
      type: DataTypes.STRING(48),
      allowNull: true
    },
    automationType: {
      field: 'automation_type',
      type: DataTypes.STRING(48),
      allowNull: true
    },
    owner: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    sponsor: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    squad: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    readinessScore: {
      field: 'readiness_score',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    priority: {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: 'next'
    },
    riskLevel: {
      field: 'risk_level',
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: 'medium'
    },
    targetMetric: {
      field: 'target_metric',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    baselineMetric: {
      field: 'baseline_metric',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    forecastMetric: {
      field: 'forecast_metric',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    estimatedSavings: {
      field: 'estimated_savings',
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    savingsCurrency: {
      field: 'savings_currency',
      type: DataTypes.STRING(3),
      allowNull: true
    },
    expectedLaunchAt: {
      field: 'expected_launch_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    nextMilestoneOn: {
      field: 'next_milestone_on',
      type: DataTypes.DATE,
      allowNull: true
    },
    lastReviewedAt: {
      field: 'last_reviewed_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    allowedRoles: {
      field: 'allowed_roles',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    dependencies: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    blockers: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    images: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
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
    archivedBy: {
      field: 'archived_by',
      type: DataTypes.UUID,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'AutomationInitiative',
    tableName: 'AutomationInitiative'
  }
);

export default AutomationInitiative;
