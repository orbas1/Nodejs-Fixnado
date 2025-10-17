import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderStorefront extends Model {}

ProviderStorefront.init(
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
    name: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    tagline: {
      type: DataTypes.STRING(200)
    },
    description: {
      type: DataTypes.TEXT
    },
    heroImageUrl: {
      field: 'hero_image_url',
      type: DataTypes.STRING(255)
    },
    contactEmail: {
      field: 'contact_email',
      type: DataTypes.STRING(180),
      validate: {
        isEmail: true
      }
    },
    contactPhone: {
      field: 'contact_phone',
      type: DataTypes.STRING(40)
    },
    primaryColor: {
      field: 'primary_color',
      type: DataTypes.STRING(16)
    },
    accentColor: {
      field: 'accent_color',
      type: DataTypes.STRING(16)
    },
    status: {
      type: DataTypes.ENUM('draft', 'live', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    isPublished: {
      field: 'is_published',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    publishedAt: {
      field: 'published_at',
      type: DataTypes.DATE
    },
    reviewRequired: {
      field: 'review_required',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ProviderStorefront',
    tableName: 'provider_storefronts',
    indexes: [
      {
        unique: true,
        fields: ['company_id']
      },
      {
        unique: true,
        fields: ['slug']
      }
    ]
  }
);

export default ProviderStorefront;
