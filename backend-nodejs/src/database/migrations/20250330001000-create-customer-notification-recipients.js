const TABLE = 'CustomerNotificationRecipient';

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable(TABLE, {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    account_setting_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'CustomerAccountSetting', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    label: {
      type: Sequelize.STRING(120),
      allowNull: false
    },
    channel: {
      type: Sequelize.STRING(32),
      allowNull: false
    },
    target: {
      type: Sequelize.STRING(320),
      allowNull: false
    },
    role: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'viewer'
    },
    enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
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

  await queryInterface.addIndex(TABLE, ['account_setting_id']);
  await queryInterface.addIndex(TABLE, ['channel']);
  await queryInterface.addIndex(TABLE, ['enabled']);
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable(TABLE);
}
