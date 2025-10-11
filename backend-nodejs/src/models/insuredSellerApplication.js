import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class InsuredSellerApplication extends Model {}

InsuredSellerApplication.init(
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
      type: DataTypes.ENUM('not_started', 'pending_documents', 'in_review', 'approved', 'suspended'),
      allowNull: false,
      defaultValue: 'pending_documents'
    },
    requiredDocuments: {
      field: 'required_documents',
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    complianceScore: {
      field: 'compliance_score',
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0
    },
    submittedAt: {
      field: 'submitted_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    approvedAt: {
      field: 'approved_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    expiresAt: {
      field: 'expires_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    lastEvaluatedAt: {
      field: 'last_evaluated_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    badgeEnabled: {
      field: 'badge_enabled',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    reviewerId: {
      field: 'reviewer_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'InsuredSellerApplication',
    tableName: 'InsuredSellerApplication'
  }
);

export default InsuredSellerApplication;
