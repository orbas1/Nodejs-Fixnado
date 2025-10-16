import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ComplianceControl extends Model {}

ComplianceControl.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      field: 'company_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    ownerId: {
      field: 'owner_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    ownerTeam: {
      field: 'owner_team',
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: 'Compliance Ops'
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('policy', 'procedure', 'technical', 'vendor', 'training', 'other'),
      allowNull: false,
      defaultValue: 'policy'
    },
    controlType: {
      field: 'control_type',
      type: DataTypes.ENUM('preventative', 'detective', 'corrective', 'compensating'),
      allowNull: false,
      defaultValue: 'preventative'
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'monitoring', 'overdue', 'retired'),
      allowNull: false,
      defaultValue: 'active'
    },
    reviewFrequency: {
      field: 'review_frequency',
      type: DataTypes.ENUM('monthly', 'quarterly', 'semiannual', 'annual', 'event_driven'),
      allowNull: false,
      defaultValue: 'annual'
    },
    nextReviewAt: {
      field: 'next_review_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    lastReviewAt: {
      field: 'last_review_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    ownerEmail: {
      field: 'owner_email',
      type: DataTypes.STRING(180),
      allowNull: true
    },
    evidenceRequired: {
      field: 'evidence_required',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    evidenceLocation: {
      field: 'evidence_location',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    documentationUrl: {
      field: 'documentation_url',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    escalationPolicy: {
      field: 'escalation_policy',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    watchers: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ComplianceControl',
    tableName: 'ComplianceControl'
  }
);

export default ComplianceControl;
