import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import ProviderBookingManagementProvider, {
  useProviderBookingManagement
} from './ProviderBookingManagementProvider.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import BookingList from './components/BookingList.jsx';
import BookingDetailPanel from './components/BookingDetailPanel.jsx';
import BookingSettingsPanel from './components/BookingSettingsPanel.jsx';

function matchesFilter(booking, filterStatus) {
  if (!filterStatus || filterStatus === 'all') {
    return true;
  }
  if (filterStatus === 'pending') {
    return (
      booking.status === 'pending' ||
      booking.assignments?.some((assignment) => assignment.status === 'pending')
    );
  }
  return booking.status === filterStatus;
}

function matchesSearch(booking, searchTerm) {
  if (!searchTerm) return true;
  const haystack = `${booking.title} ${booking.customer?.name ?? ''} ${booking.tags?.join(' ') ?? ''}`.toLowerCase();
  return haystack.includes(searchTerm.toLowerCase());
}

function WorkspaceBody() {
  const {
    workspace,
    loading,
    error,
    refresh,
    updateStatus,
    updateSchedule,
    updateDetails,
    createNote,
    createTimelineEntry,
    updateSettings,
    savingSettings
  } = useProviderBookingManagement();

  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const bookings = workspace?.bookings ?? [];

  const filteredBookings = useMemo(
    () =>
      bookings.filter(
        (booking) => matchesFilter(booking, statusFilter) && matchesSearch(booking, searchTerm)
      ),
    [bookings, statusFilter, searchTerm]
  );

  useEffect(() => {
    if (!filteredBookings.length) {
      setSelectedBookingId(null);
      return;
    }
    if (
      !selectedBookingId ||
      !filteredBookings.some((booking) => booking.bookingId === selectedBookingId)
    ) {
      setSelectedBookingId(filteredBookings[0].bookingId);
    }
  }, [filteredBookings, selectedBookingId]);

  const selectedBooking = useMemo(() => {
    if (!filteredBookings.length) {
      return null;
    }
    return (
      filteredBookings.find((booking) => booking.bookingId === selectedBookingId) ??
      filteredBookings[0]
    );
  }, [filteredBookings, selectedBookingId]);

  const summary = workspace?.summary ?? null;
  const timezone = workspace?.timezone ?? 'UTC';
  const companyId = workspace?.companyId ?? '—';

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Booking management</p>
            <h1 className="mt-2 text-2xl font-semibold text-primary">Provider control workspace</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <StatusPill tone="info">Company ID · {companyId}</StatusPill>
              <StatusPill tone="accent">Timezone · {timezone}</StatusPill>
              <StatusPill tone="positive">Bookings · {bookings.length}</StatusPill>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" onClick={() => refresh()} disabled={loading}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="1rem" /> Loading
                </span>
              ) : (
                'Refresh workspace'
              )}
            </Button>
            <Button type="button" variant="primary" onClick={() => refresh({ silent: false })}>
              Force sync
            </Button>
          </div>
        </div>
        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
            <p className="font-semibold">Unable to load booking workspace</p>
            <p className="mt-1">{error}</p>
            <Button type="button" className="mt-3" size="sm" variant="ghost" onClick={() => refresh()}>
              Retry
            </Button>
          </div>
        ) : null}
      </header>

      {summary ? <SummaryCards summary={summary} /> : null}

      <div className="grid gap-6 xl:grid-cols-[320px_1fr] 2xl:grid-cols-[320px_1.6fr_1fr]">
        <aside className="space-y-4">
          <BookingList
            bookings={bookings}
            selectedBookingId={selectedBooking?.bookingId ?? null}
            onSelect={(bookingId) => setSelectedBookingId(bookingId)}
            filterStatus={statusFilter}
            onFilterChange={setStatusFilter}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onRefresh={refresh}
          />
        </aside>
        <section>
          <BookingDetailPanel
            booking={selectedBooking}
            timezone={timezone}
            onRefresh={refresh}
            onUpdateStatus={(payload) =>
              selectedBooking ? updateStatus(selectedBooking.bookingId, payload) : Promise.resolve()
            }
            onUpdateSchedule={(payload) =>
              selectedBooking ? updateSchedule(selectedBooking.bookingId, payload) : Promise.resolve()
            }
            onUpdateDetails={(payload) =>
              selectedBooking ? updateDetails(selectedBooking.bookingId, payload) : Promise.resolve()
            }
            onCreateNote={(payload) =>
              selectedBooking ? createNote(selectedBooking.bookingId, payload) : Promise.resolve()
            }
            onCreateTimelineEntry={(payload) =>
              selectedBooking ? createTimelineEntry(selectedBooking.bookingId, payload) : Promise.resolve()
            }
          />
        </section>
        <aside>
          <BookingSettingsPanel settings={workspace?.settings ?? null} onSave={updateSettings} saving={savingSettings} />
        </aside>
      </div>
    </div>
  );
}

function ProviderBookingManagementWorkspace({ companyId, initialWorkspace }) {
  return (
    <ProviderBookingManagementProvider companyId={companyId} initialWorkspace={initialWorkspace}>
      <WorkspaceBody />
    </ProviderBookingManagementProvider>
  );
}

ProviderBookingManagementWorkspace.propTypes = {
  companyId: PropTypes.string,
  initialWorkspace: PropTypes.object
};

ProviderBookingManagementWorkspace.defaultProps = {
  companyId: null,
  initialWorkspace: null
};

export default ProviderBookingManagementWorkspace;
