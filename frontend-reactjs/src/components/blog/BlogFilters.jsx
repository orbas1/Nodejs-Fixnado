import PropTypes from 'prop-types';
import { FunnelIcon, TagIcon } from '@heroicons/react/24/outline';

const BlogFilters = ({ categories, tags, activeCategory, activeTag, onCategoryChange, onTagChange }) => {
  return (
    <section className="rounded-3xl border border-accent/10 bg-white/80 p-6 shadow-glow">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-primary/50">Curate your reading</p>
          <h2 className="text-2xl font-semibold text-primary">Filters</h2>
        </div>
        <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center md:justify-end">
          <label className="flex flex-1 items-center gap-3 rounded-2xl border border-primary/10 bg-secondary px-4 py-3 text-sm text-primary">
            <FunnelIcon className="h-5 w-5 text-primary/60" />
            <select
              value={activeCategory ?? ''}
              onChange={(event) => onCategoryChange(event.target.value || null)}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 items-center gap-3 rounded-2xl border border-primary/10 bg-secondary px-4 py-3 text-sm text-primary">
            <TagIcon className="h-5 w-5 text-primary/60" />
            <select
              value={activeTag ?? ''}
              onChange={(event) => onTagChange(event.target.value || null)}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            >
              <option value="">All tags</option>
              {tags.map((tag) => (
                <option key={tag.slug} value={tag.slug}>
                  #{tag.slug}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </section>
  );
};

BlogFilters.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  tags: PropTypes.arrayOf(
    PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  activeCategory: PropTypes.string,
  activeTag: PropTypes.string,
  onCategoryChange: PropTypes.func.isRequired,
  onTagChange: PropTypes.func.isRequired
};

BlogFilters.defaultProps = {
  categories: [],
  tags: [],
  activeCategory: null,
  activeTag: null
};

export default BlogFilters;
