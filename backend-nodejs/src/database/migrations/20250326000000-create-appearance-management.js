export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('AppearanceProfile', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING(180),
      allowNull: false
    },
    slug: {
      type: Sequelize.STRING(200),
      allowNull: false,
      unique: true
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    is_default: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    allowed_roles: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    color_palette: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    typography: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    layout: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    imagery: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    widgets: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    governance: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    published_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    archived_at: {
      type: Sequelize.DATE,
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
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  });

  await queryInterface.createTable('AppearanceAsset', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    profile_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'AppearanceProfile',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    asset_type: {
      type: Sequelize.STRING(60),
      allowNull: false
    },
    label: {
      type: Sequelize.STRING(180),
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    url: {
      type: Sequelize.STRING(512),
      allowNull: false
    },
    alt_text: {
      type: Sequelize.STRING(256),
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    sort_order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    archived_at: {
      type: Sequelize.DATE,
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
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  });

  await queryInterface.createTable('AppearanceVariant', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    profile_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'AppearanceProfile',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    variant_key: {
      type: Sequelize.STRING(120),
      allowNull: false
    },
    name: {
      type: Sequelize.STRING(180),
      allowNull: false
    },
    headline: {
      type: Sequelize.STRING(280),
      allowNull: true
    },
    subheadline: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    cta_label: {
      type: Sequelize.STRING(140),
      allowNull: true
    },
    cta_url: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    hero_image_url: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    hero_video_url: {
      type: Sequelize.STRING(512),
      allowNull: true
    },
    marketing_copy: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    sort_order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    publish_state: {
      type: Sequelize.STRING(40),
      allowNull: false,
      defaultValue: 'draft'
    },
    scheduled_for: {
      type: Sequelize.DATE,
      allowNull: true
    },
    archived_at: {
      type: Sequelize.DATE,
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
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  });

  await queryInterface.addIndex('AppearanceAsset', ['profile_id', 'asset_type']);
  await queryInterface.addIndex('AppearanceVariant', ['profile_id', 'publish_state']);
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('AppearanceVariant');
  await queryInterface.dropTable('AppearanceAsset');
  await queryInterface.dropTable('AppearanceProfile');
}
