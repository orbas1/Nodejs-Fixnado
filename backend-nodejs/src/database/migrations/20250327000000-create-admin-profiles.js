export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('AdminProfile', {
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
      onDelete: 'CASCADE'
    },
    display_name: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    job_title: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    department: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    pronouns: {
      type: Sequelize.STRING(80),
      allowNull: true
    },
    avatar_url: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    bio: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    contact_email: {
      type: Sequelize.STRING(254),
      allowNull: true
    },
    backup_email: {
      type: Sequelize.STRING(254),
      allowNull: true
    },
    contact_phone: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    location: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    timezone: {
      type: Sequelize.STRING(64),
      allowNull: true
    },
    language: {
      type: Sequelize.STRING(32),
      allowNull: true
    },
    theme: {
      type: Sequelize.STRING(16),
      allowNull: true
    },
    working_hours: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    notification_preferences: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    security_preferences: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    delegates: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW'),
      allowNull: false
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW'),
      allowNull: false
    }
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('AdminProfile');
}
