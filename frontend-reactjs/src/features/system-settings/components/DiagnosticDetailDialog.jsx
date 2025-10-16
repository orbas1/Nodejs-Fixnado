import { Fragment, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { StatusPill, Button } from '../../../components/ui/index.js';
import { DATE_FORMATTER, SECTION_LABELS, STATUS_TONES } from '../utils.js';

function normaliseMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return [];
  }
  return Object.entries(metadata)
    .filter(([key]) => key !== 'sectionLabel')
    .map(([key, value]) => {
      let displayValue = value;
      if (typeof value === 'boolean') {
        displayValue = value ? 'Yes' : 'No';
      } else if (value instanceof Date) {
        displayValue = DATE_FORMATTER.format(value);
      } else if (typeof value === 'number' && key.toLowerCase().includes('duration')) {
        displayValue = `${value.toFixed(1)} ms`;
      } else if (value && typeof value === 'object') {
        displayValue = JSON.stringify(value, null, 2);
      }

      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/[-_]/g, ' ')
        .replace(/^./, (char) => char.toUpperCase());

      return { key, label, value: displayValue };
    });
}

function DiagnosticDetailDialog({ diagnostic, open, onClose }) {
  const metadataEntries = useMemo(() => normaliseMetadata(diagnostic?.metadata), [diagnostic]);
  const label = diagnostic ? SECTION_LABELS[diagnostic.section] ?? diagnostic.section : '';
  const tone = diagnostic ? STATUS_TONES[diagnostic.status] ?? 'warning' : 'warning';
  const timestamp = diagnostic?.createdAt instanceof Date && !Number.isNaN(diagnostic.createdAt.valueOf())
    ? DATE_FORMATTER.format(diagnostic.createdAt)
    : null;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-6 text-left align-middle shadow-xl transition-all sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Dialog.Title as="h3" className="text-2xl font-semibold text-slate-900">
                      {label || 'Diagnostic details'}
                    </Dialog.Title>
                    {diagnostic ? (
                      <p className="mt-1 text-sm text-slate-600">{diagnostic.message}</p>
                    ) : null}
                  </div>
                  <StatusPill tone={tone}>{diagnostic?.status ?? 'unknown'}</StatusPill>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Run by</p>
                      <p className="mt-1 text-sm text-slate-800">{diagnostic?.performedBy || 'System'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timestamp</p>
                      <p className="mt-1 text-sm text-slate-800">{timestamp || '—'}</p>
                    </div>
                  </div>

                  {metadataEntries.length ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                      <p className="text-sm font-semibold text-slate-700">Metadata</p>
                      <dl className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
                        {metadataEntries.map((entry) => (
                          <div key={entry.key} className="rounded-xl border border-slate-200 bg-white/80 p-3">
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {entry.label}
                            </dt>
                            <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">
                              {entry.value === '' || entry.value === null ? '—' : entry.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ) : null}
                </div>

                <div className="mt-8 flex justify-end">
                  <Button type="button" variant="secondary" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

DiagnosticDetailDialog.propTypes = {
  diagnostic: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    section: PropTypes.string,
    status: PropTypes.string,
    message: PropTypes.string,
    metadata: PropTypes.object,
    performedBy: PropTypes.string,
    createdAt: PropTypes.instanceOf(Date)
  }),
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired
};

DiagnosticDetailDialog.defaultProps = {
  diagnostic: null,
  open: false
};

export default DiagnosticDetailDialog;
