export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('home_pages', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    slug: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    theme: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'standard'
    },
    layout: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'modular'
    },
    accent_color: {
      type: Sequelize.STRING,
      allowNull: true
    },
    background_color: {
      type: Sequelize.STRING,
      allowNull: true
    },
    hero_layout: {
      type: Sequelize.STRING,
      allowNull: true
    },
    seo_title: {
      type: Sequelize.STRING,
      allowNull: true
    },
    seo_description: {
      type: Sequelize.STRING,
      allowNull: true
    },
    settings: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    published_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    created_by: {
      type: Sequelize.UUID,
      allowNull: true
    },
    updated_by: {
      type: Sequelize.UUID,
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

  await queryInterface.createTable('home_page_sections', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    home_page_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'home_pages',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false
    },
    handle: {
      type: Sequelize.STRING,
      allowNull: true
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    layout: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'full-width'
    },
    background_color: {
      type: Sequelize.STRING,
      allowNull: true
    },
    text_color: {
      type: Sequelize.STRING,
      allowNull: true
    },
    accent_color: {
      type: Sequelize.STRING,
      allowNull: true
    },
    position: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    settings: {
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

  await queryInterface.createTable('home_page_components', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    home_page_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'home_pages',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    section_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'home_page_sections',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    type: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'text'
    },
    title: {
      type: Sequelize.STRING,
      allowNull: true
    },
    subheading: {
      type: Sequelize.STRING,
      allowNull: true
    },
    body: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    badge: {
      type: Sequelize.STRING,
      allowNull: true
    },
    layout: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'full'
    },
    variant: {
      type: Sequelize.STRING,
      allowNull: true
    },
    background_color: {
      type: Sequelize.STRING,
      allowNull: true
    },
    text_color: {
      type: Sequelize.STRING,
      allowNull: true
    },
    media: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    config: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    call_to_action_label: {
      type: Sequelize.STRING,
      allowNull: true
    },
    call_to_action_href: {
      type: Sequelize.STRING,
      allowNull: true
    },
    secondary_action_label: {
      type: Sequelize.STRING,
      allowNull: true
    },
    secondary_action_href: {
      type: Sequelize.STRING,
      allowNull: true
    },
    position: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    created_by: {
      type: Sequelize.UUID,
      allowNull: true
    },
    updated_by: {
      type: Sequelize.UUID,
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

  await queryInterface.addIndex('home_pages', ['status']);
  await queryInterface.addIndex('home_pages', ['published_at']);

  await queryInterface.addIndex('home_page_sections', ['home_page_id', 'position']);
  await queryInterface.addIndex('home_page_sections', ['home_page_id', 'handle']);

  await queryInterface.addIndex('home_page_components', ['section_id', 'position']);
  await queryInterface.addIndex('home_page_components', ['home_page_id']);
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex('home_page_components', ['home_page_id']);
  await queryInterface.removeIndex('home_page_components', ['section_id', 'position']);
  await queryInterface.removeIndex('home_page_sections', ['home_page_id', 'handle']);
  await queryInterface.removeIndex('home_page_sections', ['home_page_id', 'position']);
  await queryInterface.removeIndex('home_pages', ['published_at']);
  await queryInterface.removeIndex('home_pages', ['status']);

  await queryInterface.dropTable('home_page_components');
  await queryInterface.dropTable('home_page_sections');
  await queryInterface.dropTable('home_pages');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_home_pages_status"');
}
