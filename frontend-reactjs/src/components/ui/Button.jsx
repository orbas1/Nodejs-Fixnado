import { forwardRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import Spinner from './Spinner.jsx';
import './ui.css';

const VARIANTS = ['primary', 'secondary', 'tertiary', 'ghost', 'danger'];
const SIZES = ['sm', 'md', 'lg'];

function renderIcon(Icon, position) {
  if (!Icon) {
    return null;
  }

  return <Icon aria-hidden="true" className="fx-btn__icon" data-slot={position} />;
}

const Button = forwardRef(
  (
    {
      as,
      to,
      href,
      type,
      variant,
      size,
      children,
      icon: Icon,
      iconPosition,
      loading,
      disabled,
      className,
      analyticsId,
      tabIndex,
      onClick,
      ...rest
    },
    ref
  ) => {
    const Component = useMemo(() => {
      if (as) return as;
      if (to) return Link;
      if (href) return 'a';
      return 'button';
    }, [as, href, to]);

    const isDisabled = disabled || loading;

    const handleClick = (event) => {
      if (isDisabled && (Component === Link || Component === 'a')) {
        event.preventDefault();
        return;
      }

      if (onClick) {
        onClick(event);
      }
    };

    return (
      <Component
        ref={ref}
        to={Component === Link ? to : undefined}
        href={Component === 'a' ? href : undefined}
        type={Component === 'button' ? type : undefined}
        aria-disabled={Component !== 'button' ? isDisabled : undefined}
        disabled={Component === 'button' ? isDisabled : undefined}
        data-variant={variant}
        data-size={size}
        data-state={loading ? 'loading' : 'ready'}
        data-action={analyticsId}
        className={clsx('fx-btn', `fx-btn--${variant}`, `fx-btn--${size}`, loading && 'fx-btn--loading', className)}
        onClick={handleClick}
        tabIndex={isDisabled && Component !== 'button' ? -1 : tabIndex}
        {...rest}
      >
        {loading ? <Spinner aria-label="Loading" /> : iconPosition === 'start' && renderIcon(Icon, 'start')}
        <span className="fx-btn__label">{children}</span>
        {iconPosition === 'end' && !loading && renderIcon(Icon, 'end')}
      </Component>
    );
  }
);

Button.displayName = 'Button';

Button.propTypes = {
  as: PropTypes.elementType,
  to: PropTypes.string,
  href: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf(VARIANTS),
  size: PropTypes.oneOf(SIZES),
  children: PropTypes.node.isRequired,
  icon: PropTypes.elementType,
  iconPosition: PropTypes.oneOf(['start', 'end']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  analyticsId: PropTypes.string,
  tabIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onClick: PropTypes.func
};

Button.defaultProps = {
  as: undefined,
  to: undefined,
  href: undefined,
  type: 'button',
  variant: 'primary',
  size: 'md',
  icon: undefined,
  iconPosition: 'start',
  loading: false,
  disabled: false,
  className: undefined,
  analyticsId: undefined,
  tabIndex: undefined,
  onClick: undefined
};

export default Button;
