import React from 'react';
import { Toast as ToastType } from '../types';
import Toast from './Toast';

interface ToastContainerProps {
  toasts: ToastType[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-20 right-2 sm:right-4 z-50 w-full max-w-sm sm:max-w-sm px-2 sm:px-0 space-y-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
