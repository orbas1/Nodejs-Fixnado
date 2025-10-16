const TAG_TABLE = 'blog_tags';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres') {
    return Sequelize.JSONB;
  }
  return Sequelize.JSON;
}

export async function up({ context: queryInterface, Sequelize }) {
  const jsonType = resolveJsonType(queryInterface, Sequelize);

  await queryInterface.addColumn(TAG_TABLE, 'description', {
    type: Sequelize.TEXT,
    allowNull: true
  });

  await queryInterface.addColumn(TAG_TABLE, 'meta_title', {
    type: Sequelize.STRING(160),
    allowNull: true
  });

  await queryInterface.addColumn(TAG_TABLE, 'meta_description', {
    type: Sequelize.TEXT,
    allowNull: true
  });

  await queryInterface.addColumn(TAG_TABLE, 'meta_keywords', {
    type: jsonType,
    allowNull: false,
    defaultValue: []
  });

  await queryInterface.addColumn(TAG_TABLE, 'canonical_url', {
    type: Sequelize.STRING(512),
    allowNull: true
  });

  await queryInterface.addColumn(TAG_TABLE, 'og_image_url', {
    type: Sequelize.STRING(512),
    allowNull: true
  });

  await queryInterface.addColumn(TAG_TABLE, 'og_image_alt', {
    type: Sequelize.STRING(180),
    allowNull: true
  });

  await queryInterface.addColumn(TAG_TABLE, 'noindex', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  });

  await queryInterface.addColumn(TAG_TABLE, 'structured_data', {
    type: jsonType,
    allowNull: false,
    defaultValue: {}
  });

  await queryInterface.addColumn(TAG_TABLE, 'synonyms', {
    type: jsonType,
    allowNull: false,
    defaultValue: []
  });

  await queryInterface.addColumn(TAG_TABLE, 'role_access', {
    type: jsonType,
    allowNull: false,
    defaultValue: ['admin']
  });

  await queryInterface.addColumn(TAG_TABLE, 'owner_role', {
    type: Sequelize.STRING(60),
    allowNull: false,
    defaultValue: 'admin'
  });

  await queryInterface.addIndex(TAG_TABLE, ['name'], { name: 'blog_tags_name_idx' });
  await queryInterface.addIndex(TAG_TABLE, ['noindex'], { name: 'blog_tags_noindex_idx' });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex(TAG_TABLE, 'blog_tags_noindex_idx');
  await queryInterface.removeIndex(TAG_TABLE, 'blog_tags_name_idx');
  await queryInterface.removeColumn(TAG_TABLE, 'owner_role');
  await queryInterface.removeColumn(TAG_TABLE, 'role_access');
  await queryInterface.removeColumn(TAG_TABLE, 'synonyms');
  await queryInterface.removeColumn(TAG_TABLE, 'structured_data');
  await queryInterface.removeColumn(TAG_TABLE, 'noindex');
  await queryInterface.removeColumn(TAG_TABLE, 'og_image_alt');
  await queryInterface.removeColumn(TAG_TABLE, 'og_image_url');
  await queryInterface.removeColumn(TAG_TABLE, 'canonical_url');
  await queryInterface.removeColumn(TAG_TABLE, 'meta_keywords');
  await queryInterface.removeColumn(TAG_TABLE, 'meta_description');
  await queryInterface.removeColumn(TAG_TABLE, 'meta_title');
  await queryInterface.removeColumn(TAG_TABLE, 'description');
}
