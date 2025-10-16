import { beforeEach, describe, expect, it } from 'vitest';
import { sequelize } from '../src/models/index.js';
import {
  createHomePage,
  listHomePages,
  createSection,
  createComponent,
  reorderComponent,
  publishHomePage,
  getHomePageById,
  duplicateHomePage,
  duplicateSection,
  duplicateComponent
} from '../src/services/homePageBuilderService.js';

describe('homePageBuilderService', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  it('creates and lists pages with default metadata', async () => {
    const page = await createHomePage({ name: 'Main Home', description: 'Primary marketing surface' }, 'admin-1');
    expect(page.name).toBe('Main Home');
    expect(page.status).toBe('draft');
    expect(page.slug).toBe('main-home');

    const pages = await listHomePages();
    expect(pages).toHaveLength(1);
    expect(pages[0].sectionsCount).toBe(0);
    expect(pages[0].componentsCount).toBe(0);
  });

  it('ensures slugs remain unique for duplicate names', async () => {
    const first = await createHomePage({ name: 'Landing Page' }, 'admin');
    const second = await createHomePage({ name: 'Landing Page' }, 'admin');

    expect(first.slug).toBe('landing-page');
    expect(second.slug).toBe('landing-page-2');
  });

  it('creates sections and components and supports reordering', async () => {
    const page = await createHomePage({ name: 'Operations Hub' }, 'admin');
    const section = await createSection(page.id, { title: 'Hero', layout: 'full-width' }, 'admin');
    expect(section.components).toHaveLength(0);

    const firstComponent = await createComponent(section.id, { type: 'hero', title: 'Hero Band' }, 'admin');
    const secondComponent = await createComponent(
      section.id,
      { type: 'cta', title: 'Call to action' },
      'admin'
    );

    expect(firstComponent.position).toBe(1);
    expect(secondComponent.position).toBe(2);

    const ordered = await reorderComponent(secondComponent.id, { position: 1 }, 'admin');
    expect(ordered[0].id).toBe(secondComponent.id);
    expect(ordered[1].id).toBe(firstComponent.id);
  });

  it('publishes a page and reflects status changes', async () => {
    const page = await createHomePage({ name: 'Launchpad' }, 'admin');
    const published = await publishHomePage(page.id, {}, 'admin');
    expect(published.status).toBe('published');

    const loaded = await getHomePageById(page.id);
    expect(loaded.status).toBe('published');
    expect(loaded.publishedAt).not.toBeNull();
  });

  it('duplicates a page with sections and components', async () => {
    const page = await createHomePage({ name: 'Growth Home' }, 'admin');
    const section = await createSection(page.id, { title: 'Hero', layout: 'full-width' }, 'admin');
    const component = await createComponent(section.id, { type: 'hero', title: 'Hero Banner' }, 'admin');

    expect(component.id).toBeDefined();

    const duplicated = await duplicateHomePage(page.id, 'admin');

    expect(duplicated.id).not.toBe(page.id);
    expect(duplicated.status).toBe('draft');
    expect(duplicated.sections).toHaveLength(1);
    expect(duplicated.sections[0].components).toHaveLength(1);
    expect(duplicated.sections[0].components[0].id).not.toBe(component.id);
    expect(duplicated.slug).toMatch(/growth-home/);
  });

  it('duplicates a section and preserves nested components', async () => {
    const page = await createHomePage({ name: 'Content Hub' }, 'admin');
    const section = await createSection(page.id, { title: 'Stories', layout: 'grid' }, 'admin');
    const first = await createComponent(section.id, { type: 'card', title: 'Story 1' }, 'admin');
    await createComponent(section.id, { type: 'card', title: 'Story 2' }, 'admin');

    expect(first.position).toBe(1);

    const sections = await duplicateSection(section.id, 'admin');

    expect(sections).toHaveLength(2);
    const duplicated = sections[1];
    expect(duplicated.title).toContain('Copy');
    expect(duplicated.components).toHaveLength(2);
    expect(duplicated.components[0].id).not.toBe(first.id);
  });

  it('duplicates a component after the source component', async () => {
    const page = await createHomePage({ name: 'Component Lab' }, 'admin');
    const section = await createSection(page.id, { title: 'Features', layout: 'full-width' }, 'admin');
    const primary = await createComponent(section.id, { type: 'feature', title: 'Primary Feature' }, 'admin');
    await createComponent(section.id, { type: 'feature', title: 'Secondary Feature' }, 'admin');

    const result = await duplicateComponent(primary.id, 'admin');

    expect(result.sectionId).toBe(section.id);
    expect(result.components).toHaveLength(3);
    const duplicated = result.components[1];
    expect(duplicated.title).toContain('Copy');
    expect(duplicated.id).not.toBe(primary.id);
    expect(result.components[0].id).toBe(primary.id);
  });
});
