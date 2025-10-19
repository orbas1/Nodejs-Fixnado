import { useEffect, useState } from 'react';
import CommunityModerationQueue from '../components/community/CommunityModerationQueue.jsx';
import {
  fetchModerationQueue,
  resolveModerationCase
} from '../api/communityClient.js';
import Spinner from '../components/ui/Spinner.jsx';
import { recordPersonaAnalytics } from '../utils/personaAnalytics.js';
import { useSession } from '../hooks/useSession.js';
import { useCurrentRole } from '../hooks/useCurrentRole.js';

const ALLOWED_PERSONAS = ['admin', 'company'];

export default function CommunityModeration() {
  const { role } = useSession();
  const persona = useCurrentRole();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);

  const allowed = ALLOWED_PERSONAS.includes(role) || ALLOWED_PERSONAS.includes(persona);

  useEffect(() => {
    if (!allowed) {
      recordPersonaAnalytics('community.moderation.denied', {
        persona,
        outcome: 'denied',
        allowed: ALLOWED_PERSONAS,
        metadata: { role }
      });
      return;
    }

    let isMounted = true;
    const abortController = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchModerationQueue({}, { signal: abortController.signal });
        if (!isMounted) {
          return;
        }
        setCases(payload);
        recordPersonaAnalytics('community.moderation.view', {
          persona,
          outcome: 'success',
          metadata: {
            openCases: payload.length
          }
        });
      } catch (loadError) {
        if (loadError.name === 'AbortError') {
          return;
        }
        console.warn('[CommunityModeration] failed to load queue', loadError);
        if (isMounted) {
          setError(loadError.message || 'Unable to load moderation queue');
          recordPersonaAnalytics('community.moderation.view', {
            persona,
            outcome: 'error',
            reason: loadError.message
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    const refresh = window.setInterval(load, 1000 * 60 * 2);

    return () => {
      isMounted = false;
      abortController.abort();
      window.clearInterval(refresh);
    };
  }, [allowed, persona, role]);

  const handleResolve = async (item, action) => {
    setResolvingId(item.id);
    try {
      await resolveModerationCase(item.id, action.intent, { note: action.label });
      setCases((current) => current.filter((entry) => entry.id !== item.id));
      recordPersonaAnalytics('community.moderation.resolve', {
        persona,
        outcome: 'success',
        metadata: {
          caseId: item.id,
          decision: action.intent
        }
      });
    } catch (resolveError) {
      console.warn('[CommunityModeration] failed to resolve case', resolveError);
      setError(resolveError.message || 'Unable to resolve case');
      recordPersonaAnalytics('community.moderation.resolve', {
        persona,
        outcome: 'error',
        reason: resolveError.message,
        metadata: { caseId: item.id, decision: action.intent }
      });
    } finally {
      setResolvingId(null);
    }
  };

  if (!allowed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-8 text-sm text-amber-800">
          Access denied. Community moderation is restricted to approved operators.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Moderation</p>
        <h1 className="text-3xl font-semibold text-primary">Protect community health</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Review flagged posts, escalations, and ads breaches. Actions instantly sync to the timeline feed and audit ledger.
        </p>
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
        <CommunityModerationQueue cases={cases} onResolve={handleResolve} resolvingId={resolvingId} />
      )}
    </div>
  );
}
