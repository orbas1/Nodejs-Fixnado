#!/usr/bin/env node
import process from 'node:process';
import { createHash } from 'node:crypto';
import pg from 'pg';
import {
  buildTaxonomySeedPlan,
  SEED_RELEASE
} from '../src/database/seeders/20250601010000-marketplace-taxonomy.js';

const { Client } = pg;

function usage() {
  console.log(
    'Usage: node scripts/taxonomy-integrity.mjs [--database-url <url>] [--emit-rollback]\n' +
      'Verifies that the marketplace taxonomy seed data matches the deterministic blueprint.'
  );
}

function parseArgs(argv) {
  const args = {
    databaseUrl: null,
    emitRollback: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--database-url') {
      args.databaseUrl = argv[++i];
    } else if (arg.startsWith('--database-url=')) {
      args.databaseUrl = arg.split('=')[1];
    } else if (arg === '--emit-rollback') {
      args.emitRollback = true;
    } else if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unrecognised argument: ${arg}`);
    }
  }

  return args;
}

function buildConnectionString({ databaseUrl }) {
  if (databaseUrl) {
    return databaseUrl;
  }

  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number.parseInt(process.env.DB_PORT || '5432', 10);
  const database = process.env.DB_NAME || 'fixnado';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || '';

  const credentials = password ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}` : user;
  return `postgresql://${credentials}@${host}:${port}/${database}`;
}

function checksum(values) {
  const hash = createHash('sha256');
  values.forEach((value) => {
    hash.update(JSON.stringify(value));
  });
  return hash.digest('hex');
}

function buildBlueprintMaps() {
  const blueprint = buildTaxonomySeedPlan();
  return {
    domainsByKey: new Map(blueprint.domains.map((domain) => [domain.key, domain])),
    nodesById: new Map(blueprint.nodes.map((node) => [node.id, node])),
    facetsById: new Map(blueprint.facets.map((facet) => [facet.id, facet])),
    assignmentsById: new Map(
      blueprint.nodeFacetAssignments.map((assignment) => [assignment.id, assignment])
    ),
    summary: {
      domainCount: blueprint.domains.length,
      nodeCount: blueprint.nodes.length,
      facetCount: blueprint.facets.length,
      assignmentCount: blueprint.nodeFacetAssignments.length,
      blueprintChecksum: checksum([
        blueprint.domains,
        blueprint.nodes,
        blueprint.facets,
        blueprint.nodeFacetAssignments
      ])
    }
  };
}

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function verify(client) {
  const { domainsByKey, nodesById, facetsById, assignmentsById, summary } = buildBlueprintMaps();

  const domainResult = await client.query(
    `SELECT id, key, metadata FROM marketplace_taxonomy_domains
     WHERE metadata->>'dataset' = 'marketplace-taxonomy'
     ORDER BY key`
  );
  ensure(domainResult.rows.length === summary.domainCount, 'Unexpected number of taxonomy domains.');

  domainResult.rows.forEach((row) => {
    const expected = domainsByKey.get(row.key);
    ensure(Boolean(expected), `Unexpected domain key: ${row.key}`);
    ensure(row.id === expected.id, `Domain ${row.key} has mismatched identifier.`);
    ensure(row.metadata?.seedRelease === SEED_RELEASE, `Domain ${row.key} has incorrect seed release.`);
    ensure(
      row.metadata?.checksum === expected.metadata.checksum,
      `Domain ${row.key} checksum mismatch.`
    );
  });

  const nodeResult = await client.query(
    `SELECT id, domain_id, lineage, slug, metadata
     FROM marketplace_taxonomy_nodes
     WHERE metadata->>'dataset' = 'marketplace-taxonomy'
     ORDER BY lineage`
  );
  ensure(nodeResult.rows.length === summary.nodeCount, 'Unexpected number of taxonomy nodes.');

  nodeResult.rows.forEach((row) => {
    const expected = nodesById.get(row.id);
    ensure(Boolean(expected), `Unexpected taxonomy node: ${row.id}`);
    ensure(row.domain_id === expected.domain_id, `Node ${row.lineage} linked to wrong domain.`);
    ensure(row.slug === expected.slug, `Node ${row.lineage} slug mismatch.`);
    ensure(row.metadata?.checksum === expected.metadata.checksum, `Node ${row.lineage} checksum mismatch.`);
    ensure(
      row.metadata?.seedRelease === SEED_RELEASE,
      `Node ${row.lineage} has incorrect seed release.`
    );
  });

  const facetResult = await client.query(
    `SELECT id, domain_id, key, metadata
     FROM marketplace_taxonomy_facets
     WHERE metadata->>'dataset' = 'marketplace-taxonomy'
     ORDER BY key`
  );
  ensure(facetResult.rows.length === summary.facetCount, 'Unexpected number of taxonomy facets.');

  facetResult.rows.forEach((row) => {
    const expected = facetsById.get(row.id);
    ensure(Boolean(expected), `Unexpected facet: ${row.id}`);
    ensure(row.domain_id === expected.domain_id, `Facet ${row.key} linked to wrong domain.`);
    ensure(row.metadata?.checksum === expected.metadata.checksum, `Facet ${row.key} checksum mismatch.`);
    ensure(row.metadata?.seedRelease === SEED_RELEASE, `Facet ${row.key} has incorrect seed release.`);
  });

  const assignmentResult = await client.query(
    `SELECT id, node_id, facet_id, metadata
     FROM marketplace_taxonomy_node_facets
     WHERE metadata->>'dataset' = 'marketplace-taxonomy'
     ORDER BY id`
  );
  ensure(
    assignmentResult.rows.length === summary.assignmentCount,
    'Unexpected number of taxonomy node facet assignments.'
  );

  assignmentResult.rows.forEach((row) => {
    const expected = assignmentsById.get(row.id);
    ensure(Boolean(expected), `Unexpected assignment id: ${row.id}`);
    ensure(row.node_id === expected.node_id, `Assignment ${row.id} node mismatch.`);
    ensure(row.facet_id === expected.facet_id, `Assignment ${row.id} facet mismatch.`);
    ensure(
      row.metadata?.checksum === expected.metadata.checksum,
      `Assignment ${row.id} checksum mismatch.`
    );
  });

  return {
    domains: domainResult.rows.length,
    nodes: nodeResult.rows.length,
    facets: facetResult.rows.length,
    assignments: assignmentResult.rows.length,
    blueprintChecksum: summary.blueprintChecksum
  };
}

function emitRollbackSql() {
  const sql = `BEGIN;
DELETE FROM marketplace_taxonomy_node_facets WHERE metadata->>'seedRelease' = '${SEED_RELEASE}' AND metadata->>'dataset' = 'marketplace-taxonomy';
DELETE FROM marketplace_taxonomy_facets WHERE metadata->>'seedRelease' = '${SEED_RELEASE}' AND metadata->>'dataset' = 'marketplace-taxonomy';
DELETE FROM marketplace_taxonomy_nodes WHERE metadata->>'seedRelease' = '${SEED_RELEASE}' AND metadata->>'dataset' = 'marketplace-taxonomy';
DELETE FROM marketplace_taxonomy_domains WHERE metadata->>'seedRelease' = '${SEED_RELEASE}' AND metadata->>'dataset' = 'marketplace-taxonomy';
COMMIT;`;
  console.log(sql);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const connectionString = buildConnectionString(args);

  if (args.emitRollback) {
    emitRollbackSql();
    process.exit(0);
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    const summary = await verify(client);
    console.log('✅ Marketplace taxonomy seed verified successfully.');
    console.log(
      `   Domains: ${summary.domains}, Nodes: ${summary.nodes}, Facets: ${summary.facets}, Assignments: ${summary.assignments}`
    );
    console.log(`   Blueprint checksum: ${summary.blueprintChecksum}`);
  } catch (error) {
    console.error('❌ Taxonomy verification failed:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('taxonomy-integrity.mjs')) {
  main();
}
