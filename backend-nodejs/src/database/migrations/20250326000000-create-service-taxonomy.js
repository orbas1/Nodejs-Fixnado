export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('service_taxonomy_types', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    key: {
      type: Sequelize.STRING(160),
      allowNull: false,
      unique: true
    },
    name: {
      type: Sequelize.STRING(180),
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    status: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'active'
    },
    accent_color: {
      type: Sequelize.STRING(32),
      allowNull: true
    },
    icon: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    display_order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    created_by: {
      type: Sequelize.UUID,
      allowNull: true
    },
    updated_by: {
      type: Sequelize.UUID,
      allowNull: true
    },
    archived_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  });

  await queryInterface.addIndex('service_taxonomy_types', ['status']);
  await queryInterface.addIndex('service_taxonomy_types', ['display_order']);

  await queryInterface.createTable('service_taxonomy_categories', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    type_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'service_taxonomy_types',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    slug: {
      type: Sequelize.STRING(160),
      allowNull: false,
      unique: true
    },
    name: {
      type: Sequelize.STRING(180),
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    status: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'active'
    },
    display_order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    default_tags: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    search_keywords: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    hero_image_url: {
      type: Sequelize.STRING(1024),
      allowNull: true
    },
    hero_image_alt: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    icon_url: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    preview_url: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    is_featured: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    created_by: {
      type: Sequelize.UUID,
      allowNull: true
    },
    updated_by: {
      type: Sequelize.UUID,
      allowNull: true
    },
    archived_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  });

  await queryInterface.addIndex('service_taxonomy_categories', ['type_id']);
  await queryInterface.addIndex('service_taxonomy_categories', ['status']);
  await queryInterface.addIndex('service_taxonomy_categories', ['is_featured']);
  await queryInterface.addIndex('service_taxonomy_categories', ['display_order']);
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('service_taxonomy_categories');
  await queryInterface.dropTable('service_taxonomy_types');
}
