import React from 'react';

interface AlertBannerProps {
  type?: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose?: () => void;
}

const COLORS: Record<NonNullable<AlertBannerProps['type']>, string> = {
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  error: 'bg-red-50 text-red-800 border-red-200',
};

const AlertBanner: React.FC<AlertBannerProps> = ({ type = 'info', message, onClose }) => {
  const colorClass = COLORS[type];

  return (
    <div className={`border ${colorClass} rounded-md px-4 py-3 flex items-start justify-between gap-3`} role="status">
      <div className="flex-1 text-sm font-medium">{message}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-inherit underline-offset-2 hover:underline"
        >
          Fechar
        </button>
      )}
    </div>
  );
};

export default AlertBanner;
