import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProviderProfile extends Model {}

ProviderProfile.init(
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
    displayName: {
      field: 'display_name',
      type: DataTypes.STRING(120),
      allowNull: false
    },
    tradingName: {
      field: 'trading_name',
      type: DataTypes.STRING(120),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('prospect', 'onboarding', 'active', 'suspended', 'archived'),
      allowNull: false,
      defaultValue: 'prospect'
    },
    onboardingStage: {
      field: 'onboarding_stage',
      type: DataTypes.ENUM('intake', 'documents', 'compliance', 'go-live', 'live'),
      allowNull: false,
      defaultValue: 'intake'
    },
    tier: {
      type: DataTypes.ENUM('standard', 'preferred', 'strategic'),
      allowNull: false,
      defaultValue: 'standard'
    },
    riskRating: {
      field: 'risk_rating',
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium'
    },
    supportEmail: {
      field: 'support_email',
      type: DataTypes.STRING(180),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    supportPhone: {
      field: 'support_phone',
      type: DataTypes.STRING(40),
      allowNull: true
    },
    websiteUrl: {
      field: 'website_url',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    logoUrl: {
      field: 'logo_url',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    heroImageUrl: {
      field: 'hero_image_url',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    storefrontSlug: {
      field: 'storefront_slug',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    tagline: {
      field: 'tagline',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    missionStatement: {
      field: 'mission_statement',
      type: DataTypes.TEXT,
      allowNull: true
    },
    brandPrimaryColor: {
      field: 'brand_primary_color',
      type: DataTypes.STRING(32),
      allowNull: true
    },
    brandSecondaryColor: {
      field: 'brand_secondary_color',
      type: DataTypes.STRING(32),
      allowNull: true
    },
    brandFont: {
      field: 'brand_font',
      type: DataTypes.STRING(80),
      allowNull: true
    },
    operationsNotes: {
      field: 'operations_notes',
      type: DataTypes.TEXT,
      allowNull: true
    },
    coverageNotes: {
      field: 'coverage_notes',
      type: DataTypes.TEXT,
      allowNull: true
    },
    supportHours: {
      field: 'support_hours',
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    socialLinks: {
      field: 'social_links',
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    mediaGallery: {
      field: 'media_gallery',
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    dispatchRadiusKm: {
      field: 'dispatch_radius_km',
      type: DataTypes.INTEGER,
      allowNull: true
    },
    preferredResponseMinutes: {
      field: 'preferred_response_minutes',
      type: DataTypes.INTEGER,
      allowNull: true
    },
    billingEmail: {
      field: 'billing_email',
      type: DataTypes.STRING(180),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    billingPhone: {
      field: 'billing_phone',
      type: DataTypes.STRING(40),
      allowNull: true
    },
    operationsPlaybookUrl: {
      field: 'operations_playbook_url',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    insurancePolicyUrl: {
      field: 'insurance_policy_url',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    averageRating: {
      field: 'average_rating',
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0
    },
    jobsCompleted: {
      field: 'jobs_completed',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    lastReviewAt: {
      field: 'last_review_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    }
  },
  {
    sequelize,
    modelName: 'ProviderProfile',
    tableName: 'ProviderProfile',
    indexes: [
      {
        unique: true,
        fields: ['company_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['onboarding_stage']
      }
    ]
  }
);

export default ProviderProfile;
