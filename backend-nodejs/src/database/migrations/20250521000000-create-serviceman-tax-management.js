'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('serviceman_tax_profiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      serviceman_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      filing_status: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'sole_trader'
      },
      residency_country: {
        type: Sequelize.STRING(2),
        allowNull: true
      },
      residency_region: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      vat_registered: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      vat_number: {
        type: Sequelize.STRING(32),
        allowNull: true
      },
      utr_number: {
        type: Sequelize.STRING(32),
        allowNull: true
      },
      company_number: {
        type: Sequelize.STRING(32),
        allowNull: true
      },
      tax_advisor_name: {
        type: Sequelize.STRING(160),
        allowNull: true
      },
      tax_advisor_email: {
        type: Sequelize.STRING(160),
        allowNull: true
      },
      tax_advisor_phone: {
        type: Sequelize.STRING(48),
        allowNull: true
      },
      remittance_cycle: {
        type: Sequelize.STRING(24),
        allowNull: false,
        defaultValue: 'monthly'
      },
      withholding_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      last_filing_submitted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      next_deadline_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.createTable('serviceman_tax_filings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      serviceman_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      tax_year: {
        type: Sequelize.STRING(16),
        allowNull: false
      },
      period: {
        type: Sequelize.STRING(32),
        allowNull: true
      },
      filing_type: {
        type: Sequelize.STRING(32),
        allowNull: true
      },
      submission_method: {
        type: Sequelize.STRING(32),
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(24),
        allowNull: false,
        defaultValue: 'draft'
      },
      due_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      amount_due: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      amount_paid: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'GBP'
      },
      reference: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      documents: {
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
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.createTable('serviceman_tax_tasks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      serviceman_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      filing_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'serviceman_tax_filings',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(160),
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(24),
        allowNull: false,
        defaultValue: 'planned'
      },
      priority: {
        type: Sequelize.STRING(16),
        allowNull: false,
        defaultValue: 'normal'
      },
      due_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      assigned_to: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      instructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      checklist: {
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
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.createTable('serviceman_tax_documents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      serviceman_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      filing_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'serviceman_tax_filings',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(160),
        allowNull: false
      },
      document_type: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'supporting'
      },
      status: {
        type: Sequelize.STRING(24),
        allowNull: false,
        defaultValue: 'active'
      },
      file_url: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      thumbnail_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      uploaded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('serviceman_tax_filings', ['serviceman_id']);
    await queryInterface.addIndex('serviceman_tax_filings', ['status']);
    await queryInterface.addIndex('serviceman_tax_filings', ['tax_year']);

    await queryInterface.addIndex('serviceman_tax_tasks', ['serviceman_id']);
    await queryInterface.addIndex('serviceman_tax_tasks', ['status']);
    await queryInterface.addIndex('serviceman_tax_tasks', ['due_at']);

    await queryInterface.addIndex('serviceman_tax_documents', ['serviceman_id']);
    await queryInterface.addIndex('serviceman_tax_documents', ['document_type']);
    await queryInterface.addIndex('serviceman_tax_documents', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('serviceman_tax_documents', ['status']);
    await queryInterface.removeIndex('serviceman_tax_documents', ['document_type']);
    await queryInterface.removeIndex('serviceman_tax_documents', ['serviceman_id']);

    await queryInterface.removeIndex('serviceman_tax_tasks', ['due_at']);
    await queryInterface.removeIndex('serviceman_tax_tasks', ['status']);
    await queryInterface.removeIndex('serviceman_tax_tasks', ['serviceman_id']);

    await queryInterface.removeIndex('serviceman_tax_filings', ['tax_year']);
    await queryInterface.removeIndex('serviceman_tax_filings', ['status']);
    await queryInterface.removeIndex('serviceman_tax_filings', ['serviceman_id']);

    await queryInterface.dropTable('serviceman_tax_documents');
    await queryInterface.dropTable('serviceman_tax_tasks');
    await queryInterface.dropTable('serviceman_tax_filings');
    await queryInterface.dropTable('serviceman_tax_profiles');
  }
};
