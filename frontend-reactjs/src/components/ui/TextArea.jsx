import { forwardRef, useId } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import './ui.css';

const TextArea = forwardRef(function TextArea(
  { id, label, hint, error, className, inputClassName, rows = 6, ...rest },
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

  return (
    <div className={clsx('fx-field', className)}>
      {label ? (
        <label className="fx-field__label" htmlFor={fieldId}>
          {label}
        </label>
      ) : null}
      <div className="fx-textarea-wrapper">
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          className={clsx('fx-textarea', error && 'fx-textarea--error', inputClassName)}
          aria-describedby={describedBy.join(' ') || undefined}
          aria-invalid={Boolean(error)}
          {...rest}
        />
      </div>
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

TextArea.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  hint: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  rows: PropTypes.number
};

TextArea.defaultProps = {
  id: undefined,
  label: undefined,
  hint: undefined,
  error: undefined,
  className: undefined,
  inputClassName: undefined,
  rows: 6
};

export default TextArea;
