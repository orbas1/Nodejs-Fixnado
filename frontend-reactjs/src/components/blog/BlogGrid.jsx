import PropTypes from 'prop-types';
import BlogCard from './BlogCard.jsx';

const BlogGrid = ({ posts }) => {
  if (!posts.length) {
    return (
      <div className="rounded-3xl border border-accent/10 bg-white/70 p-12 text-center text-primary/70">
        <p className="text-sm font-semibold">No posts match the selected filters yet.</p>
        <p className="mt-2 text-xs">Check back soon — our editorial team publishes weekly.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} />
      ))}
    </div>
  );
};

BlogGrid.propTypes = {
  posts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired
    })
  )
};

BlogGrid.defaultProps = {
  posts: []
};

export default BlogGrid;
