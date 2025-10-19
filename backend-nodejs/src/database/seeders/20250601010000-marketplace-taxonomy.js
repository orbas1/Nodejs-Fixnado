import { createHash } from 'node:crypto';
import { v5 as uuidv5 } from 'uuid';

export const SEED_RELEASE = '1.00';
export const TAXONOMY_NAMESPACE = uuidv5('fixnado:marketplace-taxonomy', uuidv5.URL);

function deterministicId(token) {
  return uuidv5(token, TAXONOMY_NAMESPACE);
}

function hashPayload(payload) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export const TAXONOMY_DEFINITIONS = Object.freeze([
  {
    key: 'services',
    label: 'Services',
    steward: 'marketplace.operations@fixnado.com',
    description: 'Field execution, maintenance, and specialist trade offerings managed through Fixnado providers.',
    nodes: [
      {
        slug: 'general-contracting',
        name: 'General Contracting',
        summary:
          'Multi-trade project delivery covering end-to-end fit-out, refurbishment, and facilities upgrades for enterprise sites.',
        keywords: ['contractor', 'fit out', 'site coordination'],
        synonyms: ['general contractor', 'main contractor'],
        filters: { deliveryModels: ['design-and-build', 'self-perform'], responseSlaMinutes: 240 },
        commercialTags: ['project-based', 'high-value'],
        regulatoryNotes: [
          { jurisdiction: 'UK', reference: 'CDM Regulations 2015', requirement: 'Principal contractor duty of care' }
        ],
        children: [
          {
            slug: 'fit-out-projects',
            name: 'Fit-out Projects',
            summary: 'Interior commercial refurbishments including HVAC upgrades, electrical distribution, and finishes.',
            keywords: ['commercial fit out', 'office renovation', 'tenant improvement'],
            synonyms: ['interior fit-out'],
            filters: { deliveryModels: ['design-and-build'], preferredZones: ['grade-a-office'] },
            commercialTags: ['recurring'],
            regulatoryNotes: [
              { jurisdiction: 'UK', reference: 'BS 476', requirement: 'Fire safety certification for finishes' }
            ]
          },
          {
            slug: 'maintenance-retainers',
            name: 'Maintenance Retainers',
            summary: 'Planned preventative maintenance contracts with 24/7 emergency coverage SLAs.',
            keywords: ['ppm', 'emergency callout', 'fm contracts'],
            synonyms: ['facilities maintenance'],
            filters: { responseSlaMinutes: 60, coverage: ['24-7'] },
            commercialTags: ['annuity'],
            regulatoryNotes: []
          }
        ]
      },
      {
        slug: 'electrical-services',
        name: 'Electrical Services',
        summary: 'Low and high voltage installation, maintenance, and smart building automation for commercial portfolios.',
        keywords: ['ev charger', 'bms', 'power distribution'],
        synonyms: ['electrical contracting'],
        filters: { certifications: ['NICEIC', 'ECA'], responseSlaMinutes: 120 },
        commercialTags: ['safety-critical'],
        regulatoryNotes: [
          { jurisdiction: 'UK', reference: 'BS 7671', requirement: 'IET wiring regulations compliance' }
        ],
        children: [
          {
            slug: 'smart-building-automation',
            name: 'Smart Building Automation',
            summary: 'IoT-enabled controls integration covering BMS, lighting, and asset condition monitoring.',
            keywords: ['building automation', 'bms integration', 'iot'],
            synonyms: ['intelligent buildings'],
            filters: { certifications: ['KNX Partner'], deliveryModels: ['consultancy', 'installation'] },
            commercialTags: ['innovation'],
            regulatoryNotes: []
          },
          {
            slug: 'emergency-repairs',
            name: 'Emergency Electrical Repairs',
            summary: 'Rapid response teams resolving outages, faults, and life-safety circuit failures.',
            keywords: ['fault finding', 'power outage', 'urgent callout'],
            synonyms: ['rapid response electricians'],
            filters: { responseSlaMinutes: 45, coverage: ['24-7'], emergency: true },
            commercialTags: ['premium'],
            regulatoryNotes: [
              { jurisdiction: 'UK', reference: 'EAWR 1989', requirement: 'Authorised person on call rota' }
            ]
          }
        ]
      },
      {
        slug: 'environmental-services',
        name: 'Environmental & Compliance Services',
        summary: 'Decontamination, waste management, and sustainability programmes safeguarding client operations.',
        keywords: ['asbestos', 'waste transfer', 'carbon'],
        synonyms: ['environmental contracting'],
        filters: { regulatorySchemes: ['EA-Waste-Carriers'], reportingCadenceDays: 30 },
        commercialTags: ['compliance-driven'],
        regulatoryNotes: [
          { jurisdiction: 'UK', reference: 'Control of Asbestos Regulations 2012', requirement: 'Licensed removal teams' }
        ],
        children: [
          {
            slug: 'hazardous-material-removal',
            name: 'Hazardous Material Removal',
            summary: 'Survey, containment, and removal of asbestos, lead, and other hazardous substances.',
            keywords: ['asbestos removal', 'hazmat', 'containment'],
            synonyms: ['hazmat remediation'],
            filters: { regulatorySchemes: ['HSE-license'], emergency: false },
            commercialTags: ['safety-critical'],
            regulatoryNotes: []
          },
          {
            slug: 'energy-efficiency-audits',
            name: 'Energy Efficiency Audits',
            summary: 'On-site audits delivering EPC upgrades, carbon reduction roadmaps, and compliance reporting.',
            keywords: ['energy audit', 'carbon reduction', 'sustainability'],
            synonyms: ['net-zero consulting'],
            filters: { deliveryModels: ['consultancy'], reportingCadenceDays: 90 },
            commercialTags: ['advisory'],
            regulatoryNotes: [
              { jurisdiction: 'UK', reference: 'SECR', requirement: 'Streamlined Energy and Carbon Reporting' }
            ]
          }
        ]
      }
    ],
    facets: [
      {
        key: 'response-time',
        label: 'Response time SLA',
        description: 'Minutes to acknowledge and schedule urgent requests.',
        dataType: 'integer',
        unit: 'minutes',
        config: { minimum: 15, maximum: 1440, step: 15 },
        isRequired: true,
        defaultAssignments: [
          { nodeSlug: 'services/electrical-services/emergency-repairs', defaultValue: 45, constraints: { max: 60 } },
          { nodeSlug: 'services/general-contracting/maintenance-retainers', defaultValue: 60, constraints: { max: 120 } }
        ]
      },
      {
        key: 'certifications',
        label: 'Required certifications',
        description: 'External certifications required before work can be issued.',
        dataType: 'multi_select',
        unit: null,
        config: {
          allowedValues: ['NICEIC', 'ECA', 'Gas Safe', 'HSE-license', 'BREEAM Assessor', 'KNX Partner']
        },
        isRequired: false,
        defaultAssignments: [
          { nodeSlug: 'services/electrical-services', defaultValue: ['NICEIC', 'ECA'] },
          {
            nodeSlug: 'services/environmental-services/hazardous-material-removal',
            defaultValue: ['HSE-license']
          }
        ]
      },
      {
        key: 'reporting-cadence-days',
        label: 'Reporting cadence',
        description: 'Days between mandatory client updates or compliance reports.',
        dataType: 'integer',
        unit: 'days',
        config: { minimum: 7, maximum: 180, step: 1 },
        isRequired: false,
        defaultAssignments: [
          { nodeSlug: 'services/environmental-services', defaultValue: 30 },
          { nodeSlug: 'services/environmental-services/energy-efficiency-audits', defaultValue: 90 }
        ]
      }
    ]
  },
  {
    key: 'rentals',
    label: 'Rentals',
    steward: 'rental.ops@fixnado.com',
    description: 'Equipment and temporary infrastructure available for hire with logistics orchestration.',
    nodes: [
      {
        slug: 'access-equipment',
        name: 'Access Equipment',
        summary: 'Powered access platforms for working at height with IPAF-trained operators available.',
        keywords: ['boom lift', 'scissor lift', 'work at height'],
        synonyms: ['powered access'],
        filters: { safetyTraining: ['IPAF'], deliveryRadiusMiles: 60 },
        commercialTags: ['high-utilisation'],
        regulatoryNotes: [],
        children: [
          {
            slug: 'boom-lifts',
            name: 'Boom Lifts',
            summary: 'Articulating and telescopic booms up to 135ft with hybrid and electric drive trains.',
            keywords: ['cherry picker', 'articulated boom'],
            synonyms: ['boom platforms'],
            filters: { powerSource: ['diesel', 'electric', 'hybrid'], workingHeightFt: { min: 40, max: 135 } },
            commercialTags: ['premium'],
            regulatoryNotes: []
          },
          {
            slug: 'scissor-lifts',
            name: 'Scissor Lifts',
            summary: 'Indoor and outdoor scissor lifts with deck extensions and pothole protection.',
            keywords: ['slab scissor', 'rough terrain scissor'],
            synonyms: [],
            filters: { powerSource: ['electric', 'diesel'], workingHeightFt: { min: 19, max: 60 } },
            commercialTags: ['core'],
            regulatoryNotes: []
          }
        ]
      },
      {
        slug: 'power-generation',
        name: 'Power Generation & Storage',
        summary: 'Temporary and standby power systems with telemetry, refuelling, and remote monitoring.',
        keywords: ['generator hire', 'battery storage', 'load bank'],
        synonyms: ['temporary power'],
        filters: { remoteMonitoring: true, deliveryRadiusMiles: 150 },
        commercialTags: ['critical'],
        regulatoryNotes: [
          { jurisdiction: 'UK', reference: 'EA permit SR2012 No 4', requirement: 'Temporary generator deployment' }
        ],
        children: [
          {
            slug: 'diesel-generators',
            name: 'Diesel Generators',
            summary: 'Stage V compliant generators ranging 20kVA to 1250kVA with on-demand refuelling.',
            keywords: ['genset', 'stage v'],
            synonyms: ['standby generator'],
            filters: { telemetry: true, emissionClass: ['Stage V'] },
            commercialTags: ['high-demand'],
            regulatoryNotes: []
          },
          {
            slug: 'battery-storage',
            name: 'Battery Storage Systems',
            summary: 'Hybrid battery energy storage containers with solar integration and remote analytics.',
            keywords: ['battery storage', 'hybrid power'],
            synonyms: ['BESS'],
            filters: { telemetry: true, emissionClass: ['Zero Emission'] },
            commercialTags: ['sustainability'],
            regulatoryNotes: []
          }
        ]
      },
      {
        slug: 'site-support',
        name: 'Site Support & Welfare',
        summary: 'Temporary site infrastructure covering welfare, security, and traffic management assets.',
        keywords: ['welfare units', 'hoarding', 'lighting tower'],
        synonyms: ['site setup'],
        filters: { logisticsServices: ['delivery', 'collection'], damageWaiverAvailable: true },
        commercialTags: ['ancillary'],
        regulatoryNotes: [],
        children: [
          {
            slug: 'welfare-units',
            name: 'Welfare Units',
            summary: 'Eco welfare cabins with onboard power, hot water, and telemetry for utilisation tracking.',
            keywords: ['eco welfare', 'mobile cabin'],
            synonyms: ['site cabins'],
            filters: { telemetry: true, powerSource: ['hybrid', 'battery'] },
            commercialTags: ['green-premium'],
            regulatoryNotes: []
          },
          {
            slug: 'temporary-fencing',
            name: 'Temporary Fencing & Hoarding',
            summary: 'Perimeter fencing, hoarding graphics, and rapid deploy barriers with installation crews.',
            keywords: ['heras fencing', 'hoarding'],
            synonyms: ['site fencing'],
            filters: { installationIncluded: true },
            commercialTags: ['recurring'],
            regulatoryNotes: []
          }
        ]
      }
    ],
    facets: [
      {
        key: 'power-source',
        label: 'Power source',
        description: 'Supported fuel or power configuration for the asset.',
        dataType: 'enum',
        unit: null,
        config: { allowedValues: ['diesel', 'electric', 'hybrid', 'battery', 'manual'] },
        isRequired: true,
        defaultAssignments: [
          { nodeSlug: 'rentals/access-equipment/boom-lifts', defaultValue: 'hybrid' },
          { nodeSlug: 'rentals/power-generation/diesel-generators', defaultValue: 'diesel' }
        ]
      },
      {
        key: 'delivery-radius-miles',
        label: 'Delivery radius',
        description: 'Maximum miles supported by in-house logistics before third-party surcharge.',
        dataType: 'integer',
        unit: 'miles',
        config: { minimum: 10, maximum: 300, step: 5 },
        isRequired: false,
        defaultAssignments: [
          { nodeSlug: 'rentals/power-generation', defaultValue: 150 },
          { nodeSlug: 'rentals/access-equipment', defaultValue: 60 }
        ]
      },
      {
        key: 'telemetry-available',
        label: 'Telemetry available',
        description: 'Indicates whether runtime telemetry can be streamed into the Fixnado control centre.',
        dataType: 'boolean',
        unit: null,
        config: {},
        isRequired: false,
        defaultAssignments: [
          { nodeSlug: 'rentals/power-generation/battery-storage', defaultValue: true },
          { nodeSlug: 'rentals/site-support/welfare-units', defaultValue: true }
        ]
      }
    ]
  },
  {
    key: 'materials',
    label: 'Materials',
    steward: 'materials.sourcing@fixnado.com',
    description: 'Construction and maintenance materials with procurement orchestration and compliance vetting.',
    nodes: [
      {
        slug: 'structural-materials',
        name: 'Structural Materials',
        summary: 'Primary load-bearing materials with traceability and mill certifications.',
        keywords: ['rebar', 'steel', 'timber'],
        synonyms: ['primary structure'],
        filters: { leadTimeDays: 7, sustainabilityDisclosures: true },
        commercialTags: ['bulk'],
        regulatoryNotes: [
          { jurisdiction: 'UK', reference: 'BS EN 1090', requirement: 'Factory Production Control' }
        ],
        children: [
          {
            slug: 'reinforcing-steel',
            name: 'Reinforcing Steel',
            summary: 'Cut and bent rebar packages with bending schedules and delivery tracking.',
            keywords: ['rebar', 'mesh'],
            synonyms: ['steel reinforcement'],
            filters: { leadTimeDays: 3, sustainabilityDisclosures: true },
            commercialTags: ['project-based'],
            regulatoryNotes: []
          },
          {
            slug: 'engineered-timber',
            name: 'Engineered Timber',
            summary: 'CLT, glulam, and LVL packages with digital twin coordination and humidity monitoring.',
            keywords: ['clt', 'glulam', 'lvl'],
            synonyms: ['mass timber'],
            filters: { leadTimeDays: 21, chainOfCustody: ['FSC', 'PEFC'] },
            commercialTags: ['sustainability'],
            regulatoryNotes: []
          }
        ]
      },
      {
        slug: 'finishing-materials',
        name: 'Finishing Materials',
        summary: 'High-spec finishes and sustainable options for office, hospitality, and residential schemes.',
        keywords: ['flooring', 'acoustic panels', 'decorative'],
        synonyms: ['fit-out finishes'],
        filters: { sustainabilityDisclosures: true, preferredRatings: ['BREEAM Excellent'] },
        commercialTags: ['design-led'],
        regulatoryNotes: [],
        children: [
          {
            slug: 'sustainable-flooring',
            name: 'Sustainable Flooring',
            summary: 'Low VOC carpets, recycled raised access flooring, and cradle-to-cradle certified finishes.',
            keywords: ['low voc', 'recycled flooring'],
            synonyms: ['eco flooring'],
            filters: { leadTimeDays: 10, preferredRatings: ['BREEAM Excellent', 'LEED Gold'] },
            commercialTags: ['premium'],
            regulatoryNotes: []
          },
          {
            slug: 'acoustic-panels',
            name: 'Acoustic Panels',
            summary: 'Fabric, timber, and micro-perforated acoustic systems with reverberation modelling.',
            keywords: ['sound absorption', 'acoustic rafts'],
            synonyms: ['sound panels'],
            filters: { acousticClass: ['A', 'B'], leadTimeDays: 14 },
            commercialTags: ['specialist'],
            regulatoryNotes: []
          }
        ]
      },
      {
        slug: 'building-systems',
        name: 'Building Systems Kits',
        summary: 'Prefabricated systems accelerating installation with QA documentation bundles.',
        keywords: ['modular pods', 'hvac kits', 'prefab'],
        synonyms: ['prefabricated systems'],
        filters: { leadTimeDays: 28, digitalTwinReady: true },
        commercialTags: ['innovation'],
        regulatoryNotes: [],
        children: [
          {
            slug: 'modular-bathroom-pods',
            name: 'Modular Bathroom Pods',
            summary: 'Factory finished bathroom pods with MEP connections pre-tested and snagged.',
            keywords: ['bathroom pods', 'prefab bathrooms'],
            synonyms: ['modular bathrooms'],
            filters: { leadTimeDays: 35, digitalTwinReady: true },
            commercialTags: ['turnkey'],
            regulatoryNotes: []
          },
          {
            slug: 'smart-hvac-kits',
            name: 'Smart HVAC Kits',
            summary: 'Pre-commissioned HVAC plant rooms with smart controls and remote diagnostics.',
            keywords: ['hvac kit', 'smart controls'],
            synonyms: ['prefab hvac'],
            filters: { leadTimeDays: 28, digitalTwinReady: true },
            commercialTags: ['critical'],
            regulatoryNotes: [
              { jurisdiction: 'UK', reference: 'F-Gas Regulation', requirement: 'Registered handling for refrigerants' }
            ]
          }
        ]
      }
    ],
    facets: [
      {
        key: 'lead-time-days',
        label: 'Lead time',
        description: 'Standard manufacturing or delivery lead time in days.',
        dataType: 'integer',
        unit: 'days',
        config: { minimum: 1, maximum: 120, step: 1 },
        isRequired: true,
        defaultAssignments: [
          { nodeSlug: 'materials/structural-materials/reinforcing-steel', defaultValue: 3 },
          { nodeSlug: 'materials/building-systems/modular-bathroom-pods', defaultValue: 35 }
        ]
      },
      {
        key: 'sustainability-disclosures',
        label: 'Sustainability disclosures',
        description: 'Indicates whether EPDs, lifecycle assessments, or carbon reporting are available.',
        dataType: 'boolean',
        unit: null,
        config: {},
        isRequired: false,
        defaultAssignments: [
          { nodeSlug: 'materials/structural-materials', defaultValue: true },
          { nodeSlug: 'materials/finishing-materials/sustainable-flooring', defaultValue: true }
        ]
      },
      {
        key: 'compliance-standards',
        label: 'Compliance standards',
        description: 'Material compliance standards tracked for QA sign-off.',
        dataType: 'multi_select',
        unit: null,
        config: {
          allowedValues: ['BS EN 1090', 'BS EN 14041', 'FSC', 'PEFC', 'ISO 14001', 'F-Gas']
        },
        isRequired: false,
        defaultAssignments: [
          { nodeSlug: 'materials/structural-materials/engineered-timber', defaultValue: ['FSC', 'PEFC'] },
          { nodeSlug: 'materials/building-systems/smart-hvac-kits', defaultValue: ['F-Gas'] }
        ]
      }
    ]
  }
]);

function flattenNodes(domain, parentInfo = null) {
  const lineagePrefix = parentInfo?.lineage ?? domain.key;
  const level = parentInfo ? parentInfo.level + 1 : 1;

  return domain.nodes.flatMap((node) => {
    const lineage = `${lineagePrefix}/${node.slug}`;
    const id = deterministicId(`${domain.key}:${lineage}`);
    const parentId = parentInfo?.id ?? null;
    const basePayload = {
      slug: node.slug,
      name: node.name,
      summary: node.summary,
      filters: node.filters ?? {},
      synonyms: node.synonyms ?? [],
      keywords: node.keywords ?? [],
      commercialTags: node.commercialTags ?? [],
      regulatoryNotes: node.regulatoryNotes ?? []
    };
    const record = {
      id,
      domain_id: parentInfo?.domainId ?? deterministicId(`${domain.key}:domain`),
      parent_id: parentId,
      slug: `${domain.key}-${node.slug}`,
      name: node.name,
      lineage,
      level,
      summary: node.summary,
      search_keywords: Array.from(new Set([...(node.keywords ?? []), ...(node.synonyms ?? [])])),
      synonyms: node.synonyms ?? [],
      filters: node.filters ?? {},
      commercial_tags: node.commercialTags ?? [],
      regulatory_notes: node.regulatoryNotes ?? [],
      sort_order: node.sortOrder ?? 0,
      is_active: true,
      metadata: {
        seedRelease: SEED_RELEASE,
        dataset: 'marketplace-taxonomy',
        domainKey: domain.key,
        slug: node.slug,
        checksum: hashPayload(basePayload)
      }
    };

    const children = node.children
      ? flattenNodes(
          {
            ...domain,
            nodes: node.children
          },
          { id, lineage, level, domainId: record.domain_id }
        )
      : [];

    return [record, ...children];
  });
}

function buildFacetRecords(domain, domainId) {
  return domain.facets.map((facet) => {
    const payload = {
      key: facet.key,
      label: facet.label,
      description: facet.description,
      dataType: facet.dataType,
      unit: facet.unit,
      config: facet.config
    };
    return {
      id: deterministicId(`${domain.key}:facet:${facet.key}`),
      domain_id: domainId,
      key: facet.key,
      label: facet.label,
      description: facet.description,
      data_type: facet.dataType,
      unit: facet.unit,
      config: facet.config ?? {},
      is_required: facet.isRequired ?? false,
      is_filterable: facet.isFilterable ?? true,
      is_searchable: facet.isSearchable ?? true,
      metadata: {
        seedRelease: SEED_RELEASE,
        dataset: 'marketplace-taxonomy',
        domainKey: domain.key,
        checksum: hashPayload(payload)
      }
    };
  });
}

export function buildTaxonomySeedPlan(definitions = TAXONOMY_DEFINITIONS) {
  const domains = [];
  const nodes = [];
  const facets = [];
  const nodeFacetAssignments = [];
  const nodeLookup = new Map();

  definitions.forEach((domain) => {
    const domainId = deterministicId(`${domain.key}:domain`);
    const domainRecord = {
      id: domainId,
      key: domain.key,
      label: domain.label,
      description: domain.description,
      steward: domain.steward,
      revision: 1,
      metadata: {
        seedRelease: SEED_RELEASE,
        dataset: 'marketplace-taxonomy',
        checksum: hashPayload({
          key: domain.key,
          label: domain.label,
          steward: domain.steward,
          description: domain.description
        })
      }
    };
    domains.push(domainRecord);

    const domainNodes = flattenNodes(domain, { id: null, lineage: domain.key, level: 0, domainId });
    domainNodes.forEach((node) => {
      node.domain_id = domainId;
      nodes.push(node);
      nodeLookup.set(node.lineage, node.id);
    });

    const facetRecords = buildFacetRecords(domain, domainId);
    facets.push(...facetRecords);

    facetRecords.forEach((facet) => {
      const definition = domain.facets.find((entry) => entry.key === facet.key);
      (definition.defaultAssignments ?? []).forEach((assignment, index) => {
        const nodeId = nodeLookup.get(assignment.nodeSlug);
        if (!nodeId) {
          throw new Error(`Unknown taxonomy node slug: ${assignment.nodeSlug}`);
        }
        const assignmentPayload = {
          nodeId,
          facetId: facet.id,
          defaultValue: assignment.defaultValue ?? null,
          constraints: assignment.constraints ?? {}
        };
        nodeFacetAssignments.push({
          id: deterministicId(`${facet.id}:assignment:${nodeId}:${index}`),
          node_id: nodeId,
          facet_id: facet.id,
          default_value: assignment.defaultValue ?? null,
          constraints: assignment.constraints ?? {},
          metadata: {
            seedRelease: SEED_RELEASE,
            dataset: 'marketplace-taxonomy',
            domainKey: domain.key,
            checksum: hashPayload(assignmentPayload)
          }
        });
      });
    });
  });

  return {
    domains,
    nodes,
    facets,
    nodeFacetAssignments
  };
}

export async function up({ context: queryInterface, Sequelize }) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    const { domains, nodes, facets, nodeFacetAssignments } = buildTaxonomySeedPlan();
    const timestamp = new Date();

    await queryInterface.bulkInsert(
      'marketplace_taxonomy_domains',
      domains.map((record) => ({ ...record, created_at: timestamp, updated_at: timestamp })),
      { transaction }
    );

    await queryInterface.bulkInsert(
      'marketplace_taxonomy_nodes',
      nodes.map((record) => ({ ...record, created_at: timestamp, updated_at: timestamp })),
      { transaction }
    );

    await queryInterface.bulkInsert(
      'marketplace_taxonomy_facets',
      facets.map((record) => ({ ...record, created_at: timestamp, updated_at: timestamp })),
      { transaction }
    );

    if (nodeFacetAssignments.length > 0) {
      await queryInterface.bulkInsert(
        'marketplace_taxonomy_node_facets',
        nodeFacetAssignments.map((record) => ({ ...record, created_at: timestamp, updated_at: timestamp })),
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
  const seedMatch = Sequelize.where(Sequelize.json('metadata.seedRelease'), SEED_RELEASE);
  const datasetMatch = Sequelize.where(Sequelize.json('metadata.dataset'), 'marketplace-taxonomy');

  try {
    await queryInterface.bulkDelete(
      'marketplace_taxonomy_node_facets',
      { [Sequelize.Op.and]: [seedMatch, datasetMatch] },
      { transaction }
    );

    await queryInterface.bulkDelete(
      'marketplace_taxonomy_facets',
      { [Sequelize.Op.and]: [seedMatch, datasetMatch] },
      { transaction }
    );

    await queryInterface.bulkDelete(
      'marketplace_taxonomy_nodes',
      { [Sequelize.Op.and]: [seedMatch, datasetMatch] },
      { transaction }
    );

    await queryInterface.bulkDelete(
      'marketplace_taxonomy_domains',
      { [Sequelize.Op.and]: [seedMatch, datasetMatch] },
      { transaction }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
