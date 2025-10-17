export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('serviceman_website_preferences', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    persona: {
      type: Sequelize.STRING(60),
      allowNull: false,
      unique: true
    },
    hero_title: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    hero_subtitle: {
      type: Sequelize.STRING(240),
      allowNull: true
    },
    hero_tagline: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    hero_image_url: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    about_content: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    primary_color: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: '#1D4ED8'
    },
    accent_color: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: '#0EA5E9'
    },
    theme: {
      type: Sequelize.ENUM('light', 'dark', 'system'),
      allowNull: false,
      defaultValue: 'system'
    },
    layout: {
      type: Sequelize.ENUM('spotlight', 'columns', 'split'),
      allowNull: false,
      defaultValue: 'spotlight'
    },
    logo_url: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    gallery_media: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    contact_email: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    contact_phone: {
      type: Sequelize.STRING(60),
      allowNull: true
    },
    emergency_phone: {
      type: Sequelize.STRING(60),
      allowNull: true
    },
    booking_url: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    service_areas: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    service_tags: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    contact_hours: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    languages: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    allow_online_booking: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    enable_enquiry_form: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    show_travel_radius: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    travel_radius_km: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 25
    },
    average_response_minutes: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 90
    },
    emergency_support: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    highlights: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    testimonials: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    featured_projects: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    seo_title: {
      type: Sequelize.STRING(180),
      allowNull: false
    },
    seo_description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    seo_keywords: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    seo_indexable: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    seo_meta_image_url: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    allowed_roles: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: ['serviceman']
    },
    social_links: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    call_to_action_label: {
      type: Sequelize.STRING(120),
      allowNull: false,
      defaultValue: 'Book a crew'
    },
    call_to_action_url: {
      type: Sequelize.STRING(255),
      allowNull: true
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
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('serviceman_website_preferences');
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_serviceman_website_preferences_theme";'
  );
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_serviceman_website_preferences_layout";'
  );
}
