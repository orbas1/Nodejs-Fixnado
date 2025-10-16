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
    job_title: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    department: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    phone_number: {
      type: Sequelize.STRING(80),
      allowNull: true
    },
    avatar_url: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    timezone: {
      type: Sequelize.STRING(80),
      allowNull: true
    },
    address_line1: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    address_line2: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    city: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    state: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    postal_code: {
      type: Sequelize.STRING(40),
      allowNull: true
    },
    country: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    notification_preferences: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    notification_emails: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
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

  await queryInterface.createTable('AdminDelegate', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    admin_profile_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'AdminProfile', key: 'id' },
      onDelete: 'CASCADE'
    },
    name: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    email: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    role: {
      type: Sequelize.STRING(120),
      allowNull: false
    },
    permissions: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    avatar_url: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM('active', 'suspended'),
      allowNull: false,
      defaultValue: 'active'
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

  await queryInterface.addConstraint('AdminDelegate', {
    type: 'unique',
    fields: ['admin_profile_id', 'email'],
    name: 'admin_delegate_unique_email_per_profile'
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeConstraint('AdminDelegate', 'admin_delegate_unique_email_per_profile').catch(() => {});
  await queryInterface.dropTable('AdminDelegate');
  await queryInterface.dropTable('AdminProfile');
}
