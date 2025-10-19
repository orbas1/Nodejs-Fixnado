import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  createPostComment,
  fetchCommunityPost,
  recordPostReaction
} from '../api/communityClient.js';
import Spinner from '../components/ui/Spinner.jsx';
import { recordPersonaAnalytics } from '../utils/personaAnalytics.js';
import { useCurrentRole } from '../hooks/useCurrentRole.js';

const REACTIONS = [
  { id: 'like', label: 'Like' },
  { id: 'celebrate', label: 'Celebrate' },
  { id: 'support', label: 'Support' }
];

function formatRelativeTime(value) {
  if (!value) {
    return 'just now';
  }
  const diff = new Date(value).getTime() - Date.now();
  const minutes = Math.round(diff / 60000);
  if (Math.abs(minutes) < 1) {
    return 'just now';
  }
  if (Math.abs(minutes) < 60) {
    return `${Math.abs(minutes)} minute${Math.abs(minutes) === 1 ? '' : 's'} ago`;
  }
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return `${Math.abs(hours)} hour${Math.abs(hours) === 1 ? '' : 's'} ago`;
  }
  const days = Math.round(hours / 24);
  return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
}

export default function CommunityPost() {
  const { postId } = useParams();
  const persona = useCurrentRole();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentStatus, setCommentStatus] = useState('idle');
  const [reactionStatus, setReactionStatus] = useState('idle');

  useEffect(() => {
    if (!postId) {
      return;
    }
    let isMounted = true;
    const abortController = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchCommunityPost(postId, { signal: abortController.signal });
        if (!isMounted) {
          return;
        }
        setPost(payload);
        recordPersonaAnalytics('community.post.view', {
          persona,
          outcome: 'success',
          metadata: {
            postId,
            reactionCounts: payload.reactions,
            commentCount: payload.comments?.length ?? 0
          }
        });
      } catch (loadError) {
        if (loadError.name === 'AbortError') {
          return;
        }
        console.warn('[CommunityPost] failed to fetch post', loadError);
        if (isMounted) {
          setError(loadError.message || 'Post unavailable');
          recordPersonaAnalytics('community.post.view', {
            persona,
            outcome: 'error',
            reason: loadError.message,
            metadata: { postId }
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [postId, persona]);

  const relatedPosts = useMemo(() => post?.related ?? [], [post]);

  const handleReaction = async (reaction) => {
    if (!post) {
      return;
    }
    setReactionStatus('loading');
    try {
      await recordPostReaction(post.id, reaction.id);
      setPost((current) => ({
        ...current,
        reactions: {
          ...current.reactions,
          [reaction.id]: (current.reactions?.[reaction.id] ?? 0) + 1
        },
        userReaction: reaction.id
      }));
      setReactionStatus('success');
      recordPersonaAnalytics('community.post.react', {
        persona,
        outcome: 'success',
        metadata: { postId: post.id, reaction: reaction.id }
      });
    } catch (reactionError) {
      console.warn('[CommunityPost] failed to record reaction', reactionError);
      setReactionStatus('error');
      recordPersonaAnalytics('community.post.react', {
        persona,
        outcome: 'error',
        reason: reactionError.message,
        metadata: { postId: post.id, reaction: reaction.id }
      });
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (!commentDraft.trim() || !post) {
      return;
    }
    setCommentStatus('loading');
    try {
      const comment = await createPostComment(post.id, { content: commentDraft });
      setPost((current) => ({
        ...current,
        comments: [...(current.comments ?? []), comment]
      }));
      setCommentDraft('');
      setCommentStatus('success');
      recordPersonaAnalytics('community.post.comment', {
        persona,
        outcome: 'success',
        metadata: { postId: post.id }
      });
    } catch (commentError) {
      console.warn('[CommunityPost] failed to submit comment', commentError);
      setCommentStatus('error');
      recordPersonaAnalytics('community.post.comment', {
        persona,
        outcome: 'error',
        reason: commentError.message,
        metadata: { postId: post.id }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-8 text-sm font-semibold text-rose-600">
          {error}
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="mb-6 text-xs text-slate-500">
        <Link to="/community" className="hover:text-primary">
          Community hub
        </Link>
        <span className="mx-2">/</span>
        <span className="font-semibold text-primary">Post detail</span>
      </nav>
      <article className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-lg">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{post.topic}</p>
          <h1 className="text-3xl font-semibold text-primary">{post.headline}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span>
              {post.author?.name} • {post.author?.role}
            </span>
            <span>{new Date(post.createdAt).toLocaleString()}</span>
            {post.zone?.name ? <span>Zone {post.zone.name}</span> : null}
          </div>
        </header>
        <section className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600">
          {post.content?.split('\n').map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {post.media?.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {post.media.map((image) => (
                <img
                  key={image}
                  src={image}
                  alt="Post media"
                  className="h-60 w-full rounded-2xl object-cover"
                />
              ))}
            </div>
          ) : null}
        </section>
        <section className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {REACTIONS.map((reaction) => (
            <button
              key={reaction.id}
              type="button"
              onClick={() => handleReaction(reaction)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-semibold uppercase tracking-[0.3em] transition ${
                post.userReaction === reaction.id
                  ? 'border-primary bg-primary text-white'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-primary hover:text-primary'
              }`}
              disabled={reactionStatus === 'loading'}
            >
              {reaction.label}
              <span className="text-[11px] font-semibold text-slate-400">
                {(post.reactions?.[reaction.id] ?? 0).toLocaleString()}
              </span>
            </button>
          ))}
          {reactionStatus === 'error' ? (
            <span className="text-xs font-semibold text-rose-500">Reaction failed. Try again.</span>
          ) : null}
        </section>
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-primary">Comments</h2>
          <form className="mt-4 space-y-3" onSubmit={handleCommentSubmit}>
            <textarea
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
              placeholder="Share your insights with the community"
            />
            <div className="flex items-center justify-between text-xs text-slate-500">
              {commentStatus === 'error' ? (
                <span className="font-semibold text-rose-500">Unable to submit comment.</span>
              ) : commentStatus === 'success' ? (
                <span className="font-semibold text-emerald-600">Comment posted.</span>
              ) : null}
              <button
                type="submit"
                disabled={commentStatus === 'loading'}
                className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Post comment
              </button>
            </div>
          </form>
          <ul className="mt-6 space-y-4">
            {(post.comments ?? []).map((comment) => (
              <li key={comment.id ?? comment.createdAt} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-primary">{comment.author?.name ?? 'Community member'}</span>
                  <span>{formatRelativeTime(comment.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{comment.content}</p>
              </li>
            ))}
          </ul>
        </section>
      </article>
      {relatedPosts.length ? (
        <aside className="mt-10 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">Related posts</h2>
          <ul className="space-y-3">
            {relatedPosts.map((related) => (
              <li key={related.id} className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary">{related.headline}</p>
                    <p className="text-xs text-slate-500">{related.author?.name}</p>
                  </div>
                  <Link
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-primary hover:underline"
                    to={`/community/posts/${related.id}`}
                  >
                    View post
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </div>
  );
}
