import PropTypes from 'prop-types';
import clsx from 'clsx';
import './ui.css';

export default function Skeleton({ className }) {
  return <div className={clsx('fx-skeleton', className)} aria-hidden="true" />;
}

Skeleton.propTypes = {
  className: PropTypes.string
};

Skeleton.defaultProps = {
  className: undefined
};
