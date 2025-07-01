import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cva } from 'class-variance-authority';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from './Button';

// Modal variant styles using our design tokens
const modalVariants = cva(
  'relative bg-surface rounded-modal shadow-modal border border-default',
  {
    variants: {
      size: {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-7xl'
      }
    },
    defaultVariants: {
      size: 'md'
    }
  }
);

// Modal Overlay Component
const ModalOverlay = ({ children, onClose, closeOnOverlayClick = true }) => {
  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className="w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

// Main Modal Component
export const Modal = ({
  isOpen = false,
  onClose,
  size = 'md',
  title,
  description,
  children,
  footer,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  ...props
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      modalRef.current?.focus();
    } else {
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <ModalOverlay onClose={onClose} closeOnOverlayClick={closeOnOverlayClick}>
      <div
        ref={modalRef}
        className={modalVariants({ size, className })}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
        tabIndex={-1}
        {...props}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-default">
            <div>
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold text-primary">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="mt-1 text-sm text-secondary">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-text-tertiary hover:text-primary transition-colors p-1 rounded-md hover:bg-surface-hover"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-default bg-background-secondary rounded-b-modal">
            {footer}
          </div>
        )}
      </div>
    </ModalOverlay>
  );

  return createPortal(modalContent, document.body);
};

// Confirmation Modal Component
export const ConfirmModal = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger', 'warning', 'primary'
  loading = false,
  ...props
}) => {
  const handleConfirm = async () => {
    await onConfirm?.();
  };

  const footer = (
    <>
      <Button
        variant="ghost"
        onClick={onClose}
        disabled={loading}
      >
        {cancelText}
      </Button>
      <Button
        variant={variant}
        onClick={handleConfirm}
        loading={loading}
      >
        {confirmText}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      size="sm"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
      {...props}
    >
      <p className="text-secondary">{message}</p>
    </Modal>
  );
};

// Alert Modal Component
export const AlertModal = ({
  isOpen = false,
  onClose,
  title,
  message,
  type = 'info', // 'info', 'success', 'warning', 'error'
  buttonText = 'OK',
  ...props
}) => {
  const icons = {
    info: (
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
        <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
    success: (
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-100">
        <svg className="h-6 w-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    warning: (
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100">
        <svg className="h-6 w-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
    ),
    error: (
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error-100">
        <svg className="h-6 w-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    )
  };

  const footer = (
    <Button onClick={onClose} variant="primary" fullWidth>
      {buttonText}
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      size="sm"
      showCloseButton={false}
      {...props}
    >
      <div className="text-center">
        {icons[type]}
        <div className="mt-4">
          <p className="text-secondary">{message}</p>
        </div>
      </div>
    </Modal>
  );
};

// Drawer Component (slide-in modal)
export const Drawer = ({
  isOpen = false,
  onClose,
  position = 'right', // 'left', 'right', 'top', 'bottom'
  size = 'md',
  title,
  children,
  footer,
  className = '',
  ...props
}) => {
  const drawerRef = useRef(null);

  const positionClasses = {
    left: 'left-0 top-0 h-full',
    right: 'right-0 top-0 h-full',
    top: 'top-0 left-0 w-full',
    bottom: 'bottom-0 left-0 w-full'
  };

  const sizeClasses = {
    sm: position === 'left' || position === 'right' ? 'w-80' : 'h-80',
    md: position === 'left' || position === 'right' ? 'w-96' : 'h-96',
    lg: position === 'left' || position === 'right' ? 'w-[32rem]' : 'h-[32rem]',
    xl: position === 'left' || position === 'right' ? 'w-[40rem]' : 'h-[40rem]'
  };

  const slideClasses = {
    left: isOpen ? 'translate-x-0' : '-translate-x-full',
    right: isOpen ? 'translate-x-0' : 'translate-x-full',
    top: isOpen ? 'translate-y-0' : '-translate-y-full',
    bottom: isOpen ? 'translate-y-0' : 'translate-y-full'
  };

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      drawerRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const drawerContent = (
    <div className="fixed inset-0 z-modal">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`
          absolute bg-surface shadow-modal border border-default
          transform transition-transform duration-300 ease-in-out
          ${positionClasses[position]}
          ${sizeClasses[size]}
          ${slideClasses[position]}
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
        tabIndex={-1}
        {...props}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-default">
            <h2 id="drawer-title" className="text-lg font-semibold text-primary">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-primary transition-colors p-1 rounded-md hover:bg-surface-hover"
              aria-label="Close drawer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-default p-6 bg-background-secondary">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};

export default Modal;
