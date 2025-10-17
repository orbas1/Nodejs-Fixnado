import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

const JSONB_TYPE = sequelize.getDialect() === 'postgres' ? DataTypes.JSONB : DataTypes.JSON;

class ProviderWebsitePreference extends Model {}

ProviderWebsitePreference.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    companyId: {
      field: 'company_id',
      type: DataTypes.UUID,
      allowNull: false,
      unique: true
    },
    slug: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    customDomain: {
      field: 'custom_domain',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    hero: {
      type: JSONB_TYPE,
      allowNull: false,
      defaultValue: {}
    },
    branding: {
      type: JSONB_TYPE,
      allowNull: false,
      defaultValue: {}
    },
    media: {
      type: JSONB_TYPE,
      allowNull: false,
      defaultValue: {}
    },
    support: {
      type: JSONB_TYPE,
      allowNull: false,
      defaultValue: {}
    },
    seo: {
      type: JSONB_TYPE,
      allowNull: false,
      defaultValue: {}
    },
    socialLinks: {
      field: 'social_links',
      type: JSONB_TYPE,
      allowNull: false,
      defaultValue: []
    },
    trust: {
      type: JSONB_TYPE,
      allowNull: false,
      defaultValue: {}
    },
    modules: {
      type: JSONB_TYPE,
      allowNull: false,
      defaultValue: {}
    },
    featuredProjects: {
      field: 'featured_projects',
      type: JSONB_TYPE,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: JSONB_TYPE,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ProviderWebsitePreference',
    tableName: 'provider_website_preferences',
    indexes: [
      { unique: true, fields: ['company_id'] },
      { fields: ['slug'] }
    ]
  }
);

export default ProviderWebsitePreference;
