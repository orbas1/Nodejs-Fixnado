import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ComplianceDocument extends Model {}

ComplianceDocument.init(
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
    uploadedBy: {
      field: 'uploaded_by',
      type: DataTypes.UUID,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'expired'),
      allowNull: false,
      defaultValue: 'submitted'
    },
    storageKey: {
      field: 'storage_key',
      type: DataTypes.STRING(255),
      allowNull: false
    },
    fileName: {
      field: 'file_name',
      type: DataTypes.STRING(180),
      allowNull: false
    },
    fileSizeBytes: {
      field: 'file_size_bytes',
      type: DataTypes.INTEGER,
      allowNull: false
    },
    mimeType: {
      field: 'mime_type',
      type: DataTypes.STRING(64),
      allowNull: false
    },
    checksum: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    issuedAt: {
      field: 'issued_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    expiryAt: {
      field: 'expiry_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    submittedAt: {
      field: 'submitted_at',
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    reviewedAt: {
      field: 'reviewed_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    reviewerId: {
      field: 'reviewer_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    rejectionReason: {
      field: 'rejection_reason',
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ComplianceDocument',
    tableName: 'ComplianceDocument'
  }
);

export default ComplianceDocument;
