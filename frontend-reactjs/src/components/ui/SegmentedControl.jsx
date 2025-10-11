import PropTypes from 'prop-types';
import clsx from 'clsx';
import './ui.css';

export default function SegmentedControl({
  name,
  value,
  options,
  onChange,
  size,
  className
}) {
  const handleKeyDown = (event, index) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const next = (index + 1) % options.length;
      onChange(options[next].value);
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = (index - 1 + options.length) % options.length;
      onChange(options[prev].value);
    }
  };

  return (
    <div
      className={clsx('fx-segmented-control', className)}
      role="radiogroup"
      aria-label={name}
      data-size={size}
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          className="fx-segmented-control__option"
          data-selected={value === option.value}
          role="radio"
          aria-checked={value === option.value}
          aria-setsize={options.length}
          aria-posinset={index + 1}
          tabIndex={value === option.value ? 0 : -1}
          onClick={() => onChange(option.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

SegmentedControl.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  size: PropTypes.oneOf(['sm', 'md']),
  className: PropTypes.string
};

SegmentedControl.defaultProps = {
  size: 'md',
  className: undefined
};
