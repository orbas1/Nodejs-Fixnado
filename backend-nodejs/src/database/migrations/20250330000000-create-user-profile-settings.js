export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('user_profile_settings', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.literal('uuid_generate_v4()')
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    preferred_name_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    job_title_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    phone_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    timezone: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    language: {
      type: Sequelize.STRING(16),
      allowNull: true
    },
    avatar_url: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    notification_preferences: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    billing_preferences: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    invoice_recipients: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    communication_preferences: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    quiet_hours_enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    quiet_hours_start: {
      type: Sequelize.TIME,
      allowNull: true
    },
    quiet_hours_end: {
      type: Sequelize.TIME,
      allowNull: true
    },
    quiet_hours_timezone: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    security_methods: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    security_updated_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  });

  await queryInterface.addConstraint('user_profile_settings', {
    type: 'unique',
    name: 'user_profile_settings_user_id_unique',
    fields: ['user_id']
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('user_profile_settings');
}
