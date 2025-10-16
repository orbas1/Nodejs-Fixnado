import {
  createPost,
  updatePost,
  publishPost,
  archivePost,
  deletePost,
  getAdminPosts,
  listCategories,
  upsertCategory,
  deleteCategory,
  listTags,
  upsertTag,
  deleteTag
} from '../services/blogService.js';

function handleError(error, res) {
  if (error?.statusCode) {
    const payload = { message: error.message };
    if (Array.isArray(error.details) && error.details.length > 0) {
      payload.details = error.details;
    }
    return res.status(error.statusCode).json(payload);
  }
  return res.status(500).json({ message: 'Unexpected error' });
}

export async function listAdminPosts(req, res) {
  try {
    const { page = 1, pageSize = 20, status, search } = req.query;
    const limit = Math.min(Number(pageSize) || 20, 100);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;
    const result = await getAdminPosts({ limit, offset, status, search });
    return res.json({
      data: result.posts,
      pagination: {
        total: result.total,
        page: Number(page) || 1,
        pageSize: limit
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function createAdminPost(req, res) {
  try {
    const post = await createPost(req.body, req.user?.id);
    return res.status(201).json({ data: post });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateAdminPost(req, res) {
  try {
    const post = await updatePost(req.params.postId, req.body);
    return res.json({ data: post });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function publishAdminPost(req, res) {
  try {
    const post = await publishPost(req.params.postId, req.body ?? {});
    return res.json({ data: post });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function archiveAdminPost(req, res) {
  try {
    const post = await archivePost(req.params.postId);
    return res.json({ data: post });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteAdminPost(req, res) {
  try {
    await deletePost(req.params.postId);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
}

export async function listAdminCategories(req, res) {
  try {
    const categories = await listCategories();
    return res.json({ data: categories });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function upsertAdminCategory(req, res) {
  try {
    const category = await upsertCategory(req.body);
    return res.status(201).json({ data: category });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteAdminCategory(req, res) {
  try {
    await deleteCategory(req.params.categoryId);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
}

export async function listAdminTags(req, res) {
  try {
    const {
      page = '1',
      pageSize = '20',
      search,
      role,
      indexing,
      sort,
      direction
    } = req.query;

    const result = await listTags({
      page,
      pageSize,
      search,
      role,
      indexing,
      sort,
      direction
    });

    return res.json({ data: result.tags, pagination: result.pagination, stats: result.stats });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function upsertAdminTag(req, res) {
  try {
    const tag = await upsertTag(req.body);
    return res.status(201).json({ data: tag });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteAdminTag(req, res) {
  try {
    await deleteTag(req.params.tagId);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
}
