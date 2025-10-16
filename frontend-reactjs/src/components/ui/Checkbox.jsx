import { forwardRef, useId } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import './ui.css';

const Checkbox = forwardRef(function Checkbox(
  { id, label, children, className, description, ...rest },
  ref
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const labelContent = label ?? children;

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
        {labelContent}
        {description ? (
          <span className="block text-xs font-normal text-slate-500">{description}</span>
        ) : null}
      </span>
    </label>
  );
});

Checkbox.propTypes = {
  id: PropTypes.string,
  label: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  description: PropTypes.node
};

Checkbox.defaultProps = {
  id: undefined,
  label: undefined,
  children: undefined,
  className: undefined,
  description: undefined
};

export default Checkbox;
