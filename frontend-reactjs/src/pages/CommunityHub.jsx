import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import LiveFeed from '../components/LiveFeed.jsx';
import CommunityInsights from '../components/community/CommunityInsights.jsx';
import CommunityEventBoard from '../components/community/CommunityEventBoard.jsx';
import { fetchCommunityEvents, fetchCommunitySummary } from '../api/communityClient.js';
import { useSession } from '../hooks/useSession.js';
import { useCurrentRole } from '../hooks/useCurrentRole.js';
import { recordPersonaAnalytics } from '../utils/personaAnalytics.js';
import Spinner from '../components/ui/Spinner.jsx';

const REFETCH_INTERVAL = 1000 * 60 * 5; // five minutes

export default function CommunityHub() {
  const { userId } = useSession();
  const persona = useCurrentRole();
  const [summary, setSummary] = useState({ metrics: {}, highlights: [], recommendations: [] });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [summaryPayload, eventsPayload] = await Promise.all([
          fetchCommunitySummary({ persona }, { signal: abortController.signal }),
          fetchCommunityEvents({ limit: 6 }, { signal: abortController.signal })
        ]);
        if (!isMounted) {
          return;
        }
        setSummary(summaryPayload);
        setEvents(eventsPayload);
        recordPersonaAnalytics('community.hub.view', {
          persona,
          outcome: 'success',
          allowed: [persona],
          metadata: {
            eventsLoaded: eventsPayload.length,
            highlights: summaryPayload.highlights.length,
            viewer: userId
          }
        });
      } catch (loadError) {
        if (loadError.name === 'AbortError') {
          return;
        }
        console.warn('[CommunityHub] failed to load community data', loadError);
        if (isMounted) {
          setError(loadError.message || 'Unable to load community data');
          recordPersonaAnalytics('community.hub.view', {
            persona,
            outcome: 'error',
            reason: loadError.message,
            allowed: [persona]
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    intervalRef.current = window.setInterval(() => {
      load();
    }, REFETCH_INTERVAL);

    return () => {
      isMounted = false;
      abortController.abort();
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [persona]);

  const insights = useMemo(
    () => ({
      metrics: summary.metrics,
      highlights: summary.highlights,
      recommendations: summary.recommendations
    }),
    [summary]
  );

  const trendingPosts = useMemo(() => summary.trending ?? [], [summary]);

  const handleFollow = (item) => {
    recordPersonaAnalytics('community.recommendation.follow', {
      persona,
      outcome: item.following ? 'already-following' : 'followed',
      metadata: {
        channelId: item.id,
        channelTitle: item.title
      }
    });
    setSummary((current) => ({
      ...current,
      recommendations: current.recommendations.map((recommendation) =>
        recommendation.id === item.id
          ? { ...recommendation, following: true }
          : recommendation
      )
    }));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Community</p>
          <h1 className="text-3xl font-semibold text-primary">Timeline & community hub</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Stay ahead of Fixnado operations with real-time timeline updates, moderated conversations, curated events, and
            analytics on how your crews engage across every channel.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <Link
            to="/community/messages"
            className="inline-flex items-center rounded-full border border-primary px-4 py-2 font-semibold uppercase tracking-[0.3em] text-primary transition hover:bg-primary hover:text-white"
          >
            Open conversations
          </Link>
          <Link
            to="/community/events"
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-primary hover:text-primary"
          >
            View events
          </Link>
          <Link
            to="/community/moderation"
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-primary hover:text-primary"
          >
            Moderation
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm font-semibold text-rose-600">
          {error}
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-inner">
              <header className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-primary">Live timeline</h2>
                  <p className="text-xs text-slate-500">Curated by Fixnado Live Ops, includes ads and moderation signals</p>
                </div>
                <Link
                  to="/feed"
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-primary hover:underline"
                >
                  Open full feed
                </Link>
              </header>
              <LiveFeed condensed />
            </section>
            {trendingPosts.length ? (
              <section className="space-y-4">
                <header className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">Trending posts</h2>
                  <span className="text-xs text-slate-500">Based on last 24 hours</span>
                </header>
                <ul className="space-y-3">
                  {trendingPosts.map((post) => (
                    <li key={post.id} className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-primary">{post.headline}</p>
                          <p className="text-xs text-slate-500">{post.author?.name}</p>
                        </div>
                        <Link
                          className="text-xs font-semibold uppercase tracking-[0.3em] text-primary hover:underline"
                          to={`/community/posts/${post.id}`}
                        >
                          View post
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
          <div className="space-y-8">
            <CommunityInsights
              metrics={insights.metrics}
              highlights={insights.highlights}
              recommendations={insights.recommendations}
              onFollow={handleFollow}
            />
            <CommunityEventBoard events={events} />
          </div>
        </div>
      )}
    </div>
  );
}
