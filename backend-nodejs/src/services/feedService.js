import { Post, MarketplaceItem, User } from '../models/index.js';

export async function listLiveFeed() {
  const posts = await Post.findAll({
    order: [['createdAt', 'DESC']],
    limit: 25,
    include: [{ model: User, attributes: ['firstName', 'lastName', 'type'] }]
  });
  return posts;
}

export async function listMarketplaceFeed() {
  const items = await MarketplaceItem.findAll({
    order: [['createdAt', 'DESC']],
    limit: 25
  });
  return items;
}
