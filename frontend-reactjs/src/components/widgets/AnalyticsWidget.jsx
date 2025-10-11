import PropTypes from 'prop-types';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Button } from '../ui/index.js';
import './widgets.css';

export default function AnalyticsWidget({
  title,
  subtitle,
  badge,
  actions,
  footer,
  size,
  children,
  className
}) {
  return (
    <motion.section
      className={clsx('fx-widget', className)}
      data-size={size}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
    >
      <div className="fx-widget__header">
        <div>
          {badge ? <span className="fx-widget__badge">{badge}</span> : null}
          <h3 className="fx-widget__title">{title}</h3>
          {subtitle ? <p className="fx-widget__subtitle">{subtitle}</p> : null}
        </div>
        {actions?.length ? (
          <div className="flex flex-wrap items-center gap-2">
            {actions.map(({ label, variant, ...buttonProps }) => (
              <Button
                key={label}
                variant={variant ?? 'secondary'}
                size="sm"
                {...buttonProps}
              >
                {label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      {children}

      {footer ? <footer className="fx-widget__footer">{footer}</footer> : null}
    </motion.section>
  );
}

AnalyticsWidget.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.node,
  badge: PropTypes.node,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'ghost', 'danger'])
    })
  ),
  footer: PropTypes.node,
  size: PropTypes.oneOf(['md', 'lg']),
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

AnalyticsWidget.defaultProps = {
  subtitle: undefined,
  badge: undefined,
  actions: undefined,
  footer: undefined,
  size: 'md',
  className: undefined
};
