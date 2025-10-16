import PropTypes from 'prop-types';
import { StatusPill } from '../ui/index.js';
import Spinner from '../ui/Spinner.jsx';
import useAuditTimeline from './useAuditTimeline.js';
import AuditTimelineHeader from './AuditTimelineHeader.jsx';
import AuditTimelineSummary from './AuditTimelineSummary.jsx';
import AuditTimelineStats from './AuditTimelineStats.jsx';
import AuditTimelineTable from './AuditTimelineTable.jsx';
import AuditTimelineDetailDialog from './AuditTimelineDetailDialog.jsx';
import AuditTimelineEditorDialog from './AuditTimelineEditorDialog.jsx';

const AuditTimelineSection = ({ section }) => {
  const timeline = useAuditTimeline(section);

  const handleFieldChange = (key, value) => {
    timeline.setFormData((current) => ({ ...current, [key]: value }));
  };

  const hasEvents = timeline.combinedEvents.length > 0;

  return (
    <div className="space-y-8">
      <AuditTimelineHeader
        label={section.label}
        description={section.description}
        timeframe={timeline.timeframe}
        onTimeframeChange={timeline.setTimeframe}
        categoryFilter={timeline.categoryFilter}
        onCategoryChange={timeline.setCategoryFilter}
        statusFilter={timeline.statusFilter}
        onStatusChange={timeline.setStatusFilter}
        onCreate={timeline.openCreateModal}
        onRefresh={timeline.refreshTimeline}
        onExport={timeline.exportTimeline}
        busy={timeline.loading}
        canExport={hasEvents}
      />

      <AuditTimelineSummary
        manualEventCount={timeline.manualEventCount}
        systemEventCount={timeline.systemEventCount}
        timeframeLabel={timeline.timeframeLabel}
        rangeDisplay={timeline.rangeDisplay}
        lastUpdatedDisplay={timeline.lastUpdatedDisplay}
        timezoneDisplay={timeline.timezoneDisplay}
      />

      {timeline.error ? <StatusPill tone="danger">{timeline.error}</StatusPill> : null}
      {timeline.loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Spinner className="h-4 w-4" /> Loading audit entries…
        </div>
      ) : null}

      <AuditTimelineStats categoryStats={timeline.categoryStats} statusStats={timeline.statusStats} />

      <AuditTimelineTable
        events={timeline.combinedEvents}
        onView={timeline.setDetailEvent}
        onEdit={timeline.openEditModal}
        onDelete={timeline.handleDelete}
      />

      <AuditTimelineDetailDialog event={timeline.detailEvent} onClose={() => timeline.setDetailEvent(null)} />

      <AuditTimelineEditorDialog
        state={timeline.editorState}
        formData={timeline.formData}
        formErrors={timeline.formErrors}
        onFieldChange={handleFieldChange}
        onAttachmentChange={timeline.handleAttachmentChange}
        onAddAttachment={timeline.addAttachmentRow}
        onRemoveAttachment={timeline.removeAttachmentRow}
        onClose={timeline.closeEditor}
        onSave={timeline.handleSave}
        saving={timeline.saving}
      />
    </div>
  );
};

AuditTimelineSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    data: PropTypes.shape({
      events: PropTypes.array,
      summary: PropTypes.object,
      initialTimeframe: PropTypes.string
    })
  }).isRequired
};

export default AuditTimelineSection;
