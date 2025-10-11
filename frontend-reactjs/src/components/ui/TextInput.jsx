import { forwardRef, useId } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import './ui.css';

const TextInput = forwardRef(
  (
    {
      id,
      label,
      optionalLabel,
      hint,
      error,
      prefix,
      suffix,
      type,
      className,
      inputClassName,
      ...rest
    },
    ref
  ) => {
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
        <div className="fx-text-input-wrapper">
          {prefix ? (
            <span className="fx-text-input__affix fx-text-input__affix--prefix" aria-hidden="true">
              {prefix}
            </span>
          ) : null}
          <input
            ref={ref}
            id={fieldId}
            type={type}
            className={clsx('fx-text-input', error && 'fx-text-input--error', inputClassName)}
            style={{
              paddingLeft: prefix ? '3rem' : undefined,
              paddingRight: suffix ? '3rem' : undefined
            }}
            aria-describedby={describedBy.join(' ') || undefined}
            aria-invalid={Boolean(error)}
            {...rest}
          />
          {suffix ? (
            <span className="fx-text-input__affix fx-text-input__affix--suffix" aria-hidden="true">
              {suffix}
            </span>
          ) : null}
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
  }
);

TextInput.displayName = 'TextInput';

TextInput.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  optionalLabel: PropTypes.string,
  hint: PropTypes.string,
  error: PropTypes.string,
  prefix: PropTypes.node,
  suffix: PropTypes.node,
  type: PropTypes.string,
  className: PropTypes.string,
  inputClassName: PropTypes.string
};

TextInput.defaultProps = {
  id: undefined,
  label: undefined,
  optionalLabel: undefined,
  hint: undefined,
  error: undefined,
  prefix: undefined,
  suffix: undefined,
  type: 'text',
  className: undefined,
  inputClassName: undefined
};

export default TextInput;
