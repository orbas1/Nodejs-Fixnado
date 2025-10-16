import { forwardRef, useId } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import './ui.css';

const Select = forwardRef(function Select(
  { id, label, optionalLabel, hint, error, options, className, selectClassName, children, ...rest },
  { id, label, optionalLabel, hint, error, options = [], className, selectClassName, ...rest },
  {
    id,
    label,
    optionalLabel,
    hint,
    error,
    options,
    className,
    selectClassName,
    children,
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy = [];

  if (hint) {
    describedBy.push(`${fieldId}-hint`);
  }

  if (error) {
    describedBy.push(`${fieldId}-error`);
  }

  const resolvedOptions = Array.isArray(options) ? options : [];
  const optionNodes = Array.isArray(options) && options.length > 0
    ? options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))
    : children;

  return (
    <div className={clsx('fx-field', className)}>
      {label ? (
        <label className="fx-field__label" htmlFor={fieldId}>
          {label}
          {optionalLabel ? <span className="fx-field__optional">{optionalLabel}</span> : null}
        </label>
      ) : null}
      <select
        ref={ref}
        id={fieldId}
        className={clsx('fx-select', 'fx-text-input', error && 'fx-text-input--error', selectClassName)}
        className={clsx('fx-select', error && 'fx-select--error', selectClassName)}
        aria-describedby={describedBy.join(' ') || undefined}
        aria-invalid={Boolean(error)}
        {...rest}
      >
        {resolvedOptions.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
        {optionNodes}
      </select>
      {hint ? (
        <p id={`${fieldId}-hint`} className="fx-field__hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="fx-field__error">
          {error}
        </p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';

Select.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  optionalLabel: PropTypes.string,
  hint: PropTypes.string,
  error: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.node.isRequired,
      disabled: PropTypes.bool
    })
  ),
  className: PropTypes.string,
  selectClassName: PropTypes.string
  selectClassName: PropTypes.string,
  children: PropTypes.node
};

Select.defaultProps = {
  id: undefined,
  label: undefined,
  optionalLabel: undefined,
  hint: undefined,
  error: undefined,
  options: undefined,
  className: undefined,
  selectClassName: undefined
  selectClassName: undefined,
  children: undefined
};

export default Select;
