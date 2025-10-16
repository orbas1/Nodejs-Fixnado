import crypto from 'node:crypto';
import slugify from 'slugify';

export async function up({ context: queryInterface, Sequelize }) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    await queryInterface.createTable(
      'service_categories',
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        slug: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        icon: {
          type: Sequelize.STRING,
          allowNull: true
        },
        accent_colour: {
          type: Sequelize.STRING,
          allowNull: true
        },
        parent_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'service_categories',
            key: 'id'
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        ordering: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        metadata: {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: {}
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
      },
      { transaction }
    );

    await queryInterface.addIndex('service_categories', ['slug'], {
      unique: true,
      name: 'service_categories_slug_unique',
      transaction
    });

    await queryInterface.addIndex('service_categories', ['is_active', 'ordering'], {
      name: 'service_categories_activity_order_idx',
      transaction
    });

    await queryInterface.addColumn(
      'Service',
      'slug',
      {
        type: Sequelize.STRING,
        allowNull: true
      },
      { transaction }
    );

    await queryInterface.addColumn(
      'Service',
      'category_id',
      {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'service_categories',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      { transaction }
    );

    await queryInterface.addColumn(
      'Service',
      'status',
      {
        type: Sequelize.ENUM('draft', 'published', 'paused', 'archived'),
        allowNull: false,
        defaultValue: 'draft'
      },
      { transaction }
    );

    await queryInterface.addColumn(
      'Service',
      'visibility',
      {
        type: Sequelize.ENUM('private', 'restricted', 'public'),
        allowNull: false,
        defaultValue: 'restricted'
      },
      { transaction }
    );

    await queryInterface.addColumn(
      'Service',
      'kind',
      {
        type: Sequelize.ENUM('standard', 'package'),
        allowNull: false,
        defaultValue: 'standard'
      },
      { transaction }
    );

    await queryInterface.addColumn(
      'Service',
      'hero_image_url',
      {
        type: Sequelize.STRING,
        allowNull: true
      },
      { transaction }
    );

    await queryInterface.addColumn(
      'Service',
      'gallery',
      {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      { transaction }
    );

    await queryInterface.addColumn(
      'Service',
      'coverage',
      {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      { transaction }
    );

    await queryInterface.addColumn(
      'Service',
      'tags',
      {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      { transaction }
    );

    await queryInterface.addColumn(
      'Service',
      'metadata',
      {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      { transaction }
    );

    const [services] = await queryInterface.sequelize.query(
      'SELECT id, title FROM "Service"',
      { transaction }
    );

    // Ensure existing services receive stable slugs before enforcing constraints
    // eslint-disable-next-line no-restricted-syntax
    for (const service of services) {
      const baseSlug = service.title
        ? slugify(service.title, { lower: true, strict: true })
        : '';
      const slug = baseSlug || crypto.randomUUID();
      // eslint-disable-next-line no-await-in-loop
      await queryInterface.sequelize.query(
        'UPDATE "Service" SET slug = :slug WHERE id = :id',
        {
          replacements: { slug, id: service.id },
          transaction
        }
      );
    }

    await queryInterface.changeColumn(
      'Service',
      'slug',
      {
        type: Sequelize.STRING,
        allowNull: false
      },
      { transaction }
    );

    await queryInterface.addIndex(
      'Service',
      ['slug'],
      {
        unique: true,
        name: 'service_slug_unique',
        transaction
      }
    );

    await queryInterface.addIndex(
      'Service',
      ['status', 'visibility'],
      {
        name: 'service_status_visibility_idx',
        transaction
      }
    );

    await queryInterface.addIndex(
      'Service',
      ['category_id'],
      {
        name: 'service_category_id_idx',
        transaction
      }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function down({ context: queryInterface }) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    await queryInterface.removeIndex('Service', 'service_category_id_idx', { transaction });
    await queryInterface.removeIndex('Service', 'service_status_visibility_idx', { transaction });
    await queryInterface.removeIndex('Service', 'service_slug_unique', { transaction });

    await queryInterface.removeColumn('Service', 'metadata', { transaction });
    await queryInterface.removeColumn('Service', 'tags', { transaction });
    await queryInterface.removeColumn('Service', 'coverage', { transaction });
    await queryInterface.removeColumn('Service', 'gallery', { transaction });
    await queryInterface.removeColumn('Service', 'hero_image_url', { transaction });
    await queryInterface.removeColumn('Service', 'kind', { transaction });
    await queryInterface.removeColumn('Service', 'visibility', { transaction });
    await queryInterface.removeColumn('Service', 'status', { transaction });
    await queryInterface.removeColumn('Service', 'category_id', { transaction });
    await queryInterface.removeColumn('Service', 'slug', { transaction });

    await queryInterface.dropTable('service_categories', { transaction });

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Service_status"', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Service_visibility"', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Service_kind"', { transaction });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
