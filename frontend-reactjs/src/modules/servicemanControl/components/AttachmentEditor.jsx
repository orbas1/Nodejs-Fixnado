import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';

export default function AttachmentEditor({ title, items, onChange, emptyLabel }) {
  const handleUpdate = (index, key, value) => {
    const source = Array.isArray(items) ? items : [];
    const next = source.map((item, itemIndex) =>
      itemIndex === index
        ? {
            ...item,
            [key]: value
          }
        : item
    );
    onChange(next);
  };

  const handleAdd = () => {
    const source = Array.isArray(items) ? items : [];
    onChange([...source, { label: '', url: '', type: 'link' }]);
  };

  const handleRemove = (index) => {
    const source = Array.isArray(items) ? items : [];
    onChange(source.filter((_, itemIndex) => itemIndex !== index));
  };

  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-primary">{title}</p>
        <Button type="button" size="sm" variant="ghost" onClick={handleAdd}>
          Add
        </Button>
      </div>
      <div className="space-y-3">
        {safeItems.map((item, index) => (
          <div
            key={`${item.url ?? 'item'}-${index}`}
            className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm"
          >
            <div className="grid gap-2 md:grid-cols-2">
              <label className="text-xs font-medium text-primary">
                Label
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                  value={item.label ?? ''}
                  onChange={(event) => handleUpdate(index, 'label', event.target.value)}
                  placeholder="Permit document"
                />
              </label>
              <label className="text-xs font-medium text-primary">
                URL
                <input
                  type="url"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                  value={item.url ?? ''}
                  onChange={(event) => handleUpdate(index, 'url', event.target.value)}
                  placeholder="https://"
                />
              </label>
            </div>
            <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <label className="text-xs font-medium text-primary">
                Type
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none"
                  value={item.type ?? 'link'}
                  onChange={(event) => handleUpdate(index, 'type', event.target.value)}
                  placeholder="link"
                />
              </label>
              <Button type="button" size="xs" variant="ghost" onClick={() => handleRemove(index)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
        {!safeItems.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
            {emptyLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}

AttachmentEditor.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      url: PropTypes.string,
      type: PropTypes.string
    })
  ),
  onChange: PropTypes.func.isRequired,
  emptyLabel: PropTypes.string
};

AttachmentEditor.defaultProps = {
  items: [],
  emptyLabel: 'No attachments yet.'
};
