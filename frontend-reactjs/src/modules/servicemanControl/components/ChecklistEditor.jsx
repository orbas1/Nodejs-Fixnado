import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';

export default function ChecklistEditor({ items, onChange }) {
  const handleUpdate = (index, key, value) => {
    const source = Array.isArray(items) ? items : [];
    const next = source.map((item, itemIndex) =>
      itemIndex === index
        ? {
            ...item,
            [key]: key === 'mandatory' ? Boolean(value) : value
          }
        : item
    );
    onChange(next);
  };

  const handleAdd = () => {
    const nextId = `item-${Date.now()}`;
    const source = Array.isArray(items) ? items : [];
    onChange([...source, { id: nextId, label: '', mandatory: false }]);
  };

  const handleRemove = (index) => {
    const source = Array.isArray(items) ? items : [];
    onChange(source.filter((_, itemIndex) => itemIndex !== index));
  };

  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-primary">Checklist items</p>
        <Button type="button" size="sm" variant="ghost" onClick={handleAdd}>
          Add item
        </Button>
      </div>
      <div className="space-y-3">
        {safeItems.map((item, index) => (
          <div
            key={item.id ?? `${index}`}
            className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              <label className="flex-1 text-xs font-medium text-primary">
                Label
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                  value={item.label ?? ''}
                  onChange={(event) => handleUpdate(index, 'label', event.target.value)}
                  placeholder="Inspect ceiling tiles"
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary/70">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  checked={item.mandatory === true}
                  onChange={(event) => handleUpdate(index, 'mandatory', event.target.checked)}
                />
                Mandatory
              </label>
            </div>
            <div className="mt-2 text-right">
              <Button type="button" size="xs" variant="ghost" onClick={() => handleRemove(index)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
        {!safeItems.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
            No checklist items yet. Add items to guide crews on site.
          </p>
        ) : null}
      </div>
    </div>
  );
}

ChecklistEditor.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string,
      mandatory: PropTypes.bool
    })
  ),
  onChange: PropTypes.func.isRequired
};

ChecklistEditor.defaultProps = {
  items: []
};
