import PropTypes from 'prop-types';
import clsx from 'clsx';
import { cloneElement, isValidElement } from 'react';
import './ui.css';

export default function FormField({
  id,
  label = undefined,
  optionalLabel = undefined,
  hint = undefined,
  error = undefined,
  children,
  className = undefined
}) {
  const describedBy = [];

  if (hint) {
    describedBy.push(`${id}-hint`);
  }

  if (error) {
    describedBy.push(`${id}-error`);
  }

  const child =
    isValidElement(children)
      ? cloneElement(children, {
          id,
          'aria-describedby': describedBy.join(' ') || undefined,
          'aria-invalid': Boolean(error)
        })
      : children;

  return (
    <div className={clsx('fx-field', className)}>
      {label ? (
        <label className="fx-field__label" htmlFor={id}>
          {label}
          {optionalLabel ? <span className="fx-field__optional">{optionalLabel}</span> : null}
        </label>
      ) : null}
      {child}
      {hint ? (
        <p id={`${id}-hint`} className="fx-field__hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="fx-field__error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

FormField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  optionalLabel: PropTypes.string,
  hint: PropTypes.string,
  error: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

