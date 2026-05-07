import { useState } from 'react';
import Icon from '@/components/ui/icon';
import NotificationsModal from './NotificationsModal';

const REPORT_URLS = {
  morning: 'https://functions.poehali.dev/5d514447-0fd5-409b-a255-3b0800e93eaf',
  daily: 'https://functions.poehali.dev/109690f5-6a72-42e2-b8ba-3eb705cba518',
};

interface AdminHeaderProps {
  onLogout: () => void;
  onOpenGoogleSheets: () => void;
  onGoHome?: () => void;
  showHomeButton?: boolean;
  hideTitle?: boolean;
}

export default function AdminHeader({ onLogout, onOpenGoogleSheets, onGoHome, showHomeButton = false, hideTitle = false }: AdminHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingReport, setLoadingReport] = useState<'morning' | 'daily' | null>(null);

  const sendReport = async (type: 'morning' | 'daily') => {
    setLoadingReport(type);
    try {
      await fetch(REPORT_URLS[type]);
    } finally {
      setLoadingReport(null);
    }
  };

  return (
    <>
      <header className="pt-4 mb-5 flex items-center justify-between px-1">
        {!hideTitle ? (
          <div>
            <div className="text-base font-bold text-[#001f54] tracking-wide leading-none">ИМПЕРИЯ ПРОМО</div>
            <div className="text-[11px] text-gray-400 leading-none mt-0.5">рекламное агентство</div>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1.5">
          {showHomeButton && onGoHome && (
            <button
              onClick={onGoHome}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <Icon name="Home" size={16} className="text-gray-600" />
            </button>
          )}
          <button
            onClick={() => sendReport('morning')}
            disabled={loadingReport !== null}
            className="w-9 h-9 rounded-xl bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-colors disabled:opacity-50"
            title="Утренний отчёт"
          >
            {loadingReport === 'morning' ? <Icon name="Loader2" size={16} className="text-amber-600 animate-spin" /> : <Icon name="Sun" size={16} className="text-amber-600" />}
          </button>
          <button
            onClick={() => sendReport('daily')}
            disabled={loadingReport !== null}
            className="w-9 h-9 rounded-xl bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors disabled:opacity-50"
            title="Вечерний отчёт"
          >
            {loadingReport === 'daily' ? <Icon name="Loader2" size={16} className="text-blue-600 animate-spin" /> : <Icon name="Moon" size={16} className="text-blue-600" />}
          </button>
          <button
            onClick={() => setShowNotifications(true)}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            title="Уведомления"
          >
            <Icon name="Bell" size={16} className="text-gray-600" />
          </button>
          <button
            onClick={onOpenGoogleSheets}
            className="h-9 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center gap-2 transition-colors"
          >
            <Icon name="Sheet" size={15} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-600 hidden sm:inline">Google Таблицы</span>
          </button>
          <button
            onClick={onLogout}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-50 flex items-center justify-center transition-colors group"
          >
            <Icon name="LogOut" size={16} className="text-gray-500 group-hover:text-red-500 transition-colors" />
          </button>
        </div>
      </header>

      {showNotifications && <NotificationsModal onClose={() => setShowNotifications(false)} />}
    </>
  );
}