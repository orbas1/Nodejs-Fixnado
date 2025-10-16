export const NEW_PAGE_ID = '__new_page__';
export const NEW_MENU_ID = '__new_menu__';

export const emptyPageDraft = {
  title: '',
  slug: '',
  status: 'draft',
  layout: 'default',
  visibility: 'public',
  heroHeadline: '',
  heroSubheading: '',
  heroImageUrl: '',
  heroCtaLabel: '',
  heroCtaUrl: '',
  featureImageUrl: '',
  seoTitle: '',
  seoDescription: '',
  previewPath: '',
  allowedRoles: '',
  metadata: '{\n  \n}',
  previewUrl: ''
};

export const emptyBlockDraft = {
  type: 'rich_text',
  title: '',
  subtitle: '',
  body: '',
  layout: 'stacked',
  accentColor: '',
  backgroundImageUrl: '',
  media: '{\n  \n}',
  settings: '{\n  \n}',
  allowedRoles: '',
  analyticsTag: '',
  embedUrl: '',
  ctaLabel: '',
  ctaUrl: '',
  position: '',
  isVisible: true
};

export const emptyMenuDraft = {
  name: '',
  location: 'header',
  description: '',
  isPrimary: false,
  allowedRoles: '',
  metadata: '{\n  \n}'
};

export const emptyMenuItemDraft = {
  label: '',
  url: '',
  icon: '',
  openInNewTab: false,
  sortOrder: '',
  visibility: 'public',
  parentId: '',
  allowedRoles: '',
  settings: '{\n  \n}',
  analyticsTag: ''
};

export const PAGE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'preview', label: 'Preview' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' }
];

export const PAGE_VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'authenticated', label: 'Authenticated users' },
  { value: 'role_gated', label: 'Role restricted' }
];
