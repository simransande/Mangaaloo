'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Icon from '@/components/ui/AppIcon';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl animate-slideInRight min-w-[300px] ${
              toast.type === 'success'
                ? 'bg-green-600 text-white'
                : toast.type === 'error'
                  ? 'bg-red-600 text-white'
                  : toast.type === 'warning'
                    ? 'bg-orange-500 text-white'
                    : 'bg-blue-600 text-white'
            }`}
          >
            <Icon
              name={
                toast.type === 'success'
                  ? 'CheckCircleIcon'
                  : toast.type === 'error'
                    ? 'ExclamationCircleIcon'
                    : toast.type === 'warning'
                      ? 'ExclamationTriangleIcon'
                      : 'InformationCircleIcon'
              }
              size={20}
            />
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="ml-auto hover:opacity-70 transition-opacity"
            >
              <Icon name="XMarkIcon" size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
