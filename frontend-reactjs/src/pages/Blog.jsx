import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchBlogPosts } from '../api/blogClient.js';
import BlogHero from '../components/blog/BlogHero.jsx';
import BlogFilters from '../components/blog/BlogFilters.jsx';
import BlogGrid from '../components/blog/BlogGrid.jsx';
import Spinner from '../components/ui/Spinner.jsx';

const PAGE_SIZE = 9;

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [facets, setFacets] = useState({ categories: [], tags: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pageSize: PAGE_SIZE });

  const selectedCategory = searchParams.get('category');
  const selectedTag = searchParams.get('tag');
  const page = Number(searchParams.get('page') || '1');
  const refreshToken = searchParams.get('refresh');

  const featured = posts[0] ?? null;
  const remainingPosts = useMemo(() => (featured ? posts.slice(1) : posts), [posts, featured]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchBlogPosts({
          page,
          pageSize: PAGE_SIZE,
          category: selectedCategory,
          tag: selectedTag
        });
        if (cancelled) return;
        setPosts(Array.isArray(payload?.data) ? payload.data : []);
        setPagination(payload?.pagination ?? { page, total: 0, pageSize: PAGE_SIZE });
        setFacets(payload?.facets ?? { categories: [], tags: [] });
      } catch (caught) {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : 'Unable to load blog posts');
        setPosts([]);
        setFacets({ categories: [], tags: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page, selectedCategory, selectedTag, refreshToken]);

  const totalPages = Math.max(1, Math.ceil((pagination.total ?? 0) / PAGE_SIZE));

  const updateParams = (next) => {
    const merged = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value) {
        merged.delete(key);
      } else {
        merged.set(key, value);
      }
    });
    merged.set('page', '1');
    merged.delete('refresh');
    setSearchParams(merged);
  };

  const changePage = (direction) => {
    const nextPage = Math.min(Math.max(1, page + direction), totalPages);
    const merged = new URLSearchParams(searchParams.toString());
    merged.set('page', `${nextPage}`);
    setSearchParams(merged);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="mx-auto max-w-6xl px-6 pt-16 space-y-12">
        <div className="space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-accent">Fixnado Insights</p>
          <h1 className="text-4xl font-semibold text-primary">Operations, growth and trust briefings</h1>
          <p className="mx-auto max-w-3xl text-base text-primary/70">
            Stay ahead with expert commentary on marketplace risk, provider enablement, geo-matching, and marketing science.
            Crafted for operators running complex field service networks.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
            <Spinner className="h-10 w-10 text-primary" />
            <span className="sr-only">Loading blog posts</span>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-rose-700">
            <h2 className="text-lg font-semibold">We hit turbulence</h2>
            <p className="mt-2 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => updateParams({ refresh: Date.now().toString() })}
              className="mt-4 rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-rose-500"
            >
              Retry loading
            </button>
          </div>
        ) : (
          <>
            <BlogHero featured={featured} />

            <BlogFilters
              categories={facets.categories ?? []}
              tags={facets.tags ?? []}
              activeCategory={selectedCategory}
              activeTag={selectedTag}
              onCategoryChange={(value) => updateParams({ category: value })}
              onTagChange={(value) => updateParams({ tag: value })}
            />

            <BlogGrid posts={remainingPosts} />

            <nav className="flex items-center justify-between rounded-3xl border border-accent/10 bg-white/80 px-6 py-4 text-sm text-primary">
              <button
                type="button"
                onClick={() => changePage(-1)}
                disabled={page <= 1}
                className="rounded-full border border-accent/20 px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <div className="text-xs uppercase tracking-[0.25em] text-primary/60">
                Page {page} of {totalPages}
              </div>
              <button
                type="button"
                onClick={() => changePage(1)}
                disabled={page >= totalPages}
                className="rounded-full border border-accent/20 px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </>
        )}
      </div>
    </div>
  );
};

export default Blog;
