export async function up({ context: queryInterface, Sequelize }) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    await queryInterface.createTable(
      'marketplace_taxonomy_domains',
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        key: {
          type: Sequelize.STRING(64),
          allowNull: false,
          unique: true
        },
        label: {
          type: Sequelize.STRING(160),
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        steward: {
          type: Sequelize.STRING(160),
          allowNull: true
        },
        revision: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1
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

    await queryInterface.addIndex('marketplace_taxonomy_domains', ['key'], {
      unique: true,
      name: 'marketplace_taxonomy_domains_key_unique',
      transaction
    });

    await queryInterface.createTable(
      'marketplace_taxonomy_nodes',
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        domain_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'marketplace_taxonomy_domains',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        parent_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'marketplace_taxonomy_nodes',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        slug: {
          type: Sequelize.STRING(160),
          allowNull: false
        },
        name: {
          type: Sequelize.STRING(180),
          allowNull: false
        },
        lineage: {
          type: Sequelize.STRING(512),
          allowNull: false
        },
        level: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        summary: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        search_keywords: {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: []
        },
        synonyms: {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: []
        },
        filters: {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: {}
        },
        commercial_tags: {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: []
        },
        regulatory_notes: {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: []
        },
        sort_order: {
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

    await queryInterface.addIndex('marketplace_taxonomy_nodes', ['domain_id'], {
      name: 'marketplace_taxonomy_nodes_domain',
      transaction
    });
    await queryInterface.addIndex('marketplace_taxonomy_nodes', ['slug'], {
      unique: true,
      name: 'marketplace_taxonomy_nodes_slug_unique',
      transaction
    });
    await queryInterface.addIndex('marketplace_taxonomy_nodes', ['lineage'], {
      name: 'marketplace_taxonomy_nodes_lineage',
      transaction
    });
    await queryInterface.addIndex(
      'marketplace_taxonomy_nodes',
      ['domain_id', 'sort_order'],
      {
        name: 'marketplace_taxonomy_nodes_sort_order',
        transaction
      }
    );

    await queryInterface.createTable(
      'marketplace_taxonomy_facets',
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        domain_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'marketplace_taxonomy_domains',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        key: {
          type: Sequelize.STRING(120),
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
        data_type: {
          type: Sequelize.ENUM('string', 'integer', 'decimal', 'boolean', 'enum', 'multi_select'),
          allowNull: false
        },
        unit: {
          type: Sequelize.STRING(32),
          allowNull: true
        },
        config: {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: {}
        },
        is_required: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        is_filterable: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        is_searchable: {
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

    await queryInterface.addIndex(
      'marketplace_taxonomy_facets',
      ['domain_id', 'key'],
      {
        unique: true,
        name: 'marketplace_taxonomy_facets_domain_key_unique',
        transaction
      }
    );

    await queryInterface.createTable(
      'marketplace_taxonomy_node_facets',
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        node_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'marketplace_taxonomy_nodes',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        facet_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'marketplace_taxonomy_facets',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        default_value: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        constraints: {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: {}
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

    await queryInterface.addIndex(
      'marketplace_taxonomy_node_facets',
      ['node_id', 'facet_id'],
      {
        unique: true,
        name: 'marketplace_taxonomy_node_facets_unique',
        transaction
      }
    );

    await queryInterface.createTable(
      'service_taxonomy_assignments',
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        service_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'Service',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        node_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'marketplace_taxonomy_nodes',
            key: 'id'
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE'
        },
        weight: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        is_primary: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
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

    await queryInterface.addIndex(
      'service_taxonomy_assignments',
      ['service_id', 'node_id'],
      {
        unique: true,
        name: 'service_taxonomy_assignments_unique',
        transaction
      }
    );

    await queryInterface.createTable(
      'rental_taxonomy_assignments',
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        rental_asset_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'tool_rental_assets',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        node_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'marketplace_taxonomy_nodes',
            key: 'id'
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE'
        },
        weight: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        is_primary: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
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

    await queryInterface.addIndex(
      'rental_taxonomy_assignments',
      ['rental_asset_id', 'node_id'],
      {
        unique: true,
        name: 'rental_taxonomy_assignments_unique',
        transaction
      }
    );

    await queryInterface.createTable(
      'material_taxonomy_assignments',
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        material_profile_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'ToolSaleProfile',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        node_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'marketplace_taxonomy_nodes',
            key: 'id'
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE'
        },
        weight: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        is_primary: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
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

    await queryInterface.addIndex(
      'material_taxonomy_assignments',
      ['material_profile_id', 'node_id'],
      {
        unique: true,
        name: 'material_taxonomy_assignments_unique',
        transaction
      }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function down({ context: queryInterface, Sequelize }) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    await queryInterface.dropTable('material_taxonomy_assignments', { transaction });
    await queryInterface.dropTable('rental_taxonomy_assignments', { transaction });
    await queryInterface.dropTable('service_taxonomy_assignments', { transaction });
    await queryInterface.dropTable('marketplace_taxonomy_node_facets', { transaction });
    await queryInterface.dropTable('marketplace_taxonomy_facets', { transaction });
    await queryInterface.dropTable('marketplace_taxonomy_nodes', { transaction });
    await queryInterface.dropTable('marketplace_taxonomy_domains', { transaction });

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_marketplace_taxonomy_facets_data_type";', {
        transaction
      });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
