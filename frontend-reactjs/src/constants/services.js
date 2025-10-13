export const SERVICE_TAXONOMY = [
  {
    type: 'personal-care',
    label: 'Personal care & wellbeing',
    description: 'On-site specialists supporting people-focused experiences.',
    categories: [
      { slug: 'barbering', label: 'Barbering', defaultTags: ['Mobile grooming', 'Clipper specialists'] },
      { slug: 'massages', label: 'Massage therapy', defaultTags: ['Sports recovery', 'Corporate wellness'] },
      { slug: 'personal-trainer', label: 'Personal trainer', defaultTags: ['Strength programmes', 'Workplace fitness'] }
    ]
  },
  {
    type: 'trade-services',
    label: 'Trade services',
    description: 'Certified trades delivering facilities, fit-out and maintenance work.',
    categories: [
      { slug: 'carpentry', label: 'Carpentry', defaultTags: ['Fit-outs', 'Fire door compliance'] },
      { slug: 'bricklaying', label: 'Brick laying', defaultTags: ['Structural works', 'Pointing & restoration'] },
      { slug: 'painting', label: 'Painting & decorating', defaultTags: ['Commercial repaint', 'Protective coatings'] }
    ]
  },
  {
    type: 'logistics',
    label: 'Logistics & removals',
    description: 'Crewed logistics, last-mile deliveries and relocation support.',
    categories: [
      { slug: 'removals', label: 'Removals', defaultTags: ['Crate management', 'Move coordinators'] },
      { slug: 'deliveries', label: 'Deliveries', defaultTags: ['Same-day', 'Out-of-hours'] }
    ]
  },
  {
    type: 'professional-services',
    label: 'Professional services',
    description: 'Accredited back-office and advisory capabilities.',
    categories: [{ slug: 'accountant', label: 'Accountant', defaultTags: ['Escrow reconciliations', 'Payroll integrations'] }]
  }
];

export const SERVICE_TYPES = SERVICE_TAXONOMY.map((entry) => ({
  value: entry.type,
  label: entry.label,
  description: entry.description
}));

export const SERVICE_CATEGORIES = SERVICE_TAXONOMY.flatMap((entry) =>
  entry.categories.map((category) => ({
    value: category.slug,
    label: category.label,
    type: entry.type,
    defaultTags: category.defaultTags
  }))
);

export function getServiceTypeLabel(type) {
  return SERVICE_TYPES.find((entry) => entry.value === type)?.label || 'General services';
}

export function getCategoryLabel(slug) {
  return SERVICE_CATEGORIES.find((category) => category.value === slug)?.label || slug || 'Services';
}
