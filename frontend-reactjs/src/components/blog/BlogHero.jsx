import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const formatDate = (value) => {
  if (!value) return 'Draft';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return value;
  }
};

const BlogHero = ({ featured }) => {
  if (!featured) {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-accent/10 bg-gradient-to-br from-primary to-accent text-white shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" aria-hidden />
      <div className="relative grid gap-10 p-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em]">
            Featured briefing
          </p>
          <h1 className="text-4xl font-semibold leading-tight lg:text-5xl">{featured.title}</h1>
          <p className="max-w-2xl text-base text-white/80">{featured.excerpt}</p>
          <div className="flex flex-wrap gap-3 text-xs text-white/80">
            {featured.categories?.map((category) => (
              <span key={category.id} className="rounded-full bg-white/20 px-3 py-1">
                {category.name}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-white/80">
            <span>Published {formatDate(featured.publishedAt)}</span>
            {featured.readingTimeMinutes ? <span>{featured.readingTimeMinutes} minute read</span> : null}
          </div>
          <Link
            to={`/blog/${featured.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary shadow-lg transition hover:translate-y-0.5 hover:shadow-xl"
          >
            Continue to article →
          </Link>
        </div>
        {featured.heroImageUrl ? (
          <img
            src={featured.heroImageUrl}
            alt={featured.heroImageAlt || featured.title}
            className="h-full w-full rounded-3xl object-cover"
          />
        ) : (
          <div className="aspect-[4/3] w-full rounded-3xl bg-white/10 backdrop-blur" aria-hidden />
        )}
      </div>
    </section>
  );
};

BlogHero.propTypes = {
  featured: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    excerpt: PropTypes.string,
    categories: PropTypes.array,
    publishedAt: PropTypes.string,
    readingTimeMinutes: PropTypes.number,
    heroImageUrl: PropTypes.string,
    heroImageAlt: PropTypes.string
  })
};

BlogHero.defaultProps = {
  featured: null
};

export default BlogHero;
