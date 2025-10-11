import clsx from 'clsx';
import PropTypes from 'prop-types';
import './ui.css';

export default function Spinner({ size, className, 'aria-label': ariaLabel }) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={clsx('fx-btn__spinner', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="0.8s"
            repeatCount="indefinite"
          />
        </path>
      </svg>
    </span>
  );
}

Spinner.propTypes = {
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  'aria-label': PropTypes.string
};

Spinner.defaultProps = {
  size: '1.25rem',
  className: undefined,
  'aria-label': 'Loading'
};
