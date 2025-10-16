import {
  emptyBlockDraft,
  emptyMenuDraft,
  emptyPageDraft
} from '../constants.js';
import { joinRoles, stringifyJson } from './index.js';

export function toPageDraft(page) {
  if (!page) {
    return { ...emptyPageDraft };
  }
  return {
    title: page.title ?? '',
    slug: page.slug ?? '',
    status: page.status ?? 'draft',
    layout: page.layout ?? 'default',
    visibility: page.visibility ?? 'public',
    heroHeadline: page.heroHeadline ?? '',
    heroSubheading: page.heroSubheading ?? '',
    heroImageUrl: page.heroImageUrl ?? '',
    heroCtaLabel: page.heroCtaLabel ?? '',
    heroCtaUrl: page.heroCtaUrl ?? '',
    featureImageUrl: page.featureImageUrl ?? '',
    seoTitle: page.seoTitle ?? '',
    seoDescription: page.seoDescription ?? '',
    previewPath: page.previewPath ?? '',
    allowedRoles: joinRoles(page.allowedRoles),
    metadata: stringifyJson(page.metadata),
    previewUrl: page.previewUrl ?? ''
  };
}

export function toBlockForm(block) {
  if (!block) {
    return { ...emptyBlockDraft };
  }
  return {
    id: block.id,
    type: block.type ?? 'rich_text',
    title: block.title ?? '',
    subtitle: block.subtitle ?? '',
    body: block.body ?? '',
    layout: block.layout ?? 'stacked',
    accentColor: block.accentColor ?? '',
    backgroundImageUrl: block.backgroundImageUrl ?? '',
    media: stringifyJson(block.media),
    settings: stringifyJson(block.settings),
    allowedRoles: joinRoles(block.allowedRoles),
    analyticsTag: block.analyticsTag ?? '',
    embedUrl: block.embedUrl ?? '',
    ctaLabel: block.ctaLabel ?? '',
    ctaUrl: block.ctaUrl ?? '',
    position: block.position != null ? String(block.position) : '',
    isVisible: block.isVisible !== false,
    createdAt: block.createdAt,
    updatedAt: block.updatedAt
  };
}

export function toMenuDraft(menu) {
  if (!menu) {
    return { ...emptyMenuDraft };
  }
  return {
    name: menu.name ?? '',
    location: menu.location ?? 'header',
    description: menu.description ?? '',
    isPrimary: Boolean(menu.isPrimary),
    allowedRoles: joinRoles(menu.allowedRoles),
    metadata: stringifyJson(menu.metadata)
  };
}

export function toMenuItemForm(item) {
  if (!item) {
    return {
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
  }

  return {
    id: item.id,
    label: item.label ?? '',
    url: item.url ?? '',
    icon: item.icon ?? '',
    openInNewTab: Boolean(item.openInNewTab),
    sortOrder: item.sortOrder != null ? String(item.sortOrder) : '',
    visibility: item.visibility ?? 'public',
    parentId: item.parentId ?? '',
    allowedRoles: joinRoles(item.allowedRoles),
    settings: stringifyJson(item.settings),
    analyticsTag: item.analyticsTag ?? '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}
