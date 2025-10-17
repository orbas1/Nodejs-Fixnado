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
    title: {
      type: DataTypes.STRING(180),
      allowNull: false
    },
    issuer: {
      type: DataTypes.STRING(160),
      allowNull: true
    },
    credentialId: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'credential_id'
    },
    issuedOn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'issued_on'
    },
    expiresOn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_on'
    },
    attachmentUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'attachment_url'
    }
  },
  {
    sequelize,
    modelName: 'ServicemanCertification',
    tableName: 'serviceman_certifications',
    underscored: true
  }
);

export default ServicemanCertification;
