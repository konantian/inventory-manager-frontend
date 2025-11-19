'use client';

import { useEffect } from 'react';
import { XIcon, AlertCircleIcon, CheckCircleIcon, InfoIcon } from 'lucide-react';

interface ToastProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  variant?: 'success' | 'error' | 'info';
  duration?: number;
}

export function Toast({
  isOpen,
  onClose,
  message,
  variant = 'info',
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    success: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-400/40',
      text: 'text-emerald-100',
      icon: CheckCircleIcon,
    },
    error: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-400/40',
      text: 'text-rose-100',
      icon: AlertCircleIcon,
    },
    info: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-400/40',
      text: 'text-cyan-100',
      icon: InfoIcon,
    },
  };

  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className={`flex max-w-md items-start gap-3 rounded-2xl border ${styles.border} ${styles.bg} p-4 shadow-2xl backdrop-blur-sm`}>
        <Icon className={`h-5 w-5 flex-shrink-0 ${styles.text}`} />
        <p className={`flex-1 text-sm ${styles.text}`}>{message}</p>
        <button
          onClick={onClose}
          className={`flex-shrink-0 rounded-lg p-1 hover:bg-white/10 ${styles.text}`}
          aria-label="Close"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
