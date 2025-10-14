import PropTypes from 'prop-types';
import BlogCard from '../blog/BlogCard.jsx';

const DashboardBlogRail = ({ posts }) => {
  if (!posts?.length) {
    return null;
  }

  return (
    <section
      className="rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-glow"
      aria-labelledby="dashboard-blog-rail-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/50">Intelligence briefings</p>
          <h2 id="dashboard-blog-rail-title" className="text-2xl font-semibold text-primary">
            Latest from the Fixnado blog
          </h2>
        </div>
        <a
          href="/blog"
          className="rounded-full border border-accent/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary/70 transition hover:border-accent hover:text-accent"
        >
          View all articles
        </a>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {posts.slice(0, 3).map((post) => (
          <BlogCard key={post.id} post={post} variant="compact" />
        ))}
      </div>
    </section>
  );
};

DashboardBlogRail.propTypes = {
  posts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired
    })
  )
};

DashboardBlogRail.defaultProps = {
  posts: []
};

export default DashboardBlogRail;
