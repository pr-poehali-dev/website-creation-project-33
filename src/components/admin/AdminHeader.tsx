import { useState } from 'react';
import Icon from '@/components/ui/icon';
import NotificationsModal from './NotificationsModal';

const REPORT_URLS = {
  morning: 'https://functions.poehali.dev/5d514447-0fd5-409b-a255-3b0800e93eaf',
  daily: 'https://functions.poehali.dev/109690f5-6a72-42e2-b8ba-3eb705cba518',
};

const BALANCE_URL = 'https://functions.poehali.dev/945a47ed-f216-41cf-876b-d73b6f52586e';

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
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceData, setBalanceData] = useState<{x: number; y: number; y_kms: number; y_salary: number; balance: number} | null>(null);
  const [showBalance, setShowBalance] = useState(false);

  const sendReport = async (type: 'morning' | 'daily') => {
    setLoadingReport(type);
    try {
      await fetch(REPORT_URLS[type]);
    } finally {
      setLoadingReport(null);
    }
  };

  const fetchBalance = async () => {
    if (showBalance) { setShowBalance(false); return; }
    setLoadingBalance(true);
    try {
      const res = await fetch(BALANCE_URL);
      const data = await res.json();
      setBalanceData(data);
      setShowBalance(true);
    } finally {
      setLoadingBalance(false);
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
          <a
            href="#"
            className="w-9 h-9 rounded-xl bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors"
            title="Скачать приложение Android v1.0"
          >
            <Icon name="Smartphone" size={16} className="text-green-600" />
          </a>
          <div className="relative">
            <button
              onClick={fetchBalance}
              disabled={loadingBalance}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 ${showBalance ? 'bg-emerald-100 hover:bg-emerald-200' : 'bg-gray-100 hover:bg-gray-200'}`}
              title="Баланс X-Y"
            >
              {loadingBalance
                ? <Icon name="Loader2" size={16} className="text-emerald-600 animate-spin" />
                : <Icon name="Scale" size={16} className={showBalance ? 'text-emerald-600' : 'text-gray-600'} />
              }
            </button>
            {showBalance && balanceData && (
              <div className="absolute top-11 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50 min-w-[200px] text-xs">
                <div className="text-gray-500 mb-1">X (долг КВВ → КМС)</div>
                <div className="font-bold text-gray-800 mb-2">{balanceData.x.toLocaleString('ru-RU')} ₽</div>
                <div className="text-gray-500 mb-1">Y (долг КМС → КВВ + исполн.)</div>
                <div className="font-bold text-gray-800">{balanceData.y.toLocaleString('ru-RU')} ₽</div>
                <div className="text-gray-400 mb-2">КВВ {balanceData.y_kms.toLocaleString('ru-RU')} ₽ + исполн. {balanceData.y_salary.toLocaleString('ru-RU')} ₽</div>
                <div className="border-t border-gray-100 pt-2 mt-1">
                  <div className="text-gray-500 mb-1">X − Y</div>
                  <div className={`font-bold text-base ${balanceData.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {balanceData.balance >= 0 ? '+' : ''}{balanceData.balance.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              </div>
            )}
          </div>
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