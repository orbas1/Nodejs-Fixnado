export const THEME_PRESETS = [
  {
    id: 'standard',
    name: 'Standard',
    description:
      'Bright neutral base optimised for daylight environments and compliance reviews. Recommended for operational users who require clear contrast on dense data tables.',
    hero: {
      title: 'Standard theme hero',
      kpi: 'Match conversion ↑18%',
      narrative: 'Applies tokenised gradients with accessible overlays, ideal for admin and provider workstreams.'
    },
    preview: {
      gradient: 'linear-gradient(135deg, #1445E0 0%, #3C8CE7 100%)',
      textColor: '#FFFFFF',
      textMuted: 'rgba(255, 255, 255, 0.78)',
      shadow: '0 40px 60px -40px rgba(20, 69, 224, 0.45)'
    },
    swatches: [
      { label: 'Primary', color: '#1445E0' },
      { label: 'Surface', color: '#FFFFFF' },
      { label: 'Success', color: '#00BFA6' },
      { label: 'Warning', color: '#F5A524' }
    ],
    guardrails: [
      'Maintain 16px base font size with plus-scale option for accessibility.',
      'Use elevated surfaces for analytics widgets to preserve depth cues.',
      'Pairs with evergreen marketing imagery (service technicians, city skylines).'
    ],
    metrics: [
      { label: 'Contrast ratio', value: '7.2:1' },
      { label: 'Adoption', value: '64% of admins' }
    ]
  },
  {
    id: 'dark',
    name: 'Dark',
    description:
      'Low-light palette tuned for extended monitoring shifts and control room deployments. Reinforces focus via cooler surfaces and accent glows.',
    hero: {
      title: 'Dark theme hero',
      kpi: 'Escrow latency ↓22%',
      narrative: 'Uses navy gradients with cyan highlights to preserve contrast at night or in dark offices.'
    },
    preview: {
      gradient: 'linear-gradient(135deg, #1F2A44 0%, #274472 100%)',
      textColor: '#F8FAFC',
      textMuted: 'rgba(248, 250, 252, 0.68)',
      shadow: '0 40px 60px -40px rgba(91, 124, 250, 0.4)'
    },
    swatches: [
      { label: 'Primary', color: '#5B7CFA' },
      { label: 'Surface', color: '#0F172A' },
      { label: 'Success', color: '#22D3EE' },
      { label: 'Warning', color: '#FBBF24' }
    ],
    guardrails: [
      'Restrict large white surfaces to avoid glare; prefer translucent elevations.',
      'Enable high contrast mode when displaying fine-grained tables or legal copy.',
      'Pair with photography containing cool temperature lighting to avoid colour clashes.'
    ],
    metrics: [
      { label: 'Contrast ratio', value: '6.8:1' },
      { label: 'Adoption', value: '23% of admins' }
    ]
  },
  {
    id: 'emo',
    name: 'Emo',
    description:
      'Expressive campaign palette used for marketing takeovers and seasonal promos. Neon gradients emphasise music-venue partnerships while maintaining AA contrast.',
    hero: {
      title: 'Emo theme hero',
      kpi: 'Promo CTR ↑31%',
      narrative: 'Vibrant magenta-to-amber gradients with vinyl-inspired overlays showcasing partnership campaigns.'
    },
    preview: {
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 45%, #F97316 100%)',
      textColor: '#FDF4FF',
      textMuted: 'rgba(253, 244, 255, 0.76)',
      shadow: '0 45px 80px -40px rgba(236, 72, 153, 0.55)'
    },
    swatches: [
      { label: 'Primary', color: '#8B5CF6' },
      { label: 'Surface', color: '#0F0A1D' },
      { label: 'Accent', color: '#EC4899' },
      { label: 'Highlight', color: '#FCD34D' }
    ],
    guardrails: [
      'Imagery should feature moody lighting or neon signage; avoid bright daylight photography.',
      'Apply focus ring overrides to maintain accessibility against saturated backgrounds.',
      'Limit continuous usage to <30 days to prevent brand fatigue; rotate with seasonal overlays.'
    ],
    metrics: [
      { label: 'Contrast ratio', value: '6.4:1' },
      { label: 'Adoption', value: 'Campaign only' }
    ]
  }
];

export const PERSONALISATION_OPTIONS = {
  density: [
    { value: 'comfortable', label: 'Comfortable', description: 'Default spacing tokens optimised for 1100–1440px canvases.' },
    { value: 'compact', label: 'Compact', description: 'Reduces paddings for power users working on 13″ laptops.' }
  ],
  contrast: [
    { value: 'standard', label: 'Standard', description: 'Balanced focus ring and border contrast that meets AA.' },
    { value: 'high', label: 'High contrast', description: 'Thickened borders and amber focus halo for low-vision operators.' }
  ],
  marketingVariant: [
    { value: 'hero', label: 'Hero band' },
    { value: 'announcement', label: 'Announcement panel' },
    { value: 'seasonal', label: 'Seasonal overlay' }
  ]
};

export const STORAGE_KEY = 'fixnado.theme-preferences.v1';

export const DEFAULT_PREFERENCES = {
  theme: 'standard',
  density: 'comfortable',
  contrast: 'standard',
  marketingVariant: 'hero'
};
