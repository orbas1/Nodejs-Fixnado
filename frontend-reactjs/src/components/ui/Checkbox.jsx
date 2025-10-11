import { forwardRef, useId } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import './ui.css';

const Checkbox = forwardRef(function Checkbox({ id, label, className, description, ...rest }, ref) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <label htmlFor={fieldId} className={clsx('fx-checkbox', className)}>
      <input
        {...rest}
        ref={ref}
        id={fieldId}
        type="checkbox"
        className="fx-checkbox__input"
      />
      <span>
        {label}
        {description ? (
          <span className="block text-xs font-normal text-slate-500">{description}</span>
        ) : null}
      </span>
    </label>
  );
});

Checkbox.propTypes = {
  id: PropTypes.string,
  label: PropTypes.node.isRequired,
  className: PropTypes.string,
  description: PropTypes.node
};

Checkbox.defaultProps = {
  id: undefined,
  className: undefined,
  description: undefined
};

export default Checkbox;
