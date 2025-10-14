import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';

function formatDate(value) {
  if (!value) return 'Unscheduled';
  try {
    const date = new Date(value);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return value;
  }
}

const gradientPalette = [
  'from-sky-500/20 via-primary/10 to-primary/5',
  'from-emerald-500/20 via-primary/5 to-secondary',
  'from-indigo-500/20 via-accent/10 to-primary/5',
  'from-amber-500/20 via-rose-100/40 to-primary/5'
];

function pickGradient(seed) {
  if (!seed) return gradientPalette[0];
  const index = Math.abs(seed.charCodeAt(0) + seed.length) % gradientPalette.length;
  return gradientPalette[index];
}

const BlogCard = ({ post, variant = 'standard' }) => {
  const gradient = pickGradient(post.slug);
  const Tag = variant === 'compact' ? 'article' : 'div';
  return (
    <Tag
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-accent/10 bg-white/90 shadow-glow transition hover:-translate-y-1 hover:shadow-xl`}
      data-qa="blog-card"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60`} aria-hidden="true" />
      {post.heroImageUrl ? (
        <img
          src={post.heroImageUrl}
          alt={post.heroImageAlt || post.title}
          className="h-52 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-52 w-full bg-gradient-to-br from-primary/20 via-accent/10 to-transparent" aria-hidden />
      )}
      <div className="relative flex flex-1 flex-col gap-4 px-6 pb-6 pt-4">
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-primary/60">
          {post.categories?.map((category) => (
            <span key={category.id} className="rounded-full bg-primary/10 px-3 py-1 text-primary/70">
              {category.name}
            </span>
          ))}
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-semibold text-primary">
            <Link to={`/blog/${post.slug}`} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              {post.title}
            </Link>
          </h3>
          <p className="text-sm text-primary/70">{post.excerpt}</p>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-4 text-xs text-primary/60">
          <span className="inline-flex items-center gap-2">
            <CalendarDaysIcon className="h-4 w-4" />
            {formatDate(post.publishedAt)}
          </span>
          {post.readingTimeMinutes ? (
            <span className="inline-flex items-center gap-2">
              <ClockIcon className="h-4 w-4" /> {post.readingTimeMinutes} min read
            </span>
          ) : null}
          {post.tags?.length ? (
            <span className="inline-flex items-center gap-2">
              <span className="text-primary/50">•</span>
              {post.tags
                .slice(0, 2)
                .map((tag) => `#${tag.slug}`)
                .join(' ')}
            </span>
          ) : null}
        </div>
      </div>
    </Tag>
  );
};

BlogCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    excerpt: PropTypes.string,
    heroImageUrl: PropTypes.string,
    heroImageAlt: PropTypes.string,
    categories: PropTypes.array,
    tags: PropTypes.array,
    publishedAt: PropTypes.string,
    readingTimeMinutes: PropTypes.number
  }).isRequired,
  variant: PropTypes.oneOf(['standard', 'compact'])
};

export default BlogCard;
