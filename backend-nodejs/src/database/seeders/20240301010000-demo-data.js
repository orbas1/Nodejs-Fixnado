export async function up({ context: queryInterface }) {
  const userId = '11111111-1111-1111-1111-111111111111';
  const providerId = '22222222-2222-2222-2222-222222222222';
  const companyId = '33333333-3333-3333-3333-333333333333';

  await queryInterface.bulkInsert('User', [
    {
      id: userId,
      first_name: 'Avery',
      last_name: 'Stone',
      email: 'avery@fixnado.com',
      password_hash: '$2b$10$5eB0j3M0uD8M8tZq9nK6xexm3nXrCk6GUAn6gHgNsx3Rp3XIanFk2',
      type: 'user',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: providerId,
      first_name: 'Jordan',
      last_name: 'Miles',
      email: 'jordan@fixnado.com',
      password_hash: '$2b$10$5eB0j3M0uD8M8tZq9nK6xexm3nXrCk6GUAn6gHgNsx3Rp3XIanFk2',
      type: 'servicemen',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  await queryInterface.bulkInsert('Company', [
    {
      id: companyId,
      user_id: providerId,
      legal_structure: 'sole trader',
      contact_name: 'Jordan Miles',
      contact_email: 'jordan@fixnado.com',
      service_regions: 'Downtown, Coastal',
      marketplace_intent: 'Smart home equipment rentals',
      verified: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  await queryInterface.bulkInsert('Service', [
    {
      id: '44444444-4444-4444-4444-444444444444',
      provider_id: providerId,
      company_id: companyId,
      title: 'Smart home installation',
      description: 'Full installation and configuration for smart home devices',
      category: 'Home services',
      price: 180.0,
      currency: 'USD',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  await queryInterface.bulkInsert('Post', [
    {
      id: '55555555-5555-5555-5555-555555555555',
      user_id: userId,
      title: 'Need urgent plumbing fix',
      description: 'Pipe burst in kitchen, need help within 2 hours',
      budget: '$200',
      budget_amount: 200,
      budget_currency: 'USD',
      category: 'Plumbing',
      images: JSON.stringify([
        'https://cdn.fixnado.com/jobs/55555555-5555-5555-5555-555555555555/1.jpg',
        'https://cdn.fixnado.com/jobs/55555555-5555-5555-5555-555555555555/2.jpg'
      ]),
      metadata: JSON.stringify({
        scope: 'Kitchen burst pipe',
        accessNotes: 'Concierge will provide access, parking available at rear entrance.'
      }),
      location: 'San Francisco, CA',
      zone_id: '77777777-7777-7777-7777-777777777777',
      allow_out_of_zone: true,
      status: 'open',
      bid_deadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  await queryInterface.bulkInsert('MarketplaceItem', [
    {
      id: '66666666-6666-6666-6666-666666666666',
      company_id: companyId,
      title: 'Thermal imaging camera',
      description: 'Weekend rental with training session',
      price_per_day: 95.0,
      purchase_price: 1200.0,
      location: 'San Diego, CA',
      availability: 'rent',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  await queryInterface.bulkInsert('ServiceZone', [
    {
      id: '77777777-7777-7777-7777-777777777777',
      company_id: companyId,
      name: 'Downtown Core',
      boundary: JSON.stringify({
        type: 'Polygon',
        coordinates: [
          [
            [-122.402, 37.792],
            [-122.405, 37.784],
            [-122.394, 37.782],
            [-122.389, 37.789],
            [-122.402, 37.792]
          ]
        ]
      }),
      centroid: JSON.stringify({ type: 'Point', coordinates: [-122.3975, 37.7875] }),
      bounding_box: JSON.stringify({
        west: -122.405,
        south: 37.782,
        east: -122.389,
        north: 37.792
      }),
      metadata: JSON.stringify({ municipality: 'San Francisco', zoneCode: 'DTC-01' }),
      demand_level: 'high',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  await queryInterface.bulkInsert('ComplianceControl', [
    {
      id: '88888888-8888-8888-8888-888888888888',
      company_id: companyId,
      owner_team: 'Compliance Ops',
      title: 'Vendor security review',
      category: 'vendor',
      control_type: 'detective',
      status: 'monitoring',
      review_frequency: 'quarterly',
      next_review_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      last_review_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      owner_email: 'governance@fixnado.com',
      evidence_required: true,
      evidence_location: 's3://fixnado-compliance/vendor-security',
      documentation_url: 'https://docs.fixnado.com/compliance/vendor-security',
      escalation_policy: 'Escalate to compliance director after 48h overdue',
      notes: 'Ensure SOC 2 Type II letters are collected before renewal.',
      tags: ['vendor', 'security', 'soc2'],
      watchers: ['ciso@fixnado.com', 'governance@fixnado.com'],
      metadata: {
        evidenceCheckpoints: [
          {
            id: 'evidence-soc2',
            name: 'SOC 2 report upload',
            requirement: 'Upload SOC 2 Type II letter',
            dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            owner: 'Vendor success',
            status: 'pending'
          }
        ],
        exceptionReviews: [
          {
            id: 'exception-vendor',
            summary: 'Legacy supplier with compensating control',
            owner: 'Compliance Ops',
            status: 'monitoring',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      },
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '99999999-9999-9999-9999-999999999999',
      company_id: companyId,
      owner_team: 'Compliance Ops',
      title: 'Incident response plan drill',
      category: 'procedure',
      control_type: 'corrective',
      status: 'active',
      review_frequency: 'semiannual',
      next_review_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      last_review_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      owner_email: 'ir@fixnado.com',
      evidence_required: true,
      evidence_location: 's3://fixnado-compliance/ir-drills',
      documentation_url: 'https://docs.fixnado.com/compliance/incident-response',
      escalation_policy: 'Notify security leadership when drill is overdue',
      notes: 'Rotate drill facilitators per half to broaden ownership.',
      tags: ['security', 'training'],
      watchers: ['securitylead@fixnado.com'],
      metadata: {
        evidenceCheckpoints: [
          {
            id: 'evidence-report',
            name: 'Drill report uploaded',
            requirement: 'Attach post-mortem PDF',
            owner: 'Security ops',
            status: 'pending'
          }
        ],
        exceptionReviews: []
      },
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}

export async function down({ context: queryInterface }) {
  await queryInterface.bulkDelete('ComplianceControl', null, {});
  await queryInterface.bulkDelete('ServiceZone', null, {});
  await queryInterface.bulkDelete('MarketplaceItem', null, {});
  await queryInterface.bulkDelete('Post', null, {});
  await queryInterface.bulkDelete('Service', null, {});
  await queryInterface.bulkDelete('Company', null, {});
  await queryInterface.bulkDelete('User', null, {});
}
