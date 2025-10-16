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

class ServicemanDisputeTask extends Model {}

ServicemanDisputeTask.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    disputeCaseId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'dispute_case_id'
    },
    label: encryptedAttribute('label', 'servicemanDisputeTask:label', 'label_encrypted', { allowNull: false }),
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    dueAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_at'
    },
    assignedTo: encryptedAttribute('assignedTo', 'servicemanDisputeTask:assignedTo', 'assigned_to_encrypted'),
    instructions: encryptedAttribute('instructions', 'servicemanDisputeTask:instructions', 'instructions_encrypted'),
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at'
    }
  },
  {
    sequelize,
    modelName: 'ServicemanDisputeTask',
    tableName: 'serviceman_dispute_tasks',
    underscored: true
  }
);

export default ServicemanDisputeTask;

