import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDaysIcon, ClockIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { fetchBlogPost } from '../api/blogClient.js';
import Spinner from '../components/ui/Spinner.jsx';

function formatDate(value) {
  if (!value) return 'Unpublished';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return value;
  }
}

function parseContent(content) {
  if (!content) return [];
  return content
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean);
}

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBlogPost(slug);
        if (cancelled) return;
        setPost(data);
      } catch (caught) {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : 'Unable to load article');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const paragraphs = useMemo(() => parseContent(post?.content ?? ''), [post?.content]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50" role="status" aria-live="polite">
        <Spinner className="h-10 w-10 text-primary" />
        <span className="sr-only">Loading article</span>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-rose-700">
            <h1 className="text-2xl font-semibold">We couldn’t find that article</h1>
            <p className="mt-3 text-sm">{error || 'This post may have been archived or removed.'}</p>
            <Link
              to="/blog"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90"
            >
              <ArrowLeftIcon className="h-4 w-4" /> Back to insights
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-accent/10 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <Link to="/blog" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">
              <ArrowLeftIcon className="h-4 w-4" /> Back to insights
            </Link>
            <h1 className="text-4xl font-semibold text-primary md:text-5xl">{post.title}</h1>
            <p className="max-w-3xl text-base text-primary/70">{post.excerpt}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-primary/60">
              <span className="inline-flex items-center gap-2">
                <CalendarDaysIcon className="h-4 w-4" />
                {formatDate(post.publishedAt)}
              </span>
              {post.readingTimeMinutes ? (
                <span className="inline-flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" /> {post.readingTimeMinutes} min read
                </span>
              ) : null}
              {post.author ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
                  {post.author.firstName} {post.author.lastName}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-primary/60">
              {post.categories?.map((category) => (
                <span key={category.id} className="rounded-full bg-primary/10 px-3 py-1 text-primary/70">
                  {category.name}
                </span>
              ))}
            </div>
          </div>
          {post.heroImageUrl ? (
            <img
              src={post.heroImageUrl}
              alt={post.heroImageAlt || post.title}
              className="w-full max-w-md rounded-3xl object-cover shadow-lg"
            />
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6">
        <article className="mt-12 space-y-8 rounded-3xl border border-accent/10 bg-white/90 p-10 text-primary shadow-glow">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-base leading-7 text-primary/80">
              {paragraph}
            </p>
          ))}
          {post.media?.length ? (
            <div className="grid gap-6 border-t border-accent/10 pt-6 md:grid-cols-2">
              {post.media.map((asset) => (
                <figure key={asset.id} className="space-y-3">
                  <img
                    src={asset.url}
                    alt={asset.altText || post.title}
                    className="w-full rounded-2xl object-cover shadow"
                  />
                  {asset.altText ? <figcaption className="text-xs text-primary/60">{asset.altText}</figcaption> : null}
                </figure>
              ))}
            </div>
          ) : null}
        </article>
      </main>
    </div>
  );
};

export default BlogPost;
