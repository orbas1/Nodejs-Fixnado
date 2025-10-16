import PropTypes from 'prop-types';
import { Button, Card } from '../../../components/ui/index.js';

export default function WalletDrawer({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8 backdrop-blur"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <Card
        as="section"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-slate-200 bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-6 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-primary">{title}</h2>
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close drawer">
            Close
          </Button>
        </header>
        <div className="pt-4">{children}</div>
      </Card>
    </div>
  );
}

WalletDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node
};
