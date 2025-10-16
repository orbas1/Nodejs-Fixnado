import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import sequelize from '../../config/database.js';
import {
  listWebsitePages,
  getWebsitePage,
  createWebsitePage,
  updateWebsitePage,
  deleteWebsitePage,
  createWebsiteContentBlock,
  updateWebsiteContentBlock,
  deleteWebsiteContentBlock,
  listWebsiteNavigation,
  createWebsiteNavigationMenu,
  updateWebsiteNavigationMenu,
  deleteWebsiteNavigationMenu,
  createWebsiteNavigationItem,
  updateWebsiteNavigationItem,
  deleteWebsiteNavigationItem,
  getWebsiteManagementSnapshot,
  reorderNavigationItems
} from '../websiteManagementService.js';
import { WebsiteNavigationItem } from '../../models/index.js';

const ACTOR_ID = 'admin-tester';

describe('websiteManagementService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true, restartIdentity: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('creates, lists, updates and deletes website pages with preview urls', async () => {
    const created = await createWebsitePage({
      actorId: ACTOR_ID,
      payload: {
        title: 'Marketing Landing',
        heroHeadline: 'Welcome to Fixnado',
        previewPath: '/marketing/landing'
      }
    });

    expect(created.title).toBe('Marketing Landing');
    expect(created.slug).toBe('marketing-landing');
    expect(created.previewUrl).toContain('marketing/landing');

    let pages = await listWebsitePages();
    expect(pages).toHaveLength(1);
    expect(pages[0].previewUrl).toBe(created.previewUrl);

    const updated = await updateWebsitePage({
      id: created.id,
      actorId: ACTOR_ID,
      payload: {
        title: 'About Fixnado',
        slug: 'about-fixnado',
        heroHeadline: 'Why teams choose Fixnado',
        metadata: { section: 'about' }
      }
    });

    expect(updated.title).toBe('About Fixnado');
    expect(updated.slug).toBe('about-fixnado');
    expect(updated.metadata).toEqual({ section: 'about' });

    const detail = await getWebsitePage({ id: created.id });
    expect(detail.page.previewUrl).toBe(updated.previewUrl);
    expect(detail.blocks).toHaveLength(0);

    await deleteWebsitePage({ id: created.id });
    pages = await listWebsitePages();
    expect(pages).toHaveLength(0);
  });

  it('manages content blocks for a page', async () => {
    const page = await createWebsitePage({
      actorId: ACTOR_ID,
      payload: {
        title: 'Content Blocks Showcase',
        status: 'draft'
      }
    });

    const block = await createWebsiteContentBlock({
      pageId: page.id,
      actorId: ACTOR_ID,
      payload: {
        type: 'hero',
        title: 'Hero block',
        body: 'Welcome to the showcase',
        position: 3,
        settings: { theme: 'ocean' }
      }
    });

    expect(block.type).toBe('hero');
    expect(block.position).toBe(3);
    expect(block.settings).toEqual({ theme: 'ocean' });

    const updated = await updateWebsiteContentBlock({
      id: block.id,
      actorId: ACTOR_ID,
      payload: {
        body: 'Updated welcome copy',
        analyticsTag: 'hero-block',
        position: 2
      }
    });

    expect(updated.body).toBe('Updated welcome copy');
    expect(updated.analyticsTag).toBe('hero-block');
    expect(updated.position).toBe(2);

    const detail = await getWebsitePage({ id: page.id });
    expect(detail.blocks).toHaveLength(1);
    expect(detail.blocks[0].analyticsTag).toBe('hero-block');

    await deleteWebsiteContentBlock({ id: block.id });
    const refreshed = await getWebsitePage({ id: page.id });
    expect(refreshed.blocks).toHaveLength(0);
  });

  it('manages navigation menus and items including hierarchy and reordering', async () => {
    const menu = await createWebsiteNavigationMenu({
      actorId: ACTOR_ID,
      payload: {
        name: 'Primary menu',
        location: 'header',
        isPrimary: true
      }
    });

    const updatedMenu = await updateWebsiteNavigationMenu({
      id: menu.id,
      actorId: ACTOR_ID,
      payload: {
        description: 'Main marketing navigation',
        metadata: { experiment: 'spring-refresh' }
      }
    });

    expect(updatedMenu.description).toBe('Main marketing navigation');
    expect(updatedMenu.metadata).toEqual({ experiment: 'spring-refresh' });

    const parentItem = await createWebsiteNavigationItem({
      menuId: menu.id,
      actorId: ACTOR_ID,
      payload: {
        label: 'Solutions',
        url: '/solutions'
      }
    });

    const childItem = await createWebsiteNavigationItem({
      menuId: menu.id,
      actorId: ACTOR_ID,
      payload: {
        label: 'Industries',
        url: '/solutions/industries',
        parentId: parentItem.id
      }
    });

    expect(childItem.parentId).toBe(parentItem.id);

    const updatedItem = await updateWebsiteNavigationItem({
      id: childItem.id,
      actorId: ACTOR_ID,
      payload: {
        label: 'Industry playbooks',
        sortOrder: 5,
        openInNewTab: true
      }
    });

    expect(updatedItem.label).toBe('Industry playbooks');
    expect(updatedItem.sortOrder).toBe(5);
    expect(updatedItem.openInNewTab).toBe(true);

    await reorderNavigationItems({
      menuId: menu.id,
      items: [
        { id: parentItem.id, sortOrder: 2 },
        { id: childItem.id, sortOrder: 1 }
      ]
    });

    const storedItems = await WebsiteNavigationItem.findAll({
      where: { menuId: menu.id },
      order: [['sortOrder', 'ASC']]
    });

    expect(storedItems[0].id).toBe(childItem.id);
    expect(storedItems[0].sortOrder).toBe(1);

    const navigation = await listWebsiteNavigation();
    expect(navigation).toHaveLength(1);
    expect(navigation[0].items).toHaveLength(2);

    await deleteWebsiteNavigationItem({ id: childItem.id });
    await deleteWebsiteNavigationItem({ id: parentItem.id });
    await deleteWebsiteNavigationMenu({ id: menu.id });

    const emptyNavigation = await listWebsiteNavigation();
    expect(emptyNavigation).toHaveLength(0);
  });

  it('summarises website footprint in a snapshot', async () => {
    const published = await createWebsitePage({
      actorId: ACTOR_ID,
      payload: {
        title: 'Launch Page',
        status: 'published',
        visibility: 'role_gated',
        heroHeadline: 'Launch ready',
        metadata: { campaign: 'launch' }
      }
    });

    await createWebsitePage({
      actorId: ACTOR_ID,
      payload: {
        title: 'Teaser Page',
        status: 'draft'
      }
    });

    await createWebsiteContentBlock({
      pageId: published.id,
      actorId: ACTOR_ID,
      payload: {
        type: 'hero',
        title: 'Hero',
        body: 'Launch hero',
        isVisible: true,
        analyticsTag: 'hero-launch'
      }
    });

    const menu = await createWebsiteNavigationMenu({
      actorId: ACTOR_ID,
      payload: {
        name: 'Header',
        location: 'header',
        isPrimary: true
      }
    });

    const externalItem = await createWebsiteNavigationItem({
      menuId: menu.id,
      actorId: ACTOR_ID,
      payload: {
        label: 'Docs',
        url: 'https://docs.fixnado.com',
        openInNewTab: true,
        allowedRoles: ['admin']
      }
    });

    await createWebsiteNavigationItem({
      menuId: menu.id,
      actorId: ACTOR_ID,
      payload: {
        label: 'Internal',
        url: '/internal',
        parentId: externalItem.id
      }
    });

    const snapshot = await getWebsiteManagementSnapshot();
    expect(snapshot.pages.total).toBe(2);
    expect(snapshot.pages.published).toBe(1);
    expect(snapshot.pages.roleGated).toBe(1);
    expect(snapshot.pages.lastPublishedAt).toBeTruthy();
    expect(snapshot.blocks.total).toBe(1);
    expect(snapshot.blocks.visible).toBe(1);
    expect(snapshot.navigation.menus).toBe(1);
    expect(snapshot.navigation.primaryMenus).toBe(1);
    expect(snapshot.navigation.items).toBe(2);
    expect(snapshot.navigation.nestedItems).toBe(1);
    expect(snapshot.navigation.externalLinks).toBe(1);
    expect(snapshot.navigation.restrictedItems).toBe(1);
  });
});
