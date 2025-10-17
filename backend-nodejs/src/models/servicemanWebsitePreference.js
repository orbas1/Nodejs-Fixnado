import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanWebsitePreference extends Model {}

ServicemanWebsitePreference.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    persona: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: true
    },
    heroTitle: {
      field: 'hero_title',
      type: DataTypes.STRING(160),
      allowNull: false
    },
    heroSubtitle: {
      field: 'hero_subtitle',
      type: DataTypes.STRING(240),
      allowNull: true
    },
    heroTagline: {
      field: 'hero_tagline',
      type: DataTypes.STRING(160),
      allowNull: true
    },
    heroImageUrl: {
      field: 'hero_image_url',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    aboutContent: {
      field: 'about_content',
      type: DataTypes.TEXT,
      allowNull: true
    },
    primaryColor: {
      field: 'primary_color',
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '#1D4ED8'
    },
    accentColor: {
      field: 'accent_color',
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '#0EA5E9'
    },
    theme: {
      type: DataTypes.ENUM('light', 'dark', 'system'),
      allowNull: false,
      defaultValue: 'system'
    },
    layout: {
      type: DataTypes.ENUM('spotlight', 'columns', 'split'),
      allowNull: false,
      defaultValue: 'spotlight'
    },
    logoUrl: {
      field: 'logo_url',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    galleryMedia: {
      field: 'gallery_media',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    contactEmail: {
      field: 'contact_email',
      type: DataTypes.STRING(160),
      allowNull: false
    },
    contactPhone: {
      field: 'contact_phone',
      type: DataTypes.STRING(60),
      allowNull: true
    },
    emergencyPhone: {
      field: 'emergency_phone',
      type: DataTypes.STRING(60),
      allowNull: true
    },
    bookingUrl: {
      field: 'booking_url',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    serviceAreas: {
      field: 'service_areas',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    serviceTags: {
      field: 'service_tags',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    contactHours: {
      field: 'contact_hours',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    languages: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    allowOnlineBooking: {
      field: 'allow_online_booking',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    enableEnquiryForm: {
      field: 'enable_enquiry_form',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    showTravelRadius: {
      field: 'show_travel_radius',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    travelRadiusKm: {
      field: 'travel_radius_km',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 25
    },
    averageResponseMinutes: {
      field: 'average_response_minutes',
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 90
    },
    emergencySupport: {
      field: 'emergency_support',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    highlights: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    testimonials: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    featuredProjects: {
      field: 'featured_projects',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    seoTitle: {
      field: 'seo_title',
      type: DataTypes.STRING(180),
      allowNull: false
    },
    seoDescription: {
      field: 'seo_description',
      type: DataTypes.TEXT,
      allowNull: true
    },
    seoKeywords: {
      field: 'seo_keywords',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    seoIndexable: {
      field: 'seo_indexable',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    seoMetaImageUrl: {
      field: 'seo_meta_image_url',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    allowedRoles: {
      field: 'allowed_roles',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: ['serviceman']
    },
    socialLinks: {
      field: 'social_links',
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    callToActionLabel: {
      field: 'call_to_action_label',
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: 'Book a crew'
    },
    callToActionUrl: {
      field: 'call_to_action_url',
      type: DataTypes.STRING(255),
      allowNull: true
    },
    publishedAt: {
      field: 'published_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    createdBy: {
      field: 'created_by',
      type: DataTypes.UUID,
      allowNull: true
    },
    updatedBy: {
      field: 'updated_by',
      type: DataTypes.UUID,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'ServicemanWebsitePreference',
    tableName: 'serviceman_website_preferences',
    underscored: true
  }
);

export default ServicemanWebsitePreference;
