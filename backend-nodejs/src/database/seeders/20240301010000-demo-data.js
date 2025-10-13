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
}

export async function down({ context: queryInterface }) {
  await queryInterface.bulkDelete('ServiceZone', null, {});
  await queryInterface.bulkDelete('MarketplaceItem', null, {});
  await queryInterface.bulkDelete('Post', null, {});
  await queryInterface.bulkDelete('Service', null, {});
  await queryInterface.bulkDelete('Company', null, {});
  await queryInterface.bulkDelete('User', null, {});
}
