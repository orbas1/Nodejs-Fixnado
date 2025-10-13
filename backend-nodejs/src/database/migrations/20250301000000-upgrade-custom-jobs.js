export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.addColumn('Post', 'category', {
    type: Sequelize.STRING,
    allowNull: true
  });

  await queryInterface.addColumn('Post', 'category_other', {
    type: Sequelize.STRING,
    allowNull: true
  });

  await queryInterface.addColumn('Post', 'budget_amount', {
    type: Sequelize.DECIMAL(12, 2),
    allowNull: true
  });

  await queryInterface.addColumn('Post', 'budget_currency', {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'GBP'
  });

  await queryInterface.addColumn('Post', 'images', {
    type: Sequelize.JSON,
    allowNull: false,
    defaultValue: []
  });

  await queryInterface.addColumn('Post', 'metadata', {
    type: Sequelize.JSON,
    allowNull: false,
    defaultValue: {}
  });

  await queryInterface.addColumn('Post', 'zone_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'ServiceZone',
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });

  await queryInterface.addColumn('Post', 'allow_out_of_zone', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  });

  await queryInterface.addColumn('Post', 'bid_deadline', {
    type: Sequelize.DATE,
    allowNull: true
  });

  await queryInterface.addIndex('Post', ['zone_id']);
  await queryInterface.addIndex('Post', ['allow_out_of_zone']);
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex('Post', ['allow_out_of_zone']);
  await queryInterface.removeIndex('Post', ['zone_id']);
  await queryInterface.removeColumn('Post', 'bid_deadline');
  await queryInterface.removeColumn('Post', 'allow_out_of_zone');
  await queryInterface.removeColumn('Post', 'zone_id');
  await queryInterface.removeColumn('Post', 'metadata');
  await queryInterface.removeColumn('Post', 'images');
  await queryInterface.removeColumn('Post', 'budget_currency');
  await queryInterface.removeColumn('Post', 'budget_amount');
  await queryInterface.removeColumn('Post', 'category_other');
  await queryInterface.removeColumn('Post', 'category');
}
