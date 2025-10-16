import { forwardRef, useId } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import './ui.css';

const Select = forwardRef(function Select(
  { id, label, optionalLabel, hint, error, options, className, selectClassName, ...rest },
  ref
) {
const Select = forwardRef(({ id, label, hint, error, className, children, ...rest }, ref) => {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy = [];

  if (hint) {
    describedBy.push(`${fieldId}-hint`);
  }

  if (error) {
    describedBy.push(`${fieldId}-error`);
  }

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
        className={clsx('fx-select', error && 'fx-select--error', selectClassName)}
        className={clsx('fx-text-input', error && 'fx-text-input--error')}
        aria-describedby={describedBy.join(' ') || undefined}
        aria-invalid={Boolean(error)}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
        {children}
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
Select.displayName = 'Select';

Select.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  hint: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

Select.defaultProps = {
  id: undefined,
  label: undefined,
  optionalLabel: undefined,
  hint: undefined,
  error: undefined,
  options: [],
  className: undefined,
  selectClassName: undefined
  hint: undefined,
  error: undefined,
  className: undefined
};

export default Select;
