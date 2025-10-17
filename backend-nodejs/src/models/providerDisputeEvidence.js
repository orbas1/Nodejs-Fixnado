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

class ProviderDisputeEvidence extends Model {}

ProviderDisputeEvidence.init(
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
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'uploaded_by'
    },
    label: encryptedAttribute('label', 'providerDisputeEvidence:label', 'label_encrypted', { allowNull: false }),
    fileUrl: encryptedAttribute('fileUrl', 'providerDisputeEvidence:fileUrl', 'file_url_encrypted', {
      allowNull: false
    }),
    fileType: encryptedAttribute('fileType', 'providerDisputeEvidence:fileType', 'file_type_encrypted'),
    thumbnailUrl: encryptedAttribute(
      'thumbnailUrl',
      'providerDisputeEvidence:thumbnailUrl',
      'thumbnail_url_encrypted'
    ),
    notes: encryptedAttribute('notes', 'providerDisputeEvidence:notes', 'notes_encrypted')
  },
  {
    sequelize,
    modelName: 'ProviderDisputeEvidence',
    tableName: 'provider_dispute_evidence',
    underscored: true
  }
);

export default ProviderDisputeEvidence;

