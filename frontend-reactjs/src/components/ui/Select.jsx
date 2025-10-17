import { forwardRef, useId } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import './ui.css';

const Select = forwardRef(function Select(
  { id, label, optionalLabel, hint, error, options = [], className, selectClassName, children, ...rest },
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
  const shouldRenderChildren = resolvedOptions.length === 0 && children;

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
        aria-describedby={describedBy.join(' ') || undefined}
        aria-invalid={Boolean(error)}
        {...rest}
      >
        {resolvedOptions.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
        {shouldRenderChildren ? children : null}
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
  label: PropTypes.node,
  optionalLabel: PropTypes.node,
  hint: PropTypes.node,
  error: PropTypes.node,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.node.isRequired,
      disabled: PropTypes.bool
    })
  ),
  children: PropTypes.node,
  className: PropTypes.string,
  selectClassName: PropTypes.string
};

Select.defaultProps = {
  id: undefined,
  label: undefined,
  optionalLabel: undefined,
  hint: undefined,
  error: undefined,
  options: undefined,
  children: undefined,
  className: undefined,
  selectClassName: undefined
};

export default Select;
