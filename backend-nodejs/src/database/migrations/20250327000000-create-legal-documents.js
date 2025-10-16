import { randomUUID } from 'node:crypto';

function seedContent({ heroTitle, heroEyebrow, heroSummary, contactEmail, sections }) {
  return {
    hero: {
      eyebrow: heroEyebrow,
      title: heroTitle,
      summary: heroSummary
    },
    contact: {
      email: contactEmail,
      url: 'https://fixnado.com/legal'
    },
    sections: sections.map((section, index) => ({
      id: section.id ?? `section-${index + 1}`,
      anchor: section.anchor ?? section.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') ?? `section-${index + 1}`,
      title: section.title,
      body: section.body,
      kind: section.kind ?? 'paragraphs'
    }))
  };
}

export async function up({ context: queryInterface, Sequelize }) {
  await queryInterface.createTable('LegalDocuments', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    slug: {
      type: Sequelize.STRING(64),
      allowNull: false,
      unique: true
    },
    title: {
      type: Sequelize.STRING(160),
      allowNull: false
    },
    summary: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    hero_image_url: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    owner: {
      type: Sequelize.STRING(160),
      allowNull: false,
      defaultValue: 'Blackwellen Ltd Privacy Office'
    },
    contact_email: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    contact_phone: {
      type: Sequelize.STRING(40),
      allowNull: true
    },
    review_cadence: {
      type: Sequelize.STRING(80),
      allowNull: true
    },
    current_version_id: {
      type: Sequelize.UUID,
      allowNull: true
    },
    created_by: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    updated_by: {
      type: Sequelize.STRING(160),
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

  await queryInterface.createTable('LegalDocumentVersions', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    document_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'LegalDocuments', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    version: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    change_notes: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    content: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    attachments: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    },
    created_by: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    published_by: {
      type: Sequelize.STRING(160),
      allowNull: true
    },
    effective_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    published_at: {
      type: Sequelize.DATE,
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

  await queryInterface.addConstraint('LegalDocumentVersions', {
    type: 'unique',
    fields: ['document_id', 'version'],
    name: 'legal_document_versions_document_version_unique'
  });

  await queryInterface.addConstraint('LegalDocuments', {
    fields: ['current_version_id'],
    type: 'foreign key',
    name: 'legal_documents_current_version_fk',
    references: {
      table: 'LegalDocumentVersions',
      field: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });

  const now = new Date();
  const termsId = randomUUID();
  const privacyId = randomUUID();

  await queryInterface.bulkInsert('LegalDocuments', [
    {
      id: termsId,
      slug: 'terms',
      title: 'Fixnado Terms & Conditions',
      summary: 'Binding agreement for customers, providers, and enterprise partners delivering services via Fixnado.',
      hero_image_url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=60',
      owner: 'Blackwellen Ltd Legal Team',
      contact_email: 'legal@fixnado.com',
      contact_phone: '+44 20 7946 0955',
      review_cadence: 'Quarterly',
      created_by: 'system-seed',
      updated_by: 'system-seed',
      created_at: now,
      updated_at: now
    },
    {
      id: privacyId,
      slug: 'privacy',
      title: 'Fixnado Privacy Policy',
      summary: 'Explains how Fixnado collects, uses, and safeguards personal data across all experiences.',
      hero_image_url: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=60',
      owner: 'Blackwellen Ltd Privacy Office',
      contact_email: 'privacy@fixnado.com',
      contact_phone: '+44 20 8068 7311',
      review_cadence: 'Bi-annual',
      created_by: 'system-seed',
      updated_by: 'system-seed',
      created_at: now,
      updated_at: now
    }
  ]);

  const termsContent = seedContent({
    heroTitle: 'Service terms that balance agility and governance',
    heroEyebrow: 'Legal management',
    heroSummary:
      'These terms govern all services delivered through Fixnado. They capture platform obligations, provider expectations, and customer responsibilities.',
    contactEmail: 'legal@fixnado.com',
    sections: [
      {
        id: 'scope',
        title: '1. Scope of agreement',
        body: [
          'Fixnado connects vetted service providers with enterprise and residential customers. By creating an account or booking services, you agree to these Terms.',
          'Where a master services agreement exists, that contract prevails in the event of conflict. These Terms supplement any service-specific schedules or statements of work.'
        ]
      },
      {
        id: 'providers',
        title: '2. Provider obligations',
        body: [
          'Providers must ensure personnel hold valid trade certifications, follow local regulations, and comply with Fixnado safety policies. Identification must be supplied on request.',
          'Insurance levels must meet or exceed published requirements. Evidence of cover must be uploaded before new work orders are accepted.'
        ]
      },
      {
        id: 'customers',
        title: '3. Customer responsibilities',
        body: [
          'Customers agree to provide accurate site information, ensure safe access, and settle invoices within agreed payment terms.',
          'Any hazardous materials or special access conditions must be disclosed prior to attendance to allow for compliant planning.'
        ]
      }
    ]
  });

  const privacyContent = seedContent({
    heroTitle: 'Protecting privacy across every Fixnado experience',
    heroEyebrow: 'Privacy policy',
    heroSummary:
      'We are transparent about the data we process, why we process it, and the controls available to you. This policy applies to all Fixnado services.',
    contactEmail: 'privacy@fixnado.com',
    sections: [
      {
        id: 'collection',
        title: '1. Data we collect',
        body: [
          'We collect contact details, booking records, crew telemetry, and communications to deliver and improve services.',
          'Sensitive data is collected only where necessary for safety, regulatory compliance, or if you provide explicit consent.'
        ]
      },
      {
        id: 'use',
        title: '2. How we use data',
        body: [
          'Data is used to coordinate services, process payments, monitor compliance, and improve operations. Automated processing is always supervised by humans.',
          'Marketing communications are sent based on consent or legitimate interests, and you may opt out at any time.'
        ]
      },
      {
        id: 'rights',
        title: '3. Your rights',
        body: [
          'You may request access, correction, deletion, or restriction of your personal data. Contact privacy@fixnado.com to exercise these rights.',
          'We respond to verifiable requests within the legally required timeframe and maintain an appeals process for contested outcomes.'
        ]
      }
    ]
  });

  const versionRows = [
    {
      id: randomUUID(),
      document_id: termsId,
      version: 1,
      status: 'published',
      change_notes: 'Initial policy import',
      content: termsContent,
      attachments: [],
      created_by: 'system-seed',
      published_by: 'system-seed',
      effective_at: now,
      published_at: now,
      created_at: now,
      updated_at: now
    },
    {
      id: randomUUID(),
      document_id: privacyId,
      version: 1,
      status: 'published',
      change_notes: 'Initial policy import',
      content: privacyContent,
      attachments: [],
      created_by: 'system-seed',
      published_by: 'system-seed',
      effective_at: now,
      published_at: now,
      created_at: now,
      updated_at: now
    }
  ];

  await queryInterface.bulkInsert('LegalDocumentVersions', versionRows);

  await queryInterface.bulkUpdate(
    'LegalDocuments',
    { current_version_id: versionRows[0].id },
    { id: termsId }
  );

  await queryInterface.bulkUpdate(
    'LegalDocuments',
    { current_version_id: versionRows[1].id },
    { id: privacyId }
  );
}

export async function down({ context: queryInterface, Sequelize }) {
  await queryInterface.removeConstraint('LegalDocuments', 'legal_documents_current_version_fk');
  await queryInterface.bulkDelete('LegalDocumentVersions', null, {});
  await queryInterface.bulkDelete('LegalDocuments', null, {});
  await queryInterface.dropTable('LegalDocumentVersions');
  await queryInterface.dropTable('LegalDocuments');
  await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_LegalDocumentVersions_status\";");
}
