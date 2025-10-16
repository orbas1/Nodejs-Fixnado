import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  createPost,
  updatePost,
  publishPost,
  listCategories,
  upsertCategory,
  upsertTag,
  listTags,
  listPostRevisions,
  duplicatePost,
  getAdminPosts,
  restorePostRevision
} from '../src/services/blogService.js';
import { sequelize, User } from '../src/models/index.js';

const buildAuthor = async () =>
  User.create(
    {
      firstName: 'Content',
      lastName: 'Owner',
      email: 'content.owner@example.com',
      passwordHash: 'hashed-password',
      type: 'admin'
    },
    { validate: false }
  );

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

describe('blogService', () => {
  it('creates a post with metadata, taxonomy, and media assets', async () => {
    const author = await buildAuthor();

    const post = await createPost(
      {
        title: 'Operational readiness update',
        excerpt: 'A concise summary for distribution channels.',
        content: 'Full content for the article body.',
        status: 'draft',
        readingTimeMinutes: 8,
        categories: [
          { name: 'Guides', description: 'How-to resources', displayOrder: 3 }
        ],
        tags: [{ name: 'platform' }],
        media: [
          {
            url: 'https://cdn.fixnado.example/blog/hero.jpg',
            type: 'image',
            altText: 'Hero photograph',
            title: 'Operations hero',
            caption: 'Responders in the field',
            credit: 'Fixnado Media Team'
          }
        ],
        metadata: {
          metaTitle: 'Operational readiness update',
          featured: true,
          callToActionLabel: 'Learn more',
          callToActionUrl: 'https://fixnado.example/case-study'
        }
      },
      author.id
    );

    expect(post).toBeTruthy();
    expect(post.metadata.featured).toBe(true);
    expect(post.metadata.callToActionLabel).toBe('Learn more');
    expect(post.categories).toHaveLength(1);
    expect(post.categories[0].name).toBe('Guides');
    expect(post.tags).toHaveLength(1);
    expect(post.tags[0].slug).toBe('platform');
    expect(post.media).toHaveLength(1);
    expect(post.media[0].metadata.title).toBe('Operations hero');

    const revisions = await listPostRevisions(post.id);
    expect(revisions).toHaveLength(1);
    expect(revisions[0].action).toBe('created');
    expect(revisions[0].status).toBe('draft');
  });

  it('updates post metadata, relationships, and sanitises empty fields', async () => {
    const author = await buildAuthor();
    const initial = await createPost(
      {
        title: 'Roadmap',
        excerpt: 'Initial excerpt',
        content: 'Initial body',
        status: 'draft',
        categories: [{ name: 'Roadmap' }],
        tags: [{ name: 'update' }],
        metadata: { metaTitle: 'Initial', featured: true }
      },
      author.id
    );

    const updated = await updatePost(initial.id, {
      excerpt: '',
      heroImageUrl: '',
      metadata: {
        featured: false,
        canonicalUrl: 'https://fixnado.example/blog/roadmap',
        ogImageUrl: ''
      },
      categories: initial.categories.map((category) => ({ id: category.id })),
      tags: [{ name: 'news' }],
      media: []
    }, author.id);

    expect(updated.excerpt).toBe('');
    expect(updated.heroImageUrl).toBe('');
    expect(updated.metadata.featured).toBe(false);
    expect(updated.metadata.canonicalUrl).toBe('https://fixnado.example/blog/roadmap');
    expect(updated.metadata.ogImageUrl).toBeUndefined();
    expect(updated.tags[0].slug).toBe('news');
    expect(updated.media).toHaveLength(0);

    const revisions = await listPostRevisions(initial.id);
    expect(revisions[0].action).toBe('updated');
    expect(revisions[0].status).toBe('draft');
    expect(revisions[1].action).toBe('created');
  });

  it('publishes scheduled posts and clears schedule metadata', async () => {
    const author = await buildAuthor();
    const post = await createPost(
      {
        title: 'Scheduled release',
        excerpt: 'Summary',
        content: 'Body',
        status: 'scheduled',
        scheduledAt: '2025-01-10T09:00:00.000Z'
      },
      author.id
    );

    const published = await publishPost(post.id, {
      publishedAt: '2025-01-11T12:00:00.000Z'
    }, author.id);

    expect(published.status).toBe('published');
    expect(new Date(published.publishedAt).toISOString()).toBe('2025-01-11T12:00:00.000Z');
    expect(published.scheduledAt).toBeNull();

    const revisions = await listPostRevisions(post.id);
    expect(revisions[0].action).toBe('published');
    expect(revisions[0].status).toBe('published');
  });

  it('duplicates an existing post into a fresh draft with revision capture', async () => {
    const author = await buildAuthor();
    const original = await createPost(
      {
        title: 'Dispatch toolkit',
        excerpt: 'Original excerpt',
        content: 'Original body',
        status: 'published',
        categories: [{ name: 'Operations' }],
        tags: [{ name: 'dispatch' }],
        media: [{ url: 'https://cdn.fixnado.example/dispatch.pdf', type: 'document' }]
      },
      author.id
    );

    const duplicate = await duplicatePost(original.id, author.id);

    expect(duplicate.id).not.toBe(original.id);
    expect(duplicate.title).toContain('Dispatch toolkit');
    expect(duplicate.title).toContain('Copy');
    expect(duplicate.status).toBe('draft');
    expect(duplicate.categories).toHaveLength(1);
    expect(duplicate.tags).toHaveLength(1);
    expect(duplicate.media).toHaveLength(1);

    const revisions = await listPostRevisions(duplicate.id);
    expect(revisions).toHaveLength(1);
    expect(revisions[0].action).toBe('duplicated');
    expect(revisions[0].status).toBe('draft');
  });

  it('filters admin posts by status, category, and tag', async () => {
    const author = await buildAuthor();
    const published = await createPost(
      {
        title: 'Launch update',
        excerpt: 'Public announcement',
        content: 'Launch details',
        status: 'published',
        categories: [{ name: 'Announcements' }],
        tags: [{ name: 'release' }]
      },
      author.id
    );

    await createPost(
      {
        title: 'Internal memo',
        excerpt: 'Operations focus',
        content: 'Internal notes',
        status: 'draft',
        categories: [{ name: 'Operations' }],
        tags: [{ name: 'ops' }]
      },
      author.id
    );

    const statusResults = await getAdminPosts({ status: 'published' });
    expect(statusResults.total).toBe(1);
    expect(statusResults.posts[0].id).toBe(published.id);

    const categoryId = published.categories[0].id;
    const categoryResults = await getAdminPosts({ category: categoryId });
    expect(categoryResults.total).toBe(1);
    expect(categoryResults.posts[0].categories[0].id).toBe(categoryId);

    const tagId = published.tags[0].id;
    const tagResults = await getAdminPosts({ tag: tagId });
    expect(tagResults.total).toBe(1);
    expect(tagResults.posts[0].tags[0].id).toBe(tagId);
  });

  it('restores a revision and keeps slugs unique', async () => {
    const author = await buildAuthor();
    const post = await createPost(
      {
        title: 'Mission update',
        excerpt: 'Initial summary',
        content: 'Initial content',
        status: 'draft',
        metadata: { metaTitle: 'Mission update' }
      },
      author.id
    );

    await updatePost(
      post.id,
      {
        title: 'Mission update revised',
        content: 'Revised content',
        slug: 'mission-update-revised',
        metadata: { metaTitle: 'Revised mission update' }
      },
      author.id
    );

    await createPost(
      {
        title: 'Mission update',
        excerpt: 'Another summary',
        content: 'Another body',
        status: 'draft'
      },
      author.id
    );

    const revisions = await listPostRevisions(post.id);
    const originalRevision = revisions.find((revision) => revision.action === 'created');
    expect(originalRevision).toBeTruthy();

    const restored = await restorePostRevision(post.id, originalRevision.id, author.id);

    expect(restored.title).toBe('Mission update');
    expect(restored.content).toBe('Initial content');
    expect(restored.metadata.metaTitle).toBe('Mission update');
    expect(restored.slug).toMatch(/^mission-update/);
    expect(restored.slug).not.toBe('mission-update');

    const updatedRevisions = await listPostRevisions(post.id);
    expect(updatedRevisions[0].action).toBe('restored');
    expect(updatedRevisions[0].status).toBe('draft');
  });

  it('manages taxonomy display order and slug handling', async () => {
    await upsertCategory({ name: 'Insights', slug: 'insights', displayOrder: 2 });
    await upsertCategory({ name: 'Insights', displayOrder: 1 });
    await upsertTag({ name: 'Product' });
    await upsertTag({ name: 'Product', slug: 'product-news' });

    const categories = await listCategories();
    const tags = await listTags();

    expect(categories[0].displayOrder).toBe(1);
    expect(categories[0].slug).toBe('insights');
    expect(tags[0].slug).toBe('product-news');
  });
});
