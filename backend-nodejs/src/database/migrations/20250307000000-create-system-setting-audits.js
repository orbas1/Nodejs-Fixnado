export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('SystemSettingAudit', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    section: {
      type: Sequelize.STRING(80),
      allowNull: false
    },
    action: {
      type: Sequelize.STRING(80),
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('success', 'warning', 'error'),
      allowNull: false,
      defaultValue: 'success'
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    performed_by: {
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

  await queryInterface.addIndex('SystemSettingAudit', {
    name: 'system_setting_audit_section_created_at_idx',
    fields: ['section', 'created_at']
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex(
    'SystemSettingAudit',
    'system_setting_audit_section_created_at_idx'
  );
  await queryInterface.dropTable('SystemSettingAudit');
}
