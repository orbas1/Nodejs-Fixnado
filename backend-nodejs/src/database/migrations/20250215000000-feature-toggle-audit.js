export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('feature_toggle_audits', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    toggle_key: {
      type: Sequelize.STRING,
      allowNull: false
    },
    previous_state: {
      type: Sequelize.STRING,
      allowNull: true
    },
    previous_rollout: {
      type: Sequelize.DECIMAL(5, 4),
      allowNull: true
    },
    next_state: {
      type: Sequelize.STRING,
      allowNull: false
    },
    next_rollout: {
      type: Sequelize.DECIMAL(5, 4),
      allowNull: false
    },
    actor: {
      type: Sequelize.STRING,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    ticket: {
      type: Sequelize.STRING,
      allowNull: true
    },
    changed_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  });

  await queryInterface.addIndex('feature_toggle_audits', ['toggle_key']);
  await queryInterface.addIndex('feature_toggle_audits', ['changed_at']);
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('feature_toggle_audits');
}
