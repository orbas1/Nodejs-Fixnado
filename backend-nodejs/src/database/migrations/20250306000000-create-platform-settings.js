export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('PlatformSetting', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    key: {
      type: Sequelize.STRING(120),
      allowNull: false,
      unique: true
    },
    value: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    updated_by: {
      type: Sequelize.STRING(120),
      allowNull: true
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
  await queryInterface.dropTable('PlatformSetting');
}
