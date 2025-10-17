import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ServicemanProfileSetting extends Model {}

ServicemanProfileSetting.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    badgeId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'badge_id'
    },
    title: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    region: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'avatar_url'
    },
    timezone: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    language: {
      type: DataTypes.STRING(16),
      allowNull: true
    },
    phoneNumber: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'phone_number'
    },
    travelRadiusKm: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'travel_radius_km'
    },
    maxJobsPerDay: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'max_jobs_per_day'
    },
    preferredShiftStart: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'preferred_shift_start'
    },
    preferredShiftEnd: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'preferred_shift_end'
    },
    crewLeadEligible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'crew_lead_eligible'
    },
    mentorEligible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'mentor_eligible'
    },
    remoteSupport: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'remote_support'
    },
    availabilityTemplate: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      field: 'availability_template'
    },
    specialties: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    certifications: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    equipment: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    emergencyContacts: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'emergency_contacts'
    },
    documents: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ServicemanProfileSetting',
    tableName: 'serviceman_profile_settings',
    underscored: true
  }
);

export default ServicemanProfileSetting;
