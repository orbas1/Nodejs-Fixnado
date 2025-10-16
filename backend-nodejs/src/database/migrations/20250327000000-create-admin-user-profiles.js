export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

  await queryInterface.createTable('admin_user_profiles', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    status: {
      type: Sequelize.ENUM('active', 'invited', 'suspended', 'deactivated'),
      allowNull: false,
      defaultValue: 'active'
    },
    labels: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: []
    },
    job_title: {
      type: Sequelize.STRING,
      allowNull: true
    },
    department: {
      type: Sequelize.STRING,
      allowNull: true
    },
    avatar_url: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    display_name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    search_terms: {
      type: Sequelize.TEXT,
      allowNull: false
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

  await queryInterface.addConstraint('admin_user_profiles', {
    fields: ['user_id'],
    type: 'unique',
    name: 'admin_user_profiles_user_id_unique'
  });

  await queryInterface.addIndex('admin_user_profiles', ['status'], {
    name: 'admin_user_profiles_status_idx'
  });

  await queryInterface.addIndex('admin_user_profiles', ['display_name'], {
    name: 'admin_user_profiles_display_name_idx'
  });

  await queryInterface.addIndex('admin_user_profiles', {
    name: 'admin_user_profiles_search_terms_idx',
    using: 'GIN',
    fields: [{ name: 'search_terms', operator: 'gin_trgm_ops' }]
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex('admin_user_profiles', 'admin_user_profiles_search_terms_idx');
  await queryInterface.removeIndex('admin_user_profiles', 'admin_user_profiles_display_name_idx');
  await queryInterface.removeIndex('admin_user_profiles', 'admin_user_profiles_status_idx');
  await queryInterface.removeConstraint('admin_user_profiles', 'admin_user_profiles_user_id_unique');
  await queryInterface.dropTable('admin_user_profiles');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_admin_user_profiles_status";');
}
