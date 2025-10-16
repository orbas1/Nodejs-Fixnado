import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { encryptString, decryptString } from '../utils/security/fieldEncryption.js';

function encryptedAttribute(attribute, context, field, { allowNull = true } = {}) {
  return {
    type: DataTypes.TEXT,
    allowNull,
    field,
    set(value) {
      if (value === null || value === undefined || value === '') {
        this.setDataValue(attribute, null);
        return;
      }

      if (typeof value !== 'string') {
        throw new TypeError(`${context} must be a string when provided.`);
      }

      const trimmed = value.trim();
      if (!trimmed) {
        this.setDataValue(attribute, null);
        return;
      }

      this.setDataValue(attribute, encryptString(trimmed, context));
    },
    get() {
      const stored = this.getDataValue(attribute);
      return stored ? decryptString(stored, context) : null;
    }
  };
}

class ServicemanDisputeCase extends Model {}

ServicemanDisputeCase.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    servicemanId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'serviceman_id'
    },
    disputeId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'dispute_id'
    },
    caseNumber: {
      type: DataTypes.STRING(32),
      allowNull: false,
      field: 'case_number'
    },
    title: encryptedAttribute('title', 'servicemanDisputeCase:title', 'title_encrypted', { allowNull: false }),
    category: {
      type: DataTypes.ENUM('billing', 'service_quality', 'damage', 'timeline', 'compliance', 'other'),
      allowNull: false,
      defaultValue: 'billing'
    },
    status: {
      type: DataTypes.ENUM('draft', 'open', 'under_review', 'awaiting_customer', 'resolved', 'closed'),
      allowNull: false,
      defaultValue: 'draft'
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium'
    },
    summary: encryptedAttribute('summary', 'servicemanDisputeCase:summary', 'summary_encrypted'),
    nextStep: encryptedAttribute('nextStep', 'servicemanDisputeCase:nextStep', 'next_step_encrypted'),
    assignedTeam: encryptedAttribute('assignedTeam', 'servicemanDisputeCase:assignedTeam', 'assigned_team_encrypted'),
    assignedOwner: encryptedAttribute('assignedOwner', 'servicemanDisputeCase:assignedOwner', 'assigned_owner_encrypted'),
    resolutionNotes: encryptedAttribute(
      'resolutionNotes',
      'servicemanDisputeCase:resolutionNotes',
      'resolution_notes_encrypted'
    ),
    externalReference: encryptedAttribute(
      'externalReference',
      'servicemanDisputeCase:externalReference',
      'external_reference_encrypted'
    ),
    amountDisputed: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'amount_disputed',
      get() {
        const stored = this.getDataValue('amountDisputed');
        return stored === null || stored === undefined ? null : Number.parseFloat(stored);
      }
    },
    currency: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: 'GBP'
    },
    openedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'opened_at'
    },
    dueAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_at'
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at'
    },
    slaDueAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sla_due_at'
    },
    requiresFollowUp: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'requires_follow_up'
    },
    lastReviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_reviewed_at'
    }
  },
  {
    sequelize,
    modelName: 'ServicemanDisputeCase',
    tableName: 'serviceman_dispute_cases',
    underscored: true
  }
);

export default ServicemanDisputeCase;

