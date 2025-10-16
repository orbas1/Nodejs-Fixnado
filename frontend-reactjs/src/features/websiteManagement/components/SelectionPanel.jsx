import PropTypes from 'prop-types';
import { Button, Card, Spinner } from '../../../components/ui/index.js';

export default function SelectionPanel({
  title,
  actionLabel,
  onAction,
  items,
  selectedId,
  onSelect,
  loading,
  emptyMessage
}) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">{title}</h2>
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Spinner className="h-5 w-5 text-primary" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  selectedId === item.id ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 hover:border-primary/60'
                }`}
              >
                <div className="font-medium">{item.label}</div>
                {item.helper ? <div className="text-xs text-slate-500">{item.helper}</div> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

SelectionPanel.propTypes = {
  title: PropTypes.string.isRequired,
  actionLabel: PropTypes.string.isRequired,
  onAction: PropTypes.func.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      helper: PropTypes.string
    })
  ).isRequired,
  selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelect: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string.isRequired
};
