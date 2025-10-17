import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanTaxDocument extends Model {}

ServicemanTaxDocument.init(
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
    filingId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'filing_id'
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    documentType: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'supporting',
      field: 'document_type'
    },
    status: {
      type: DataTypes.STRING(24),
      allowNull: false,
      defaultValue: 'active'
    },
    fileUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'file_url'
    },
    thumbnailUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'thumbnail_url'
    },
    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'uploaded_at'
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'uploaded_by'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ServicemanTaxDocument',
    tableName: 'serviceman_tax_documents',
    underscored: true
  }
);

export default ServicemanTaxDocument;
