import { useCallback, useEffect, useState } from 'react';
import InstructorSupportInbox from '../../components/instructor/InstructorSupportInbox.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { fetchSupportInbox, replyToSupportTicket } from '../../api/instructorClient.js';
import { useLocale } from '../../hooks/useLocale.js';

export default function InstructorSupport() {
  const { t } = useLocale();
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('open');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyingId, setReplyingId] = useState(null);

  const loadTickets = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSupportInbox(
        {
          status: statusFilter === 'all' ? undefined : statusFilter,
          priority: priorityFilter === 'all' ? undefined : priorityFilter
        },
        { signal }
      );
      setTickets(data.tickets);
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('[InstructorSupport] Failed to fetch tickets', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, statusFilter]);

  useEffect(() => {
    const controller = new AbortController();
    loadTickets(controller.signal);
    return () => controller.abort();
  }, [loadTickets]);

  const handleReply = useCallback(
    async (ticketId, message) => {
      setReplyingId(ticketId);
      try {
        await replyToSupportTicket(ticketId, { message });
        await loadTickets();
      } catch (err) {
        console.error('[InstructorSupport] Failed to reply to ticket', err);
        setError(err);
      } finally {
        setReplyingId(null);
      }
    },
    [loadTickets]
  );

  return (
    <div className="space-y-6 px-4 py-8 md:px-8" data-qa="instructor-support">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/60">{t('instructor.support.eyebrow')}</p>
        <h1 className="text-3xl font-semibold text-primary">{t('instructor.support.title')}</h1>
        <p className="text-sm text-slate-600">{t('instructor.support.description')}</p>
      </header>

      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm md:grid-cols-3">
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {t('instructor.support.statusFilter')}
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
          >
            <option value="all">{t('instructor.support.statusAll')}</option>
            <option value="open">{t('instructor.support.status.open')}</option>
            <option value="pending">{t('instructor.support.status.pending')}</option>
            <option value="resolved">{t('instructor.support.status.resolved')}</option>
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {t('instructor.support.priorityFilter')}
          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
          >
            <option value="all">{t('instructor.support.priorityAll')}</option>
            <option value="low">{t('instructor.support.priority.low')}</option>
            <option value="medium">{t('instructor.support.priority.medium')}</option>
            <option value="high">{t('instructor.support.priority.high')}</option>
            <option value="urgent">{t('instructor.support.priority.urgent')}</option>
          </select>
        </label>
        <div className="flex items-end justify-end">
          <button
            type="button"
            onClick={() => loadTickets()}
            className="rounded-full border border-primary/20 bg-primary px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            {t('instructor.support.refreshCta')}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700" role="alert">
          <p className="font-semibold">{t('instructor.support.errorTitle')}</p>
          <p className="mt-2">{error?.message || t('instructor.support.errorDescription')}</p>
        </div>
      ) : null}

      {loading && tickets.length === 0 ? (
        <div className="space-y-4">
          <Skeleton lines={6} className="h-48" />
          <div className="flex justify-center py-8">
            <Spinner label={t('instructor.support.loading')} />
          </div>
        </div>
      ) : null}

      <InstructorSupportInbox tickets={tickets} onReply={handleReply} replyingId={replyingId} />
    </div>
  );
}
