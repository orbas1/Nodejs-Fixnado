import PropTypes from 'prop-types';
import { ArchiveBoxArrowDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import Button from '../../ui/Button.jsx';
import FormField from '../../ui/FormField.jsx';

export default function CollectionEditor({ title, description, items, onChange, template, fields, addLabel }) {
  const handleFieldChange = (index, field, value) => {
    const next = items.map((item, itemIndex) =>
      itemIndex === index
        ? {
            ...item,
            [field]: value
          }
        : item
    );
    onChange(next);
  };

  const handleRemove = (index) => {
    const next = items.filter((_, itemIndex) => itemIndex !== index);
    onChange(next);
  };

  return (
    <fieldset className="rounded-3xl border border-dashed border-accent/20 bg-secondary/50 p-5">
      <legend className="text-sm font-semibold uppercase tracking-widest text-primary/70">{title}</legend>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      <div className="mt-4 space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No entries yet.</p>
        ) : (
          items.map((item, index) => (
            <div key={`${title}-${index}`} className="rounded-2xl border border-accent/20 bg-white/90 p-4 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map((field) => (
                  <FormField
                    key={`${field.name}-${index}`}
                    id={`${title}-${field.name}-${index}`}
                    label={field.label}
                    optionalLabel={field.optional ? 'Optional' : undefined}
                  >
                    {field.type === 'textarea' ? (
                      <textarea
                        className="fx-text-input min-h-[120px]"
                        value={item[field.name] ?? ''}
                        onChange={(event) => handleFieldChange(index, field.name, event.target.value)}
                      />
                    ) : (
                      <input
                        className="fx-text-input"
                        type={field.type ?? 'text'}
                        value={item[field.name] ?? ''}
                        onChange={(event) => handleFieldChange(index, field.name, event.target.value)}
                      />
                    )}
                  </FormField>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  icon={ArchiveBoxArrowDownIcon}
                  iconPosition="start"
                >
                  Remove entry
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-4">
        <Button
          variant="secondary"
          size="sm"
          icon={PlusIcon}
          iconPosition="start"
          onClick={() => onChange([...items, { ...template }])}
        >
          {addLabel}
        </Button>
      </div>
    </fieldset>
  );
}

CollectionEditor.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  onChange: PropTypes.func.isRequired,
  template: PropTypes.object.isRequired,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      optional: PropTypes.bool,
      type: PropTypes.string
    })
  ).isRequired,
  addLabel: PropTypes.string.isRequired
};

CollectionEditor.defaultProps = {
  description: undefined
};
