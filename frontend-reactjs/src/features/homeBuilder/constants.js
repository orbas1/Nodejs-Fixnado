export const STATUS_TONE = {
  draft: 'neutral',
  published: 'success',
  archived: 'warning'
};

export const COMPONENT_TYPES = [
  { value: 'hero', label: 'Hero banner' },
  { value: 'story', label: 'Story block' },
  { value: 'cta', label: 'Call to action' },
  { value: 'stats', label: 'Metrics grid' },
  { value: 'testimonial', label: 'Testimonial' },
  { value: 'gallery', label: 'Gallery' }
];

export const COMPONENT_LAYOUTS = [
  { value: 'full', label: 'Full width' },
  { value: 'split', label: 'Split columns' },
  { value: 'grid', label: 'Grid' },
  { value: 'feature', label: 'Feature highlight' }
];

export const COMPONENT_VARIANTS = [
  { value: 'standard', label: 'Standard' },
  { value: 'emphasis', label: 'Emphasis' },
  { value: 'muted', label: 'Muted' },
  { value: 'minimal', label: 'Minimal' }
];

export const ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' }
];

export const DENSITY_OPTIONS = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'cozy', label: 'Cozy' },
  { value: 'compact', label: 'Compact' }
];

export const ANIMATION_OPTIONS = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide', label: 'Slide' },
  { value: 'zoom', label: 'Zoom' }
];

export const LAYOUT_OPTIONS = [
  { value: 'modular', label: 'Modular sections' },
  { value: 'campaign', label: 'Campaign landing' },
  { value: 'story', label: 'Story-driven' }
];

export const HERO_LAYOUT_OPTIONS = [
  { value: 'split', label: 'Split media & copy' },
  { value: 'full-bleed', label: 'Full bleed' },
  { value: 'spotlight', label: 'Spotlight' }
];

export const DEFAULT_PAGE_FORM = {
  name: '',
  slug: '',
  description: '',
  theme: 'standard',
  layout: 'modular',
  accentColor: '#1445E0',
  backgroundColor: '#FFFFFF',
  heroLayout: 'split',
  seoTitle: '',
  seoDescription: '',
  settings: {
    layoutMode: 'modular',
    heroVariant: 'gradient',
    announcementEnabled: false,
    announcementMessage: '',
    announcementLinkLabel: '',
    announcementLinkHref: '',
    featuredSectionsText: '',
    palettePrimary: '#1445E0',
    paletteSecondary: '#0EA5E9',
    paletteAccent: '#38BDF8'
  }
};

export const DEFAULT_SECTION_FORM = {
  title: '',
  handle: '',
  description: '',
  layout: 'full-width',
  backgroundColor: '#FFFFFF',
  textColor: '#0F172A',
  accentColor: '#0EA5E9',
  settings: {
    maxWidth: '7xl',
    columns: '1',
    paddingY: 'xl',
    showTopDivider: false,
    showBottomDivider: false,
    anchorId: '',
    navigationLabel: ''
  }
};

export const DEFAULT_COMPONENT_FORM = {
  type: 'hero',
  title: '',
  subheading: '',
  body: '',
  badge: '',
  layout: 'full',
  variant: 'standard',
  backgroundColor: '#FFFFFF',
  textColor: '#0F172A',
  callToActionLabel: '',
  callToActionHref: '',
  secondaryActionLabel: '',
  secondaryActionHref: '',
  media: {
    primaryUrl: '',
    altText: '',
    videoUrl: '',
    galleryText: ''
  },
  config: {
    alignment: 'center',
    density: 'comfortable',
    animation: 'fade',
    showBadge: true,
    showSecondaryAction: false,
    metrics: [],
    tags: []
  }
};
