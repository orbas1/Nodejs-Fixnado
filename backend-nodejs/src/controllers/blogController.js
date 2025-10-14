import {
  listPublishedPosts,
  getPostBySlug,
  getDashboardPosts,
  listCategories,
  listTags
} from '../services/blogService.js';

export async function listBlogPosts(req, res, next) {
  try {
    const { page = 1, pageSize = 12, category, tag, search } = req.query;
    const limit = Math.min(Number(pageSize) || 12, 50);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;
    const result = await listPublishedPosts({ limit, offset, category, tag, search });
    const [categories, tags] = await Promise.all([listCategories(), listTags()]);
    return res.json({
      data: result.posts,
      pagination: {
        total: result.total,
        page: Number(page) || 1,
        pageSize: limit
      },
      facets: {
        categories,
        tags
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function fetchBlogPost(req, res, next) {
  try {
    const { slug } = req.params;
    const post = await getPostBySlug(slug);
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    return res.json({ data: post });
  } catch (error) {
    next(error);
  }
}

export async function fetchDashboardBlogPosts(req, res, next) {
  try {
    const persona = `${req.user?.type ?? ''}`.replace('_', '-');
    const posts = await getDashboardPosts({
      persona,
      limit: Math.min(Number(req.query.limit) || 5, 12)
    });
    return res.json({ data: posts });
  } catch (error) {
    next(error);
  }
}
