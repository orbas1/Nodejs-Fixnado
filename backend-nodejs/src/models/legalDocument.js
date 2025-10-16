import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class LegalDocument extends Model {}

LegalDocument.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    slug: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    heroImageUrl: {
      field: 'hero_image_url',
      type: DataTypes.TEXT,
      allowNull: true
    },
    owner: {
      type: DataTypes.STRING(160),
      allowNull: false,
      defaultValue: 'Blackwellen Ltd Privacy Office'
    },
    contactEmail: {
      field: 'contact_email',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    contactPhone: {
      field: 'contact_phone',
      type: DataTypes.STRING(40),
      allowNull: true
    },
    contactUrl: {
      field: 'contact_url',
      type: DataTypes.TEXT,
      allowNull: true
    },
    reviewCadence: {
      field: 'review_cadence',
      type: DataTypes.STRING(80),
      allowNull: true
    },
    currentVersionId: {
      field: 'current_version_id',
      type: DataTypes.UUID,
      allowNull: true
    },
    createdBy: {
      field: 'created_by',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    updatedBy: {
      field: 'updated_by',
      type: DataTypes.STRING(160),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'LegalDocument',
    tableName: 'LegalDocuments'
  }
);

export default LegalDocument;
