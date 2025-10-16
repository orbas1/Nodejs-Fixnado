import { forwardRef, useId } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import './ui.css';

const Textarea = forwardRef(function Textarea(
  { id, label, optionalLabel, hint, error, className, textareaClassName, rows = 4, ...rest },
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
          {optionalLabel ? <span className="fx-field__optional">{optionalLabel}</span> : null}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        className={clsx('fx-text-input fx-textarea', error && 'fx-text-input--error', textareaClassName)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy.join(' ') || undefined}
        {...rest}
      />
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

Textarea.displayName = 'Textarea';

Textarea.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  optionalLabel: PropTypes.string,
  hint: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
  textareaClassName: PropTypes.string,
  rows: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

Textarea.defaultProps = {
  id: undefined,
  label: undefined,
  optionalLabel: undefined,
  hint: undefined,
  error: undefined,
  className: undefined,
  textareaClassName: undefined,
  rows: 4
};

export default Textarea;
