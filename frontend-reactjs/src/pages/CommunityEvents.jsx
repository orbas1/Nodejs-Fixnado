import { useEffect, useMemo, useState } from 'react';
import CommunityEventBoard from '../components/community/CommunityEventBoard.jsx';
import { fetchCommunityEvents } from '../api/communityClient.js';
import Spinner from '../components/ui/Spinner.jsx';
import { recordPersonaAnalytics } from '../utils/personaAnalytics.js';
import { useCurrentRole } from '../hooks/useCurrentRole.js';

const TIME_WINDOWS = [
  { id: 'week', label: 'Next 7 days', range: 7 },
  { id: 'month', label: 'Next 30 days', range: 30 },
  { id: 'quarter', label: 'Next 90 days', range: 90 }
];

export default function CommunityEvents() {
  const persona = useCurrentRole();
  const [timeWindow, setTimeWindow] = useState(TIME_WINDOWS[0]);
  const [zoneFilter, setZoneFilter] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const to = new Date();
        to.setDate(to.getDate() + timeWindow.range);
        const payload = await fetchCommunityEvents({ zone: zoneFilter || undefined, to }, {
          signal: abortController.signal
        });
        if (!isMounted) {
          return;
        }
        setEvents(payload);
        recordPersonaAnalytics('community.events.view', {
          persona,
          outcome: 'success',
          metadata: {
            zone: zoneFilter || 'all',
            range: timeWindow.id,
            count: payload.length
          }
        });
      } catch (loadError) {
        if (loadError.name === 'AbortError') {
          return;
        }
        console.warn('[CommunityEvents] failed to load events', loadError);
        if (isMounted) {
          setError(loadError.message || 'Unable to load events');
          recordPersonaAnalytics('community.events.view', {
            persona,
            outcome: 'error',
            reason: loadError.message,
            metadata: { zone: zoneFilter || 'all', range: timeWindow.id }
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
  }, [persona, timeWindow, zoneFilter]);

  const zones = useMemo(
    () => [
      { id: '', label: 'All zones' },
      { id: 'north', label: 'Northern corridor' },
      { id: 'midlands', label: 'Midlands' },
      { id: 'south', label: 'Southern corridor' }
    ],
    []
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Community events</p>
          <h1 className="text-3xl font-semibold text-primary">Live briefings, workshops, and town halls</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Sessions are streamed from Fixnado Live Ops with moderated Q&A and recording distribution within 24 hours.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <select
            value={timeWindow.id}
            onChange={(event) => setTimeWindow(TIME_WINDOWS.find((option) => option.id === event.target.value))}
            className="rounded-full border border-slate-200 px-4 py-2 font-semibold uppercase tracking-[0.3em]"
          >
            {TIME_WINDOWS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={zoneFilter}
            onChange={(event) => setZoneFilter(event.target.value)}
            className="rounded-full border border-slate-200 px-4 py-2 font-semibold uppercase tracking-[0.3em]"
          >
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.label}
              </option>
            ))}
          </select>
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
        <CommunityEventBoard events={events} highlightLimit={3} />
      )}
    </div>
  );
}
