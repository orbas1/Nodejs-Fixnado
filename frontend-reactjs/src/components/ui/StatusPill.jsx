import PropTypes from 'prop-types';
import clsx from 'clsx';
import './ui.css';

const TONES = ['neutral', 'success', 'warning', 'danger', 'info'];

export default function StatusPill({ tone = 'neutral', icon: Icon, children }) {
  return (
    <span className={clsx('fx-status-pill', `fx-status-pill--${tone}`)} role="status">
      {Icon ? <Icon aria-hidden="true" className="h-3.5 w-3.5" /> : null}
      <span>{children}</span>
    </span>
  );
}

StatusPill.propTypes = {
  tone: PropTypes.oneOf(TONES),
  icon: PropTypes.elementType,
  children: PropTypes.node.isRequired
};

