import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class EnterpriseUpgradeRequest extends Model {}

EnterpriseUpgradeRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      field: 'company_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'submitted', 'in_review', 'approved', 'rejected', 'deferred'),
      allowNull: false,
      defaultValue: 'draft'
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    requestedBy: {
      field: 'requested_by',
      type: DataTypes.UUID,
      allowNull: true
    },
    requestedAt: {
      field: 'requested_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    targetGoLive: {
      field: 'target_go_live',
      type: DataTypes.DATE,
      allowNull: true
    },
    seats: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    contractValue: {
      field: 'contract_value',
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'GBP'
    },
    automationScope: {
      field: 'automation_scope',
      type: DataTypes.TEXT,
      allowNull: true
    },
    enterpriseFeatures: {
      field: 'enterprise_features',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    onboardingManager: {
      field: 'onboarding_manager',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lastDecisionAt: {
      field: 'last_decision_at',
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'EnterpriseUpgradeRequest',
    tableName: 'enterprise_upgrade_requests',
    underscored: true
  }
);

export default EnterpriseUpgradeRequest;
