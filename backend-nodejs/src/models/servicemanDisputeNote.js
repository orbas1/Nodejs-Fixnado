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

class ServicemanDisputeNote extends Model {}

ServicemanDisputeNote.init(
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
    authorId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'author_id'
    },
    noteType: {
      type: DataTypes.ENUM('update', 'call', 'decision', 'escalation', 'reminder', 'other'),
      allowNull: false,
      defaultValue: 'update',
      field: 'note_type'
    },
    visibility: {
      type: DataTypes.ENUM('customer', 'internal', 'provider', 'finance', 'compliance'),
      allowNull: false,
      defaultValue: 'internal'
    },
    body: encryptedAttribute('body', 'servicemanDisputeNote:body', 'body_encrypted', { allowNull: false }),
    nextSteps: encryptedAttribute('nextSteps', 'servicemanDisputeNote:nextSteps', 'next_steps_encrypted'),
    pinned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'ServicemanDisputeNote',
    tableName: 'serviceman_dispute_notes',
    underscored: true
  }
);

export default ServicemanDisputeNote;

