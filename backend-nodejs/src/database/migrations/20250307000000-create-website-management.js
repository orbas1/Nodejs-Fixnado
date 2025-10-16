export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('WebsitePage', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    title: {
      type: Sequelize.STRING(200),
      allowNull: false
    },
    slug: {
      type: Sequelize.STRING(180),
      allowNull: false,
      unique: true
    },
    status: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'draft'
    },
    layout: {
      type: Sequelize.STRING(64),
      allowNull: false,
      defaultValue: 'default'
    },
    visibility: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'public'
    },
    hero_headline: {
      type: Sequelize.STRING(200),
      allowNull: true
    },
    hero_subheading: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    hero_image_url: {
      type: Sequelize.STRING(1024),
      allowNull: true
    },
    hero_cta_label: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    hero_cta_url: {
      type: Sequelize.STRING(1024),
      allowNull: true
    },
    feature_image_url: {
      type: Sequelize.STRING(1024),
      allowNull: true
    },
    seo_title: {
      type: Sequelize.STRING(200),
      allowNull: true
    },
    seo_description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    allowed_roles: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    preview_path: {
      type: Sequelize.STRING(255),
      allowNull: true
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
      defaultValue: Sequelize.fn('NOW'),
      allowNull: false
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW'),
      allowNull: false
    }
  });

  await queryInterface.addIndex('WebsitePage', ['slug']);

  await queryInterface.createTable('WebsiteContentBlock', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    page_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'WebsitePage',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    type: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    title: {
      type: Sequelize.STRING(200),
      allowNull: true
    },
    subtitle: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    body: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    layout: {
      type: Sequelize.STRING(60),
      allowNull: false,
      defaultValue: 'stacked'
    },
    accent_color: {
      type: Sequelize.STRING(32),
      allowNull: true
    },
    background_image_url: {
      type: Sequelize.STRING(1024),
      allowNull: true
    },
    media: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    settings: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    allowed_roles: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    analytics_tag: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    embed_url: {
      type: Sequelize.STRING(1024),
      allowNull: true
    },
    cta_label: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    cta_url: {
      type: Sequelize.STRING(1024),
      allowNull: true
    },
    position: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    is_visible: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
      defaultValue: Sequelize.fn('NOW'),
      allowNull: false
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW'),
      allowNull: false
    }
  });

  await queryInterface.addIndex('WebsiteContentBlock', ['page_id']);
  await queryInterface.addIndex('WebsiteContentBlock', ['page_id', 'position']);

  await queryInterface.createTable('WebsiteNavigationMenu', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING(120),
      allowNull: false,
      unique: true
    },
    location: {
      type: Sequelize.STRING(60),
      allowNull: false
    },
    description: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    is_primary: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    allowed_roles: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
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
      defaultValue: Sequelize.fn('NOW'),
      allowNull: false
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW'),
      allowNull: false
    }
  });

  await queryInterface.addIndex('WebsiteNavigationMenu', ['location']);

  await queryInterface.createTable('WebsiteNavigationItem', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    menu_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'WebsiteNavigationMenu',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    parent_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'WebsiteNavigationItem',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    label: {
      type: Sequelize.STRING(180),
      allowNull: false
    },
    url: {
      type: Sequelize.STRING(1024),
      allowNull: false
    },
    icon: {
      type: Sequelize.STRING(120),
      allowNull: true
    },
    open_in_new_tab: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    sort_order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    visibility: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'public'
    },
    allowed_roles: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    settings: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    analytics_tag: {
      type: Sequelize.STRING(120),
      allowNull: true
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
      defaultValue: Sequelize.fn('NOW'),
      allowNull: false
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW'),
      allowNull: false
    }
  });

  await queryInterface.addIndex('WebsiteNavigationItem', ['menu_id']);
  await queryInterface.addIndex('WebsiteNavigationItem', ['menu_id', 'sort_order']);
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex('WebsiteNavigationItem', ['menu_id', 'sort_order']);
  await queryInterface.removeIndex('WebsiteNavigationItem', ['menu_id']);
  await queryInterface.dropTable('WebsiteNavigationItem');

  await queryInterface.removeIndex('WebsiteNavigationMenu', ['location']);
  await queryInterface.dropTable('WebsiteNavigationMenu');

  await queryInterface.removeIndex('WebsiteContentBlock', ['page_id', 'position']);
  await queryInterface.removeIndex('WebsiteContentBlock', ['page_id']);
  await queryInterface.dropTable('WebsiteContentBlock');

  await queryInterface.removeIndex('WebsitePage', ['slug']);
  await queryInterface.dropTable('WebsitePage');
}
