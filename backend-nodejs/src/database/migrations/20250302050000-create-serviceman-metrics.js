export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('serviceman_metric_settings', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    scope: {
      type: Sequelize.STRING(64),
      allowNull: false,
      unique: true
    },
    config: {
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
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  });

  await queryInterface.createTable('serviceman_metric_cards', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    title: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    tone: {
      type: Sequelize.STRING(24),
      allowNull: false,
      defaultValue: 'info'
    },
    details: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    display_order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 100
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    media_url: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    media_alt: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    cta: {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null
    },
    created_by: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    updated_by: {
      type: Sequelize.STRING(120),
      allowNull: true
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

  await queryInterface.addIndex('serviceman_metric_cards', {
    fields: ['is_active', 'display_order', 'created_at'],
    name: 'serviceman_metric_cards_active_order_idx'
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex('serviceman_metric_cards', 'serviceman_metric_cards_active_order_idx');
  await queryInterface.dropTable('serviceman_metric_cards');
  await queryInterface.dropTable('serviceman_metric_settings');
}

export default { up, down };
