import { forwardRef, useId } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import './ui.css';

const TextArea = forwardRef(function TextArea(
  { id, label, optionalLabel, hint, error, rows, className, textareaClassName, ...rest },
  { id, label, hint, error, className, inputClassName, rows = 6, ...rest },
  { id, label, optionalLabel, hint, error, rows, className, inputClassName, ...rest },
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
          {optionalLabel ? <span className="fx-field__optional">{optionalLabel}</span> : null}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        className={clsx('fx-text-input fx-text-area', error && 'fx-text-input--error', textareaClassName)}
        className={clsx('fx-textarea', error && 'fx-textarea--error', inputClassName)}
        aria-describedby={describedBy.join(' ') || undefined}
        aria-invalid={Boolean(error)}
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

TextArea.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  hint: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  rows: PropTypes.number
  optionalLabel: PropTypes.string,
  hint: PropTypes.string,
  error: PropTypes.string,
  rows: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string,
  textareaClassName: PropTypes.string
  inputClassName: PropTypes.string
};

TextArea.defaultProps = {
  id: undefined,
  label: undefined,
  hint: undefined,
  error: undefined,
  className: undefined,
  inputClassName: undefined,
  rows: 6
  optionalLabel: undefined,
  hint: undefined,
  error: undefined,
  rows: 4,
  className: undefined,
  textareaClassName: undefined
  inputClassName: undefined
};

export default TextArea;
