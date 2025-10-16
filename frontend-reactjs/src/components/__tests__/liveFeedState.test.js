import { describe, expect, it } from 'vitest';
import { applyBidCreated, applyBidMessage, upsertLiveFeedPost } from '../liveFeedState.js';

describe('liveFeedState helpers', () => {
  it('upserts posts and enforces max size when provided', () => {
    const initial = [
      { id: 'post-1', title: 'Existing job' },
      { id: 'post-2', title: 'Older job' }
    ];

    const result = upsertLiveFeedPost(initial, { id: 'post-3', title: 'New job' }, { maxSize: 2 });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('post-3');
    expect(result.find((post) => post.id === 'post-1')).toBeDefined();
    expect(result.find((post) => post.id === 'post-2')).toBeUndefined();
  });

  it('replaces existing bids when applying bid created events', () => {
    const posts = [
      {
        id: 'post-1',
        bids: [
          { id: 'bid-1', amount: 250 },
          { id: 'bid-2', amount: 300 }
        ]
      }
    ];

    const updated = applyBidCreated(posts, {
      postId: 'post-1',
      bid: { id: 'bid-2', amount: 320 }
    });

    expect(updated[0].bids).toHaveLength(2);
    expect(updated[0].bids[1].id).toBe('bid-2');
    expect(updated[0].bids[1].amount).toBe(320);
  });

  it('appends bid messages and keeps chronological order', () => {
    const posts = [
      {
        id: 'post-1',
        bids: [
          {
            id: 'bid-1',
            messages: [
              { id: 'msg-1', createdAt: '2024-01-01T10:00:00Z' }
            ]
          }
        ]
      }
    ];

    const next = applyBidMessage(posts, {
      postId: 'post-1',
      bidId: 'bid-1',
      message: { id: 'msg-2', createdAt: '2024-01-01T09:00:00Z' }
    });

    expect(next[0].bids[0].messages).toHaveLength(2);
    expect(next[0].bids[0].messages[0].id).toBe('msg-2');
    expect(next[0].bids[0].messages[1].id).toBe('msg-1');
  });
});
