export async function up({ context: queryInterface, Sequelize }) {
  const dialect = queryInterface.sequelize.getDialect();
  const jsonType = dialect === 'postgres' ? Sequelize.JSONB : Sequelize.JSON;

  await queryInterface.createTable('user_preferences', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'User', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    timezone: {
      type: Sequelize.STRING(64),
      allowNull: false,
      defaultValue: 'UTC'
    },
    locale: {
      type: Sequelize.STRING(16),
      allowNull: false,
      defaultValue: 'en-GB'
    },
    organisation_name: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    job_title: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    team_name: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    avatar_url: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    signature: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    digest_frequency: {
      type: Sequelize.ENUM('never', 'daily', 'weekly'),
      allowNull: false,
      defaultValue: 'weekly'
    },
    email_alerts: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    sms_alerts: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    push_alerts: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    marketing_opt_in: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    primary_phone_encrypted: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    workspace_shortcuts: {
      type: jsonType,
      allowNull: false,
      defaultValue: []
    },
    role_assignments: {
      type: jsonType,
      allowNull: false,
      defaultValue: []
    },
    notification_channels: {
      type: jsonType,
      allowNull: false,
      defaultValue: []
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('user_preferences');
  if (queryInterface.sequelize.getDialect() === 'postgres') {
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_user_preferences_digest_frequency";');
  }
}
