import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanCertification extends Model {}

ServicemanCertification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    profileId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'profile_id'
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    issuer: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('valid', 'expiring', 'expired', 'revoked'),
      allowNull: false,
      defaultValue: 'valid'
    },
    issuedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'issued_at'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at'
    },
    documentUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'document_url'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at'
    }
  },
  {
    sequelize,
    tableName: 'ServicemanCertification',
    underscored: true
  }
);

export default ServicemanCertification;
