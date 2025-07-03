import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cva } from 'class-variance-authority';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

// Toast variant styles using our design tokens
const toastVariants = cva(
  'relative flex items-start p-4 rounded-lg shadow-lg border max-w-sm w-full transition-all duration-300 ease-in-out',
  {
    variants: {
      type: {
        success: 'bg-success-50 border-success-200 text-success-800',
        error: 'bg-error-50 border-error-200 text-error-800',
        warning: 'bg-warning-50 border-warning-200 text-warning-800',
        info: 'bg-primary-50 border-primary-200 text-primary-800'
      },
      position: {
        'top-right': 'animate-slide-in-right',
        'top-left': 'animate-slide-in-left',
        'bottom-right': 'animate-slide-in-up',
        'bottom-left': 'animate-slide-in-up'
      }
    },
    defaultVariants: {
      type: 'info',
      position: 'top-right'
    }
  }
);

// Toast Context
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Individual Toast Component
const Toast = ({ 
  id, 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  position = 'top-right',
  onClose,
  action
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const icons = {
    success: <CheckCircleIcon className="h-5 w-5 text-success-500" />,
    error: <ExclamationCircleIcon className="h-5 w-5 text-error-500" />,
    warning: <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />,
    info: <InformationCircleIcon className="h-5 w-5 text-primary-500" />
  };

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.(id);
    }, 300);
  }, [id, onClose]);

  // Auto-dismiss after duration
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  if (!isVisible) return null;

  return (
    <div
      className={toastVariants({ 
        type, 
        position,
        className: isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      })}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {icons[type]}
      </div>

      {/* Content */}
      <div className="ml-3 flex-1">
        {title && (
          <h4 className="text-sm font-medium mb-1">
            {title}
          </h4>
        )}
        {message && (
          <p className="text-sm opacity-90">
            {message}
          </p>
        )}
        {action && (
          <div className="mt-2">
            {action}
          </div>
        )}
      </div>

      {/* Close Button */}
      <div className="ml-4 flex-shrink-0">
        <button
          onClick={handleClose}
          className="inline-flex rounded-md p-1.5 hover:bg-black hover:bg-opacity-10 transition-colors"
          aria-label="Close notification"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, position = 'top-right' }) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className={`fixed z-toast pointer-events-none ${positionClasses[position]}`}
      aria-live="polite"
      aria-label="Notifications"
    >
      <div className="flex flex-col space-y-3 pointer-events-auto">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} position={position} />
        ))}
      </div>
    </div>,
    document.body
  );
};

// Toast Provider Component
export const ToastProvider = ({ children, position = 'top-right', maxToasts = 5 }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { id, ...toast };

    setToasts((prevToasts) => {
      const updatedToasts = [newToast, ...prevToasts];
      // Limit the number of toasts
      return updatedToasts.slice(0, maxToasts);
    });

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const toast = useCallback((message, options = {}) => {
    return addToast({ message, type: 'info', ...options });
  }, [addToast]);

  const success = useCallback((message, options = {}) => {
    return addToast({ message, type: 'success', ...options });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast({ message, type: 'error', duration: 0, ...options }); // Error toasts don't auto-dismiss
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({ message, type: 'warning', ...options });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast({ message, type: 'info', ...options });
  }, [addToast]);

  const promise = useCallback(async (promiseOrFunction, options = {}) => {
    const {
      loading = 'Loading...',
      success: successMessage = 'Success!',
      error: errorMessage = 'Something went wrong'
    } = options;

    // Show loading toast
    const loadingToastId = addToast({
      message: loading,
      type: 'info',
      duration: 0 // Don't auto-dismiss loading toast
    });

    try {
      const result = typeof promiseOrFunction === 'function' 
        ? await promiseOrFunction() 
        : await promiseOrFunction;

      // Remove loading toast
      removeToast(loadingToastId);

      // Show success toast
      addToast({
        message: typeof successMessage === 'function' ? successMessage(result) : successMessage,
        type: 'success'
      });

      return result;
    } catch (err) {
      // Remove loading toast
      removeToast(loadingToastId);

      // Show error toast
      addToast({
        message: typeof errorMessage === 'function' ? errorMessage(err) : errorMessage,
        type: 'error',
        duration: 0
      });

      throw err;
    }
  }, [addToast, removeToast]);

  const contextValue = {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    toast,
    success,
    error,
    warning,
    info,
    promise
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer 
        toasts={toasts} 
        position={position}
        onClose={removeToast}
      />
    </ToastContext.Provider>
  );
};

// Hook for programmatic toast usage
export const useToastActions = () => {
  const { toast, success, error, warning, info, promise } = useToast();
  
  return {
    toast,
    success,
    error,
    warning,
    info,
    promise
  };
};

export default Toast;
