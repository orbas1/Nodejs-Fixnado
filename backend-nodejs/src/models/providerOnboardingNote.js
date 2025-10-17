import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderOnboardingNote extends Model {}

ProviderOnboardingNote.init(
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
    authorId: {
      field: 'author_id',
      type: DataTypes.UUID,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('update', 'risk', 'decision', 'note'),
      allowNull: false,
      defaultValue: 'note'
    },
    stage: {
      type: DataTypes.ENUM('intake', 'documents', 'compliance', 'go-live', 'live'),
      allowNull: false,
      defaultValue: 'intake'
    },
    visibility: {
      type: DataTypes.ENUM('internal', 'shared'),
      allowNull: false,
      defaultValue: 'internal'
    },
    summary: {
      type: DataTypes.STRING(180),
      allowNull: false
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    followUpAt: {
      field: 'follow_up_at',
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'ProviderOnboardingNote',
    tableName: 'ProviderOnboardingNote',
    indexes: [
      {
        fields: ['company_id']
      },
      {
        fields: ['stage']
      },
      {
        fields: ['type']
      }
    ]
  }
);

export default ProviderOnboardingNote;
