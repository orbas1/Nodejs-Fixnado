import { randomUUID } from 'node:crypto';

const MIGRATION_ACTOR = 'migration:20250605000000';

const documents = [
  {
    slug: 'refund-policy',
    title: 'Fixnado Refund Policy',
    summary: 'Defines how Fixnado evaluates, approves, and settles refunds for services, rentals, and material purchases.',
    heroImageUrl: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=60',
    owner: 'Blackwellen Ltd Finance & Compliance',
    contactEmail: 'refunds@fixnado.com',
    contactPhone: '+44 20 8004 3120',
    contactUrl: 'https://fixnado.com/legal/refund',
    reviewCadence: 'Quarterly',
    metadata: {
      acknowledgement: {
        required: true,
        frequency: 'Per refund escalation',
        channel: 'Finance Console > Refund queue',
        dueWithinHours: 48,
        reminderCadence: 'Every 12 hours until closed'
      },
      audience: [
        { id: 'finance-operations', label: 'Finance operations', description: 'Evaluates refund submissions and settles approved cases.', mandatory: true },
        { id: 'support-leads', label: 'Support leads', description: 'Coordinate evidence gathering and customer notifications.' }
      ],
      governance: {
        policyStore: 'https://governance.fixnado.com/policies/refund-policy.pdf',
        nextReviewDue: '2024-11-01',
        reviewOwners: ['Finance Director', 'Head of Customer Support'],
        escalationContacts: [
          {
            id: 'risk-committee',
            label: 'Risk & Compliance Committee',
            description: 'Escalation path for disputed or high-value refund cases.'
          }
        ],
        auditTrail: [
          {
            id: 'refund-simulation-q1',
            label: 'Q1 settlement simulation',
            url: 'https://governance.fixnado.com/audits/refund-simulation-q1',
            capturedAt: '2024-03-18T10:00:00Z'
          }
        ]
      },
      tags: ['refunds', 'finance', 'consumer-rights']
    },
    sections: [
      {
        id: 'eligibility',
        title: '1. Eligibility criteria',
        summary: 'Outlines when refunds can be requested and approved.',
        body: [
          'Clients may request a refund where service outcomes fail to meet documented scope, statutory workmanship guarantees, or agreed service levels. Requests must include photographic or diagnostic evidence and be submitted within 14 calendar days of job completion unless statutory rights provide a longer window.',
          'Providers must collaborate on remediation attempts prior to refund approval unless the issue presents an immediate safety risk. Where remediation is refused or unsuccessful, Fixnado evaluates the request using inspection reports, communications transcripts, telemetry, and escrow records.'
        ]
      },
      {
        id: 'process',
        title: '2. Refund process and timeline',
        body: [
          'All refund cases are triaged in the Finance Console and assigned to a refund specialist. We acknowledge cases within 24 hours, gather evidence within 72 hours, and target resolution inside five Business Days. Complex cases involving third-party insurers or statutory inspections may take longer; status updates are issued every two Business Days.',
          'Approved refunds are settled from escrow to the original payment method where possible. Where statutory time limits prevent direct refunds, we provide account credits or bank transfers. We maintain artefacts for each case, including evidence, calculations, and approval notes, for a minimum of seven years.'
        ]
      },
      {
        id: 'non-refundable',
        title: '3. Non-refundable scenarios',
        body: [
          'Consumable materials that have been installed or used on-site are not eligible for refunds unless defective. Custom-fabricated materials are refundable only where workmanship is defective or statutory cooling-off periods apply.',
          'Service slots cancelled within 24 hours of the scheduled arrival time may incur late cancellation fees. Providers are compensated for travel and preparatory costs where contracts specify. Exceptions require approval from Finance Operations and Support Leadership.'
        ]
      },
      {
        id: 'client-obligations',
        title: '4. Client responsibilities',
        body: [
          'Clients must maintain accurate contact information, provide safe access, and store materials appropriately while refund investigations take place. We may require access for inspection or remediation attempts before a refund can be approved.',
          'Repeated misuse of the refund programme or fraudulent claims will result in account suspension. We reserve the right to share fraud indicators with payment partners and regulatory bodies as permitted by law.'
        ]
      }
    ],
    attachments: [
      {
        id: 'refund-triage-checklist',
        label: 'Refund triage checklist',
        url: 'https://governance.fixnado.com/templates/refund-triage-checklist.xlsx',
        description: 'Workbook used by finance specialists to evidence approval decisions.',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    ]
  },
  {
    slug: 'community-guidelines',
    title: 'Fixnado Community Guidelines',
    summary: 'Standards for respectful collaboration, marketplace safety, and responsible use of Fixnado tools.',
    heroImageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=60',
    owner: 'Blackwellen Ltd Trust & Safety',
    contactEmail: 'trust@fixnado.com',
    contactPhone: '+44 20 8133 9090',
    contactUrl: 'https://fixnado.com/legal/community-guidelines',
    reviewCadence: 'Bi-annual',
    metadata: {
      acknowledgement: {
        required: true,
        frequency: 'Annual attestation',
        channel: 'Compliance LMS',
        dueWithinHours: 168,
        reminderCadence: 'Weekly until completed',
        evidencePath: 's3://compliance-artifacts/guidelines/attestations/'
      },
      audience: [
        { id: 'providers', label: 'Providers', description: 'Business accounts responsible for listings and bookings.', mandatory: true },
        { id: 'servicemen', label: 'Servicemen', description: 'Field crews delivering services and installations.' },
        { id: 'admins', label: 'Administrators', description: 'Platform moderators and governance teams.' }
      ],
      governance: {
        policyStore: 'https://governance.fixnado.com/policies/community-guidelines.pdf',
        nextReviewDue: '2025-02-15',
        reviewOwners: ['Trust & Safety Lead', 'Head of Customer Experience'],
        escalationContacts: [
          {
            id: 'incident-response',
            label: 'Incident response duty officer',
            description: 'Available 24/7 for escalations involving safety or legal risk.'
          }
        ],
        auditTrail: [
          {
            id: 'moderation-fire-drill',
            label: 'Moderation fire drill playback',
            url: 'https://governance.fixnado.com/audits/moderation-fire-drill',
            capturedAt: '2024-04-12T09:00:00Z'
          },
          {
            id: 'chatwoot-sla-review',
            label: 'Chatwoot SLA review minutes',
            url: 'https://governance.fixnado.com/audits/chatwoot-sla-review',
            capturedAt: '2024-05-10T15:30:00Z'
          }
        ]
      },
      tags: ['community', 'moderation', 'trust-safety']
    },
    sections: [
      {
        id: 'conduct',
        title: '1. Professional conduct',
        body: [
          'Treat clients, crew members, suppliers, and partners with respect. Discriminatory language, harassment, intimidation, or retaliation is not tolerated. Fixnado monitors moderation queues, Chatwoot transcripts, and job feedback for behavioural breaches.',
          'Publish accurate profiles, availability, pricing, and certifications. Misrepresentation, credential misuse, or trading licences across accounts results in immediate suspension and notification to relevant regulators.'
        ]
      },
      {
        id: 'safety',
        title: '2. Safety, safeguarding, and escalation',
        body: [
          'Follow site safety protocols, upload risk assessments for high-hazard jobs, and notify clients before deviations occur. All incidents must be logged in the Safety Register within four hours, and emergency situations must be escalated via the incident hotline (+44 20 3808 1280).',
          'Safeguarding policies apply when vulnerable individuals are present. Crew must carry company identification, avoid lone working breaches, and follow local safeguarding regulations. Suspicious activity is escalated to the Incident Response team immediately.'
        ]
      },
      {
        id: 'platform-use',
        title: '3. Responsible use of Fixnado platforms',
        body: [
          'Use Fixnado tools, APIs, and chat channels for legitimate business purposes only. Automated scraping, credential sharing, or bypassing security controls is prohibited. Monitor integrations for abuse and revoke access if anomalous behaviour is detected.',
          'Content posted to the timeline hub, storefronts, or proposals must comply with intellectual property and advertising laws. Uploads are scanned for malware, hate speech, and prohibited materials. Repeat violations may result in data retention for evidential hand-off to authorities.'
        ]
      },
      {
        id: 'enforcement',
        title: '4. Enforcement and appeals',
        body: [
          'Enforcement actions range from warnings to permanent suspension depending on severity and recurrence. Trust & Safety documents all evidence, decisions, and notifications within the moderation ledger to maintain auditability.',
          'Users may appeal enforcement decisions within 14 days by submitting supporting evidence to trust@fixnado.com. Appeals are reviewed by an independent compliance panel within seven Business Days, and decisions are communicated with a full rationale.'
        ]
      }
    ],
    attachments: [
      {
        id: 'moderation-checklist',
        label: 'Moderation triage checklist',
        url: 'https://governance.fixnado.com/templates/moderation-checklist.pdf',
        description: 'Playbook used by moderators when reviewing incidents, abuse reports, or policy escalations.'
      }
    ]
  },
  {
    slug: 'about-fixnado',
    title: 'About Fixnado',
    summary: 'Explains Fixnado’s mission, governance, sustainability programme, and operating footprint across the UK and EU.',
    heroImageUrl: 'https://images.unsplash.com/photo-1529429617124-aee711fa07a6?auto=format&fit=crop&w=1200&q=60',
    owner: 'Blackwellen Ltd Executive Office',
    contactEmail: 'press@fixnado.com',
    contactPhone: '+44 20 7043 9000',
    contactUrl: 'https://fixnado.com/about',
    reviewCadence: 'Annual',
    metadata: {
      audience: [
        { id: 'press', label: 'Press & media', description: 'Journalists requesting corporate information.' },
        { id: 'partners', label: 'Strategic partners', description: 'Vendors and alliances evaluating Fixnado.' },
        { id: 'candidates', label: 'Candidates', description: 'Prospective employees researching the company.' }
      ],
      governance: {
        policyStore: 'https://governance.fixnado.com/policies/about-fixnado.pdf',
        nextReviewDue: '2025-03-01',
        reviewOwners: ['Chief Operating Officer', 'VP Communications']
      },
      tags: ['company', 'mission', 'sustainability']
    },
    sections: [
      {
        id: 'mission',
        title: '1. Mission and impact',
        body: [
          'Fixnado connects enterprises, field service providers, and specialist crews through a single marketplace that manages sourcing, scheduling, payments, compliance, and customer experience. Our mission is to modernise repair and maintenance supply chains so projects can be delivered safely, transparently, and sustainably.',
          'We serve facilities management companies, utilities, construction firms, housing associations, and large enterprises who need reliable field services at scale. Fixnado crews deliver thousands of repairs each month with SLA adherence above 96% and a first-time fix rate above 89%.'
        ]
      },
      {
        id: 'governance',
        title: '2. Governance and leadership',
        body: [
          'Fixnado is operated by Blackwellen Ltd, a company registered in England and Wales (company number 13847592). The board oversees strategy, compliance, and risk through quarterly governance reviews, while executive committees manage operations, technology, trust & safety, and finance.',
          'We maintain ISO/IEC 27001-aligned security controls, publish independent penetration tests annually, and operate a privacy office staffed with GDPR specialists. Advisory councils representing providers, enterprise customers, and crew members review product roadmaps to ensure alignment with the communities we serve.'
        ]
      },
      {
        id: 'sustainability',
        title: '3. Sustainability commitments',
        body: [
          'Fixnado offsets operational emissions and provides emissions dashboards for enterprise customers. Our logistics partners use electric vehicles for 62% of urban callouts, and we incentivise sustainable materials through marketplace badges and analytics.',
          'We collaborate with manufacturers to refurbish or responsibly recycle materials removed during jobs. Our circular economy programme currently diverts 480 tonnes of waste from landfill per year, with targets to double this impact by 2026.'
        ]
      },
      {
        id: 'footprint',
        title: '4. Operating footprint',
        body: [
          'Fixnado operates primarily across the United Kingdom and Republic of Ireland with expansion projects underway for Benelux and the Nordics. Regional support hubs in London, Manchester, and Glasgow provide 24/7 coverage with multilingual agents.',
          'Our technology stack runs on ISO 27001-certified infrastructure with availability targets above 99.9%. Customers access dashboards, APIs, and the mobile app to manage listings, crew schedules, payments, analytics, and compliance obligations.'
        ]
      }
    ]
  },
  {
    slug: 'fixnado-faq',
    title: 'Fixnado Frequently Asked Questions',
    summary: 'Answers common questions from clients, providers, and crew about onboarding, payments, compliance, and support.',
    heroImageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=60',
    owner: 'Blackwellen Ltd Customer Experience',
    contactEmail: 'support@fixnado.com',
    contactPhone: '+44 20 4525 8900',
    contactUrl: 'https://fixnado.com/faq',
    reviewCadence: 'Monthly',
    metadata: {
      audience: [
        { id: 'clients', label: 'Clients', description: 'Organisations booking Fixnado services.' },
        { id: 'crew', label: 'Crew members', description: 'Technicians and crew leaders fulfilling work orders.' }
      ],
      tags: ['faq', 'support', 'onboarding']
    },
    sections: [
      {
        id: 'onboarding',
        title: 'Onboarding and verification',
        kind: 'paragraphs',
        body: [
          'How do providers join Fixnado? Providers submit company information, insurances, trade qualifications, references, and consent to background checks. The onboarding portal guides document submission and integrates with our KYC partners for identity verification. Approval typically completes within five Business Days.',
          'What verification do crew members need? Crew members upload ID, certifications, and skills matrices via the Serviceman app. We run DBS and right-to-work checks where required. Crew can monitor progress and receive notifications when badges expire.'
        ]
      },
      {
        id: 'payments',
        title: 'Payments and escrow',
        body: [
          'When are providers paid? Completed jobs move into escrow review for up to two Business Days. Approved invoices are released on the next daily settlement run. Providers can track payouts, deductions, and statements via the Finance dashboard or API.',
          'Do clients pre-pay for services? Enterprise clients receive consolidated invoicing aligned to their purchase order cadence. Residential and SME clients pre-authorise cards or bank payments which are captured when milestones are completed. Escrow protects both parties until handover is confirmed.'
        ]
      },
      {
        id: 'support',
        title: 'Support and escalation',
        body: [
          'How do I contact support? The Chatwoot bubble inside the dashboard provides 24/7 access to live agents. You can also email support@fixnado.com or call +44 20 4525 8900. Enterprise accounts receive dedicated success managers and escalation runbooks.',
          'What happens if something goes wrong on-site? Log incidents through the Support Centre or mobile app. Our incident desk coordinates remediation, insurance, and communications. Serious issues trigger our Incident Response playbook with executive oversight.'
        ]
      },
      {
        id: 'compliance',
        title: 'Compliance and privacy',
        body: [
          'How do individuals submit data requests? Users can submit requests under Legal & Privacy settings or email privacy@fixnado.com. We verify identity, assign a case owner, and complete requests within 30 days.',
          'Where can I find policies and legal documents? All policies are published under fixnado.com/legal with version history, contact channels, and effective dates. Administrators can manage acknowledgements and training completion inside the Compliance dashboard.'
        ]
      }
    ]
  }
];

function buildContentPayload(documentDefinition) {
  const { metadata, sections, attachments } = documentDefinition;
  return {
    hero: {
      eyebrow: 'Legal library',
      title: documentDefinition.title,
      summary: documentDefinition.summary
    },
    contact: {
      email: documentDefinition.contactEmail,
      phone: documentDefinition.contactPhone,
      url: documentDefinition.contactUrl
    },
    metadata: {
      reviewCadence: documentDefinition.reviewCadence,
      owner: documentDefinition.owner,
      ...(metadata || {})
    },
    sections,
    attachments: attachments || []
  };
}

export async function up({ context: queryInterface, Sequelize }) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const now = new Date();

    for (const documentDefinition of documents) {
      const documentId = randomUUID();
      const versionId = randomUUID();

      await queryInterface.bulkInsert(
        'LegalDocuments',
        [
          {
            id: documentId,
            slug: documentDefinition.slug,
            title: documentDefinition.title,
            summary: documentDefinition.summary,
            hero_image_url: documentDefinition.heroImageUrl,
            owner: documentDefinition.owner,
            contact_email: documentDefinition.contactEmail,
            contact_phone: documentDefinition.contactPhone,
            contact_url: documentDefinition.contactUrl,
            review_cadence: documentDefinition.reviewCadence,
            created_by: MIGRATION_ACTOR,
            updated_by: MIGRATION_ACTOR,
            created_at: now,
            updated_at: now
          }
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'LegalDocumentVersions',
        [
          {
            id: versionId,
            document_id: documentId,
            version: 1,
            status: 'published',
            change_notes: 'Launch readiness publication',
            content: buildContentPayload(documentDefinition),
            attachments: documentDefinition.attachments || [],
            created_by: MIGRATION_ACTOR,
            published_by: MIGRATION_ACTOR,
            effective_at: now,
            published_at: now,
            created_at: now,
            updated_at: now
          }
        ],
        { transaction }
      );

      await queryInterface.bulkUpdate(
        'LegalDocuments',
        { current_version_id: versionId },
        { id: documentId },
        { transaction }
      );
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function down({ context: queryInterface, Sequelize }) {
  const transaction = await queryInterface.sequelize.transaction();
  const { Op } = Sequelize;
  try {
    const slugs = documents.map((document) => document.slug);

    const [rows] = await queryInterface.sequelize.query(
      'SELECT id FROM "LegalDocuments" WHERE slug IN (:slugs)',
      { replacements: { slugs }, transaction }
    );

    const documentIds = rows.map((row) => row.id);

    if (documentIds.length > 0) {
      await queryInterface.bulkDelete(
        'LegalDocumentVersions',
        { document_id: { [Op.in]: documentIds } },
        { transaction }
      );
    }

    await queryInterface.bulkDelete(
      'LegalDocuments',
      { slug: { [Op.in]: slugs } },
      { transaction }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
