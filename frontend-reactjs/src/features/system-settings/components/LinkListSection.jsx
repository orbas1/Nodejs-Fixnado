import PropTypes from 'prop-types';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { Button, Card, TextArea, TextInput } from '../../../components/ui/index.js';

function renderField(field, value, onChange) {
  const commonProps = {
    label: field.label,
    value,
    onChange
  };

  if (field.component === 'textarea') {
    return <TextArea {...commonProps} rows={field.rows ?? 3} />;
  }

  return <TextInput {...commonProps} />;
}

function LinkListSection({ title, description, links, onChange, onAdd, onRemove, onMove, fieldConfig }) {
  return (
    <Card padding="lg" className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-primary">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      <div className="space-y-4">
        {links.map((link, index) => (
          <div key={`link-${index}`} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(fieldConfig).map(([fieldKey, config]) => (
                <div key={`${fieldKey}-${index}`}>{renderField(config, link[fieldKey] ?? '', onChange(fieldKey, index))}</div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={ArrowUpIcon}
                  onClick={onMove(index, -1)}
                  disabled={index === 0}
                >
                  Move up
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={ArrowDownIcon}
                  onClick={onMove(index, 1)}
                  disabled={index === links.length - 1}
                >
                  Move down
                </Button>
              </div>
              <Button type="button" variant="ghost" onClick={onRemove(index)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={onAdd}>
          Add entry
        </Button>
      </div>
    </Card>
  );
}

const linkShape = PropTypes.shape({
  id: PropTypes.string,
  label: PropTypes.string,
  url: PropTypes.string,
  handle: PropTypes.string,
  type: PropTypes.string,
  icon: PropTypes.string,
  description: PropTypes.string
});

const fieldConfigShape = PropTypes.objectOf(
  PropTypes.shape({
    label: PropTypes.string.isRequired,
    component: PropTypes.oneOf(['input', 'textarea']),
    rows: PropTypes.number
  })
);

LinkListSection.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  links: PropTypes.arrayOf(linkShape).isRequired,
  onChange: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  fieldConfig: fieldConfigShape.isRequired
};

export default LinkListSection;
