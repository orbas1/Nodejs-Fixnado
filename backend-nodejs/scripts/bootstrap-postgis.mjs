#!/usr/bin/env node
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

loadEnv();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
}

async function ensurePostgis() {
  const connectionString =
    process.env.DB_URL ||
    `postgresql://${encodeURIComponent(requireEnv('DB_USER'))}:${encodeURIComponent(requireEnv('DB_PASSWORD'))}` +
      `@${requireEnv('DB_HOST')}:${process.env.DB_PORT || 5432}/${requireEnv('DB_NAME')}`;

  const client = new Client({
    connectionString,
    ssl:
      process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : false
  });

  await client.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis');
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis_topology');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    const result = await client.query(
      "SELECT installed_version FROM pg_available_extensions WHERE name = 'postgis' AND installed_version IS NOT NULL"
    );

    if (!result.rows.length) {
      throw new Error('PostGIS extension could not be installed. Ensure the database user has rds_superuser privileges.');
    }

    console.log(`PostGIS is ready (version ${result.rows[0].installed_version})`);
  } finally {
    await client.end();
  }
}

ensurePostgis().catch((error) => {
  console.error('Failed to initialise PostGIS', error);
  process.exitCode = 1;
});
