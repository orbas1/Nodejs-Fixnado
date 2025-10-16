export function upsertLiveFeedPost(posts, incoming, { maxSize } = {}) {
  if (!incoming) {
    return posts;
  }

  const existing = Array.isArray(posts) ? posts : [];
  const filtered = existing.filter((post) => post?.id !== incoming.id);
  const next = [incoming, ...filtered];
  if (Number.isInteger(maxSize) && maxSize > 0) {
    return next.slice(0, maxSize);
  }
  return next;
}

export function applyBidCreated(posts, { postId, bid }) {
  if (!postId || !bid) {
    return posts;
  }

  return (Array.isArray(posts) ? posts : []).map((post) => {
    if (post?.id !== postId) {
      return post;
    }
    const bids = Array.isArray(post.bids) ? post.bids.slice() : [];
    const existingIndex = bids.findIndex((entry) => entry?.id === bid.id);
    if (existingIndex >= 0) {
      bids.splice(existingIndex, 1, bid);
    } else {
      bids.unshift(bid);
    }
    return { ...post, bids };
  });
}

export function applyBidMessage(posts, { postId, bidId, message }) {
  if (!postId || !bidId || !message) {
    return posts;
  }

  return (Array.isArray(posts) ? posts : []).map((post) => {
    if (post?.id !== postId) {
      return post;
    }

    const bids = Array.isArray(post.bids) ? post.bids.slice() : [];
    const nextBids = bids.map((bid) => {
      if (bid?.id !== bidId) {
        return bid;
      }
      const messages = Array.isArray(bid.messages) ? bid.messages.slice() : [];
      const existingIndex = messages.findIndex((entry) => entry?.id === message.id);
      if (existingIndex >= 0) {
        messages.splice(existingIndex, 1, message);
      } else {
        messages.push(message);
        messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      return { ...bid, messages };
    });

    return { ...post, bids: nextBids };
  });
}
