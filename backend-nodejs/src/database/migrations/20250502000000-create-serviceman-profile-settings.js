'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('serviceman_profile_settings', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4
    },
    user_id: {
      allowNull: false,
      type: Sequelize.UUID
    },
    badge_id: {
      allowNull: true,
      type: Sequelize.STRING(64)
    },
    title: {
      allowNull: true,
      type: Sequelize.STRING(120)
    },
    region: {
      allowNull: true,
      type: Sequelize.STRING(120)
    },
    summary: {
      allowNull: true,
      type: Sequelize.TEXT
    },
    bio: {
      allowNull: true,
      type: Sequelize.TEXT
    },
    avatar_url: {
      allowNull: true,
      type: Sequelize.TEXT
    },
    timezone: {
      allowNull: true,
      type: Sequelize.STRING(64)
    },
    language: {
      allowNull: true,
      type: Sequelize.STRING(16)
    },
    phone_number: {
      allowNull: true,
      type: Sequelize.TEXT
    },
    travel_radius_km: {
      allowNull: true,
      type: Sequelize.INTEGER
    },
    max_jobs_per_day: {
      allowNull: true,
      type: Sequelize.INTEGER
    },
    preferred_shift_start: {
      allowNull: true,
      type: Sequelize.TIME
    },
    preferred_shift_end: {
      allowNull: true,
      type: Sequelize.TIME
    },
    crew_lead_eligible: {
      allowNull: false,
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    mentor_eligible: {
      allowNull: false,
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    remote_support: {
      allowNull: false,
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    availability_template: {
      allowNull: false,
      type: Sequelize.JSONB,
      defaultValue: {}
    },
    specialties: {
      allowNull: false,
      type: Sequelize.JSONB,
      defaultValue: []
    },
    certifications: {
      allowNull: false,
      type: Sequelize.JSONB,
      defaultValue: []
    },
    equipment: {
      allowNull: false,
      type: Sequelize.JSONB,
      defaultValue: []
    },
    emergency_contacts: {
      allowNull: false,
      type: Sequelize.JSONB,
      defaultValue: []
    },
    documents: {
      allowNull: false,
      type: Sequelize.JSONB,
      defaultValue: []
    },
    metadata: {
      allowNull: false,
      type: Sequelize.JSONB,
      defaultValue: {}
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW')
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW')
    }
  });

  await queryInterface.addConstraint('serviceman_profile_settings', {
    type: 'unique',
    fields: ['user_id'],
    name: 'serviceman_profile_settings_user_id_key'
  });

  await queryInterface.addConstraint('serviceman_profile_settings', {
    type: 'foreign key',
    fields: ['user_id'],
    name: 'serviceman_profile_settings_user_id_fkey',
    references: {
      model: 'User',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('serviceman_profile_settings');
}
