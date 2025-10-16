import PropTypes from 'prop-types';

const toneStyles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700'
};

export const InlineBanner = ({ tone = 'info', message }) => {
  if (!message) {
    return null;
  }
  const toneClass = toneStyles[tone] ?? toneStyles.info;
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${toneClass}`}>{message}</div>
  );
};

InlineBanner.propTypes = {
  tone: PropTypes.oneOf(['success', 'error', 'info']),
  message: PropTypes.string
};

InlineBanner.defaultProps = {
  tone: 'info',
  message: null
};

export const Field = ({ id, label, description, children }) => (
  <label className="flex flex-col gap-2 text-sm font-medium text-primary" htmlFor={id}>
    <span>{label}</span>
    {children}
    {description ? <span className="text-xs font-normal text-slate-500">{description}</span> : null}
  </label>
);

Field.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired
};

Field.defaultProps = {
  description: null
};

export const TextInput = ({ id, value, onChange, type = 'text', placeholder, ...rest }) => (
  <input
    id={id}
    type={type}
    value={value}
    placeholder={placeholder}
    onChange={(event) => onChange(event.target.value)}
    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
    {...rest}
  />
);

TextInput.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string,
  placeholder: PropTypes.string
};

TextInput.defaultProps = {
  type: 'text',
  placeholder: undefined
};

export const TextArea = ({ id, value, onChange, rows = 4, placeholder }) => (
  <textarea
    id={id}
    rows={rows}
    value={value}
    placeholder={placeholder}
    onChange={(event) => onChange(event.target.value)}
    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
  />
);

TextArea.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  rows: PropTypes.number,
  placeholder: PropTypes.string
};

TextArea.defaultProps = {
  rows: 4,
  placeholder: undefined
};

export const SelectField = ({ id, value, onChange, options }) => (
  <select
    id={id}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

SelectField.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired
};

export const CheckboxField = ({ id, checked, onChange, label, description }) => (
  <label className="flex items-start gap-3 text-sm font-medium text-primary" htmlFor={id}>
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="mt-1 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
    />
    <span>
      <span className="block font-semibold">{label}</span>
      {description ? <span className="text-xs font-normal text-slate-500">{description}</span> : null}
    </span>
  </label>
);

CheckboxField.propTypes = {
  id: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string
};

CheckboxField.defaultProps = {
  description: null
};

export default {
  InlineBanner,
  Field,
  TextInput,
  TextArea,
  SelectField,
  CheckboxField
};
