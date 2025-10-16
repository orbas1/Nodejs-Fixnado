import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import Skeleton from '../../../components/ui/Skeleton.jsx';
import ReportModal from './ReportModal.jsx';

function ReportRow({ report, onEdit, onDelete, deleting }) {
  const updated = report.updatedAt ? new Date(report.updatedAt).toLocaleString() : 'Never';
  const metrics = report.metrics || {};
  return (
    <tr className="border-b border-slate-100 last:border-none">
      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">{report.name}</td>
      <td className="px-4 py-3 text-sm text-slate-500">
        <div className="flex flex-wrap gap-2">
          {Object.entries(report.filters || {})
            .filter(([, value]) => value)
            .map(([key, value]) => (
              <span key={key} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
                {key}: {value}
              </span>
            ))}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">
        {metrics.winRate != null ? `Win rate ${(metrics.winRate * 100).toFixed(0)}%` : '—'}
        <br />
        {metrics.totalBids != null ? `${metrics.totalBids} bids` : ''}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{updated}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => onEdit(report)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(report.id)} loading={deleting}>
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}

ReportRow.propTypes = {
  report: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    filters: PropTypes.object,
    metrics: PropTypes.object,
    updatedAt: PropTypes.string
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  deleting: PropTypes.bool
};

ReportRow.defaultProps = {
  deleting: false
};

export default function ReportManager({ reports, filters, loading, savingReport, deletingReportId, onCreate, onUpdate, onDelete }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeReport, setActiveReport] = useState(null);

  const openCreate = () => {
    setActiveReport(null);
    setModalOpen(true);
  };

  const openEdit = (report) => {
    setActiveReport(report);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setActiveReport(null);
  };

  const handleSubmit = async (payload) => {
    if (activeReport?.id) {
      await onUpdate(activeReport.id, payload);
    } else {
      await onCreate(payload);
    }
    handleClose();
  };

  const rows = useMemo(() => reports || [], [reports]);

  return (
    <section id="provider-custom-jobs-reports" className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">Reports & insights</h2>
          <p className="text-sm text-slate-500">Save reusable filters for quick performance reviews.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          New report
        </Button>
      </header>
      {loading ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
          No reports yet. Create a saved report to monitor bidding performance over time.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-[0.25em] text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Name</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Filters</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Metrics</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Updated</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((report) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  onEdit={openEdit}
                  onDelete={onDelete}
                  deleting={deletingReportId === report.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ReportModal
        open={modalOpen}
        report={activeReport}
        filters={filters}
        onSubmit={handleSubmit}
        onClose={handleClose}
        saving={savingReport}
      />
    </section>
  );
}

ReportManager.propTypes = {
  reports: PropTypes.arrayOf(ReportRow.propTypes.report),
  filters: PropTypes.shape({
    zones: PropTypes.array,
    categories: PropTypes.array
  }),
  loading: PropTypes.bool,
  savingReport: PropTypes.bool,
  deletingReportId: PropTypes.string,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

ReportManager.defaultProps = {
  reports: [],
  filters: { zones: [], categories: [] },
  loading: false,
  savingReport: false,
  deletingReportId: null
};
