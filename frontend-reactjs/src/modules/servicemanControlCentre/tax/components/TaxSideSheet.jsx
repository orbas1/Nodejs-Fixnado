import PropTypes from 'prop-types';
import Button from '../../../../components/ui/Button.jsx';

export default function TaxSideSheet({ open, title, description, onClose, footer, children }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-10 backdrop-blur" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-primary">{title}</h2>
              {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
            </div>
            <Button variant="ghost" onClick={onClose} aria-label="Close panel">
              Close
            </Button>
          </div>
        </header>
        <div className="max-h-[65vh] overflow-y-auto px-6 py-6">{children}</div>
        {footer ? <footer className="border-t border-slate-200 bg-slate-50/70 px-6 py-4">{footer}</footer> : null}
      </div>
    </div>
  );
}

TaxSideSheet.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  footer: PropTypes.node,
  children: PropTypes.node.isRequired
};

TaxSideSheet.defaultProps = {
  open: false,
  description: undefined,
  footer: null
};
