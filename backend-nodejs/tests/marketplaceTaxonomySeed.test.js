import { describe, it, expect } from 'vitest';
import {
  TAXONOMY_DEFINITIONS,
  buildTaxonomySeedPlan,
  SEED_RELEASE
} from '../src/database/seeders/20250601010000-marketplace-taxonomy.js';

const plan = buildTaxonomySeedPlan();

function unique(values) {
  return new Set(values).size === values.length;
}

describe('marketplace taxonomy seed blueprint', () => {
  it('defines three primary domains with deterministic metadata', () => {
    expect(plan.domains).toHaveLength(3);
    const keys = plan.domains.map((domain) => domain.key);
    expect(unique(keys)).toBe(true);
    plan.domains.forEach((domainDefinition) => {
      expect(domainDefinition.metadata.seedRelease).toBe(SEED_RELEASE);
      expect(domainDefinition.metadata.dataset).toBe('marketplace-taxonomy');
      expect(typeof domainDefinition.metadata.checksum).toBe('string');
      expect(domainDefinition.metadata.checksum).toHaveLength(64);
      expect(domainDefinition.label.length).toBeGreaterThan(0);
    });
  });

  it('generates hierarchical nodes for each domain lineage', () => {
    expect(plan.nodes.length).toBeGreaterThan(0);
    const ids = plan.nodes.map((node) => node.id);
    expect(unique(ids)).toBe(true);

    plan.nodes.forEach((node) => {
      expect(node.metadata.seedRelease).toBe(SEED_RELEASE);
      expect(node.metadata.dataset).toBe('marketplace-taxonomy');
      expect(node.lineage.startsWith(`${node.metadata.domainKey}/`)).toBe(true);
      expect(node.slug.startsWith(`${node.metadata.domainKey}-`)).toBe(true);
      expect(Array.isArray(node.search_keywords)).toBe(true);
      expect(Array.isArray(node.commercial_tags)).toBe(true);
      expect(typeof node.filters).toBe('object');
    });

    const nodesByDomain = plan.nodes.reduce((acc, node) => {
      acc[node.metadata.domainKey] = acc[node.metadata.domainKey] || [];
      acc[node.metadata.domainKey].push(node);
      return acc;
    }, {});

    Object.values(nodesByDomain).forEach((domainNodes) => {
      expect(domainNodes.some((node) => node.level > 1)).toBe(true);
    });
  });

  it('ensures facet definitions align to nodes with checksum metadata', () => {
    expect(plan.facets.length).toBeGreaterThan(0);
    const facetIds = plan.facets.map((facet) => facet.id);
    expect(unique(facetIds)).toBe(true);

    const nodeIds = new Set(plan.nodes.map((node) => node.id));

    plan.nodeFacetAssignments.forEach((assignment) => {
      expect(nodeIds.has(assignment.node_id)).toBe(true);
      expect(facetIds.includes(assignment.facet_id)).toBe(true);
      expect(assignment.metadata.seedRelease).toBe(SEED_RELEASE);
      expect(assignment.metadata.dataset).toBe('marketplace-taxonomy');
      if (assignment.default_value) {
        expect(['string', 'number', 'boolean', 'object']).toContain(typeof assignment.default_value);
      }
    });
  });

  it('keeps the blueprint definition immutable for verification scripts', () => {
    expect(Object.isFrozen(TAXONOMY_DEFINITIONS)).toBe(true);
    expect(() => {
      // @ts-expect-error intentionally attempting mutation
      TAXONOMY_DEFINITIONS.push({});
    }).toThrowError();
  });
});
