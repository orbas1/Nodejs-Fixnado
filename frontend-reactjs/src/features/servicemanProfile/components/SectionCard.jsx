import PropTypes from 'prop-types';
import StatusBanner from '../../../components/dashboard/customer-settings/StatusBanner.jsx';

function SectionCard({
  title,
  description,
  onSubmit,
  saving,
  status,
  submitLabel,
  children
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-2xl border border-accent/10 bg-white/95 p-6 shadow-md"
      noValidate
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-primary">{title}</h3>
          {description ? <p className="mt-1 text-sm text-slate-600 max-w-2xl">{description}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-2 sm:min-w-[180px]">
          {status ? <StatusBanner status={status} /> : null}
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
          >
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </div>
      <div className="grid gap-4">{children}</div>
    </form>
  );
}

SectionCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    message: PropTypes.string.isRequired
  }),
  submitLabel: PropTypes.string,
  children: PropTypes.node
};

SectionCard.defaultProps = {
  description: null,
  saving: false,
  status: null,
  submitLabel: 'Save changes',
  children: null
};

export default SectionCard;
