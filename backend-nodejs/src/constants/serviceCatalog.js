const SERVICE_TAXONOMY = [
  {
    type: 'personal-care',
    label: 'Personal care & wellbeing',
    description: 'On-site specialists supporting people-focused experiences.',
    categories: [
      {
        slug: 'barbering',
        label: 'Barbering',
        synonyms: ['barber', 'barbering', 'haircut'],
        defaultTags: ['Mobile grooming', 'Clipper specialists', 'Fade experts']
      },
      {
        slug: 'massages',
        label: 'Massage therapy',
        synonyms: ['massage', 'massages', 'physio'],
        defaultTags: ['Sports recovery', 'Corporate wellness']
      },
      {
        slug: 'personal-trainer',
        label: 'Personal trainer',
        synonyms: ['personal trainer', 'fitness coach', 'pt'],
        defaultTags: ['Strength programmes', 'Workplace fitness']
      }
    ]
  },
  {
    type: 'trade-services',
    label: 'Trade services',
    description: 'Certified trades delivering facilities, fit-out and maintenance work.',
    categories: [
      {
        slug: 'carpentry',
        label: 'Carpentry',
        synonyms: ['carpentry', 'joinery', 'carpenter'],
        defaultTags: ['Fit-outs', 'Fire door compliance']
      },
      {
        slug: 'bricklaying',
        label: 'Brick laying',
        synonyms: ['brick laying', 'bricklaying', 'masonry'],
        defaultTags: ['Structural works', 'Pointing & restoration']
      },
      {
        slug: 'painting',
        label: 'Painting & decorating',
        synonyms: ['painting', 'decorating', 'paint'],
        defaultTags: ['Commercial repaint', 'Protective coatings']
      }
    ]
  },
  {
    type: 'logistics',
    label: 'Logistics & removals',
    description: 'Crewed logistics, last-mile deliveries and relocation support.',
    categories: [
      {
        slug: 'removals',
        label: 'Removals',
        synonyms: ['removals', 'relocation'],
        defaultTags: ['Crate management', 'Move coordinators']
      },
      {
        slug: 'deliveries',
        label: 'Deliveries',
        synonyms: ['deliveries', 'courier'],
        defaultTags: ['Same-day', 'Out-of-hours']
      }
    ]
  },
  {
    type: 'professional-services',
    label: 'Professional services',
    description: 'Accredited back-office and advisory capabilities.',
    categories: [
      {
        slug: 'accountant',
        label: 'Accountant',
        synonyms: ['accountant', 'accountancy', 'finance'],
        defaultTags: ['Escrow reconciliations', 'Payroll integrations']
      }
    ]
  }
];

const NORMALISED_CATEGORY_LOOKUP = new Map();
const CATEGORY_BY_SLUG = new Map();
const TYPE_LOOKUP = new Map();

SERVICE_TAXONOMY.forEach((group) => {
  TYPE_LOOKUP.set(group.type, group);
  group.categories.forEach((category) => {
    CATEGORY_BY_SLUG.set(category.slug, { ...category, type: group.type });
    category.synonyms.forEach((synonym) => {
      NORMALISED_CATEGORY_LOOKUP.set(normaliseKey(synonym), category.slug);
    });
  });
});

function normaliseKey(value) {
  return value?.toString().trim().toLowerCase() ?? '';
}

function resolveCategorySlug(input) {
  if (!input) {
    return null;
  }

  const key = normaliseKey(input);
  if (CATEGORY_BY_SLUG.has(key)) {
    return key;
  }

  return NORMALISED_CATEGORY_LOOKUP.get(key) ?? null;
}

export function listServiceCategories() {
  return Array.from(CATEGORY_BY_SLUG.values()).map((category) => ({
    slug: category.slug,
    label: category.label,
    type: category.type,
    defaultTags: category.defaultTags
  }));
}

export function listServiceTypes() {
  return SERVICE_TAXONOMY.map((group) => ({
    type: group.type,
    label: group.label,
    description: group.description,
    categories: group.categories.map((category) => category.slug)
  }));
}

export function describeCategory(input) {
  const slug = resolveCategorySlug(input) ?? normaliseKey(input);
  const category = CATEGORY_BY_SLUG.get(slug);
  return category
    ? {
        slug: category.slug,
        label: category.label,
        type: category.type,
        tags: category.defaultTags ?? []
      }
    : {
        slug,
        label: input || 'General services',
        type: 'general-services',
        tags: []
      };
}

export function describeType(type) {
  const group = TYPE_LOOKUP.get(type);
  if (!group) {
    return {
      type: 'general-services',
      label: 'General services',
      description: 'Multi-trade crews covering flexible work orders.',
      categories: []
    };
  }

  return {
    type: group.type,
    label: group.label,
    description: group.description,
    categories: group.categories.map((category) => category.slug)
  };
}

export function categoriesForType(type) {
  return describeType(type).categories;
}

export function inferTypeFromCategory(category) {
  const descriptor = describeCategory(category);
  return descriptor.type;
}

export function enrichServiceMetadata(service = {}) {
  const descriptor = describeCategory(service.category);
  const type = inferTypeFromCategory(service.category);
  return {
    type,
    category: descriptor.label,
    categorySlug: descriptor.slug,
    tags: Array.from(new Set([...(descriptor.tags ?? []), ...((service.tags ?? service.metadata?.tags) || [])]))
  };
}

export const SERVICE_TAXONOMY_DEFINITION = SERVICE_TAXONOMY.map((group) => ({
  type: group.type,
  label: group.label,
  description: group.description,
  categories: group.categories.map((category) => ({
    slug: category.slug,
    label: category.label,
    synonyms: category.synonyms,
    defaultTags: category.defaultTags
  }))
}));

