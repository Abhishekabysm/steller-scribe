import React, { useEffect, useState } from 'react';
import { Toast as ToastType } from '../types';
import { FaXmark } from 'react-icons/fa6';
import { FaRegStar } from 'react-icons/fa';

interface ToastProps {
  toast: ToastType;
  removeToast: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, removeToast }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, 4500); // Start exit animation before removal

    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsExiting(true);
  };
  
  const handleAnimationEnd = () => {
      if (isExiting) {
          removeToast(toast.id);
      }
  }

  const bgColors = {
    success: 'bg-green-500/95 dark:bg-green-600/95',
    error: 'bg-red-500/95 dark:bg-red-600/95',
    info: 'bg-accent/95 dark:bg-dark-accent/95',
  };

  return (
    <div
      onAnimationEnd={handleAnimationEnd}
      className={`relative w-full max-w-sm rounded-md shadow-lg text-white ${bgColors[toast.type]} ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}`}
      role="alert"
    >
      <div className="flex items-center p-4">
        <FaRegStar className="w-6 h-6 mr-3 flex-shrink-0" />
        <p className="flex-grow text-sm font-medium">{toast.message}</p>
        <button
          onClick={handleRemove}
          className="ml-4 p-1 rounded-full hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Close"
        >
          <FaXmark className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
