import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import './ui.css';

const PADDING = {
  none: null,
  sm: 'fx-card--padding-sm',
  md: 'fx-card--padding-md',
  lg: 'fx-card--padding-lg'
};

const Card = forwardRef(function Card({ as, padding, interactive, className, children, ...rest }, ref) {
  const Component = as ?? 'article';

  return (
    <Component
      ref={ref}
      className={clsx('fx-card', PADDING[padding], interactive && 'fx-card--interactive', className)}
      {...rest}
    >
      {children}
    </Component>
  );
});

Card.propTypes = {
  as: PropTypes.elementType,
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
  interactive: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

Card.defaultProps = {
  as: undefined,
  padding: 'md',
  interactive: false,
  className: undefined
};

export default Card;
