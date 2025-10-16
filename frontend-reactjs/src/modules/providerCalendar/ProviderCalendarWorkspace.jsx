import { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import Spinner from '../../components/ui/Spinner.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useProviderCalendar } from './ProviderCalendarProvider.jsx';
import CalendarToolbar from './components/CalendarToolbar.jsx';
import CalendarSummary from './components/CalendarSummary.jsx';
import CalendarGrid from './components/CalendarGrid.jsx';
import BookingInspector from './components/BookingInspector.jsx';
import EventEditorModal from './components/EventEditorModal.jsx';
import BookingEditorModal from './components/BookingEditorModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import CalendarLegend from './components/CalendarLegend.jsx';
import UpcomingSchedule from './components/UpcomingSchedule.jsx';

const ProviderCalendarWorkspace = ({ legendTitle, upcomingTitle, emptyUpcomingLabel }) => {
  const {
    calendar,
    bookings,
    settings,
    permissions,
    meta,
    loading,
    settingsOpen,
    eventModalOpen,
    bookingModalOpen,
    actions
  } = useProviderCalendar();
  const { t } = useLocale();
  const { refreshCalendar, selectItem, openBookingEditor } = actions;
  const canManageBookings = permissions?.canManageBookings !== false;

  useEffect(() => {
    if (!meta?.companyId) {
      return;
    }
    if (calendar?.weeks?.length) {
      return;
    }
    refreshCalendar();
  }, [calendar?.weeks?.length, meta?.companyId, refreshCalendar]);

  const sortedBookings = useMemo(() => {
    return bookings
      .slice()
      .filter((booking) => booking.start)
      .sort((a, b) => new Date(a.start) - new Date(b.start));
  }, [bookings]);

  const workingHours = {
    start: settings?.workdayStart || '08:00',
    end: settings?.workdayEnd || '18:00'
  };
  const timezoneLabel = settings?.timezone || meta?.timezone || 'Europe/London';

  return (
    <div className="space-y-6">
      <CalendarToolbar />
      <CalendarSummary />
      <div className="grid gap-6 xl:grid-cols-[2fr_minmax(320px,1fr)]">
        <div className="space-y-6">
          <div className="relative">
            {loading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/60 backdrop-blur">
                <Spinner aria-label={t('common.loading')} />
              </div>
            ) : null}
            <CalendarGrid />
          </div>
          <UpcomingSchedule
            bookings={sortedBookings}
            title={upcomingTitle || t('providerDashboard.calendarUpcomingHeadline')}
            emptyLabel={{
              message: emptyUpcomingLabel?.message || t('providerDashboard.calendarEmptyUpcoming'),
              ctaLabel: emptyUpcomingLabel?.ctaLabel || t('providerDashboard.calendarNewBooking')
            }}
            onSelect={selectItem}
            onCreate={() => openBookingEditor(null)}
            canCreate={canManageBookings}
          />
        </div>
        <div className="space-y-6">
          <BookingInspector />
          <CalendarLegend
            legend={calendar?.legend || []}
            title={legendTitle || t('providerDashboard.calendarLegendHeadline')}
          />
          <div className="rounded-3xl border border-accent/10 bg-white/80 p-6 text-sm text-slate-600 shadow-sm">
            <h3 className="text-sm font-semibold text-primary">{t('providerDashboard.calendarSettingsSummary')}</h3>
            <dl className="mt-3 space-y-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {t('providerDashboard.calendarTimezoneLabel')}
                </dt>
                <dd className="text-sm font-medium text-primary">{timezoneLabel}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {t('providerDashboard.calendarWorkingHoursLabel')}
                </dt>
                <dd className="text-sm font-medium text-primary">
                  {t('providerDashboard.calendarWorkingHours', workingHours)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Automation</dt>
                <dd className="text-xs text-slate-500">
                  {settings?.autoAcceptAssignments
                    ? t('providerDashboard.calendarAutoAcceptOn')
                    : t('providerDashboard.calendarAutoAcceptOff')}
                </dd>
                <dd className="text-xs text-slate-500">
                  {settings?.allowOverlapping
                    ? t('providerDashboard.calendarOverlappingOn')
                    : t('providerDashboard.calendarOverlappingOff')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      <EventEditorModal open={eventModalOpen} />
      <BookingEditorModal open={bookingModalOpen} />
      <SettingsModal open={settingsOpen} />
    </div>
  );
};

ProviderCalendarWorkspace.propTypes = {
  legendTitle: PropTypes.node,
  upcomingTitle: PropTypes.node,
  emptyUpcomingLabel: PropTypes.shape({
    message: PropTypes.node,
    ctaLabel: PropTypes.node
  })
};

ProviderCalendarWorkspace.defaultProps = {
  legendTitle: null,
  upcomingTitle: null,
  emptyUpcomingLabel: null
};

export default ProviderCalendarWorkspace;
