import { createPortal } from 'react-dom';
import { useEffect, useId, useRef } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import './ui.css';

function noop() {}

export default function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  size,
  labelledBy
}) {
  const dialogRef = useRef(null);
  const internalId = useId();
  const headerId = labelledBy || `${internalId}-title`;
  const descriptionId = description ? `${internalId}-description` : undefined;

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      dialogRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!open) {
    return null;
  }

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div className="fx-modal-backdrop" onClick={handleBackdropClick}>
      <div
        ref={dialogRef}
        className={clsx('fx-modal', size && `fx-modal--${size}`)}
        role="dialog"
        tabIndex="-1"
        aria-modal="true"
        aria-labelledby={headerId}
        aria-describedby={descriptionId}
      >
        <div className="fx-modal__header">
          <h2 id={headerId} className="fx-modal__title">
            {title}
          </h2>
          <button type="button" className="fx-modal__close" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>
        {description ? (
          <p id={descriptionId} className="fx-modal__description">
            {description}
          </p>
        ) : null}
        <div className="fx-modal__body">{children}</div>
        {footer ? <div className="fx-modal__footer">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  onClose: PropTypes.func,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  labelledBy: PropTypes.string
};

Modal.defaultProps = {
  description: undefined,
  footer: undefined,
  onClose: noop,
  size: 'md',
  labelledBy: undefined
};
