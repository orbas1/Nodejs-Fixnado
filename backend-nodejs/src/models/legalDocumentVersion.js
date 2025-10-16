import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class LegalDocumentVersion extends Model {}

LegalDocumentVersion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    documentId: {
      field: 'document_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    changeNotes: {
      field: 'change_notes',
      type: DataTypes.TEXT,
      allowNull: true
    },
    content: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    createdBy: {
      field: 'created_by',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    publishedBy: {
      field: 'published_by',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    effectiveAt: {
      field: 'effective_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    publishedAt: {
      field: 'published_at',
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'LegalDocumentVersion',
    tableName: 'LegalDocumentVersions'
  }
);

export default LegalDocumentVersion;
